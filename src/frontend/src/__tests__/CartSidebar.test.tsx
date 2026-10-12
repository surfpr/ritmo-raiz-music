import type { Coupon } from "@/backend";
import { CartSidebar } from "@/components/CartSidebar";
import { CartProvider, useCartContext } from "@/contexts/CartContext";
import type { CartItem } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { configure, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The generated cart components use data-ocid rather than data-testid.
configure({ testIdAttribute: "data-ocid" });

const track: CartItem = {
  kind: "track",
  trackId: BigInt(1),
  licenseTierId: BigInt(1),
  title: "Salsa Nights",
  artist: "Ritmo Raíz",
  coverUrl: "",
  licenseName: "Personal",
  priceCents: 499,
  quantity: 1,
};

const validCoupon: Coupon = {
  id: BigInt(1),
  code: "SAVE25",
  discountType: "percentage" as Coupon["discountType"],
  amount: BigInt(25),
  isActive: true,
};

const validateCoupon = vi.fn();
const checkout = vi.fn();

vi.mock("@/hooks/useQueries", () => ({
  useValidateCoupon: () => ({ mutate: validateCoupon, isPending: false }),
  useCheckout: () => ({ mutate: checkout, isPending: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Opens the cart, optionally seeding it with one track so the checkout footer
// renders.
function CartHarness() {
  const { addItem, openCart } = useCartContext();
  return (
    <>
      <button
        type="button"
        onClick={() => {
          addItem(track);
          openCart();
        }}
      >
        seed cart
      </button>
      <button type="button" onClick={openCart}>
        open empty cart
      </button>
      <CartSidebar />
    </>
  );
}

function renderCart() {
  return render(
    <LanguageProvider>
      <CartProvider>
        <CartHarness />
      </CartProvider>
    </LanguageProvider>,
  );
}

async function openSeededCart() {
  const user = userEvent.setup();
  renderCart();
  await user.click(screen.getByText("seed cart"));
  return user;
}

beforeEach(() => {
  localStorage.clear();
  validateCoupon.mockReset();
  checkout.mockReset();
});

describe("CartSidebar", () => {
  it("shows the empty state when the cart has no items", async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText("open empty cart"));

    expect(screen.getByText("Tu Carrito")).toBeInTheDocument();
    expect(
      screen.getByText("Tu carrito está vacío. Agrega música para comenzar."),
    ).toBeInTheDocument();
    // No checkout footer is rendered for an empty cart.
    expect(
      screen.queryByTestId("cart.checkout_button"),
    ).not.toBeInTheDocument();
  });

  it("renders the seeded line item, subtotal, and total", async () => {
    await openSeededCart();

    expect(screen.getByText("Tu Carrito")).toBeInTheDocument();
    expect(screen.getByText("Salsa Nights")).toBeInTheDocument();
    // The line price and the total both show $4.99 for a single unit.
    expect(screen.getAllByText("$4.99").length).toBeGreaterThan(0);
    expect(screen.getByTestId("cart.total")).toHaveTextContent("$4.99");
  });

  it("applies a valid coupon returned by the backend", async () => {
    validateCoupon.mockImplementation((_code: string, opts: any) => {
      opts.onSuccess(validCoupon);
    });
    const user = await openSeededCart();

    await user.type(screen.getByTestId("cart.coupon_input"), "SAVE25");
    await user.click(screen.getByTestId("cart.apply_coupon_button"));

    await waitFor(() => {
      expect(validateCoupon).toHaveBeenCalledWith("SAVE25", expect.anything());
    });
    // 25% of 499 = 124.75 -> rounds to 125; total 374.
    expect(screen.getByTestId("cart.coupon_applied")).toHaveTextContent(
      "SAVE25",
    );
    expect(screen.getByTestId("cart.total")).toHaveTextContent("$3.74");
  });

  it("shows an error when the coupon is invalid", async () => {
    validateCoupon.mockImplementation((_code: string, opts: any) => {
      opts.onSuccess(null);
    });
    const user = await openSeededCart();

    await user.type(screen.getByTestId("cart.coupon_input"), "NOPE");
    await user.click(screen.getByTestId("cart.apply_coupon_button"));

    await waitFor(() => {
      expect(screen.getByTestId("cart.coupon_error")).toHaveTextContent(
        "Cupón inválido o inactivo",
      );
    });
  });

  it("sends the cart items and coupon to checkout and redirects on success", async () => {
    // jsdom cannot navigate; capture the href assignment instead of letting it
    // throw "Not implemented: navigation".
    const originalLocation = window.location;
    const hrefSetter = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        origin: "https://ritmo.example",
        pathname: "/store",
        search: "",
        set href(value: string) {
          hrefSetter(value);
        },
        get href() {
          return "https://ritmo.example/store";
        },
      },
    });

    validateCoupon.mockImplementation((_code: string, opts: any) => {
      opts.onSuccess(validCoupon);
    });
    checkout.mockImplementation((_req: any, opts: any) => {
      opts.onSuccess({
        __kind__: "ok",
        ok: {
          sessionJson: JSON.stringify({ url: "https://pay.example/session" }),
        },
      });
    });
    const user = await openSeededCart();

    await user.type(screen.getByTestId("cart.coupon_input"), "SAVE25");
    await user.click(screen.getByTestId("cart.apply_coupon_button"));
    await waitFor(() => {
      expect(screen.getByTestId("cart.coupon_applied")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("cart.checkout_button"));

    await waitFor(() => {
      expect(checkout).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [
            {
              __kind__: "track",
              track: { trackId: BigInt(1), licenseTierId: BigInt(1) },
            },
          ],
          couponCode: "SAVE25",
        }),
        expect.anything(),
      );
    });
    expect(hrefSetter).toHaveBeenCalledWith("https://pay.example/session");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("surfaces a checkout error result without redirecting", async () => {
    checkout.mockImplementation((_req: any, opts: any) => {
      opts.onSuccess({
        __kind__: "err",
        err: { __kind__: "stripeNotConfigured" },
      });
    });
    const user = await openSeededCart();

    await user.click(screen.getByTestId("cart.checkout_button"));

    await waitFor(() => {
      expect(checkout).toHaveBeenCalled();
    });
    // The cart remains open with its items after a failed checkout.
    expect(screen.getByText("Salsa Nights")).toBeInTheDocument();
  });
});
