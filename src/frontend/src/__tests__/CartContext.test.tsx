import { CartProvider, itemKey, useCartContext } from "@/contexts/CartContext";
import type { CartItem } from "@/contexts/CartContext";
import { configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// This suite's harness uses data-testid. Testing Library's testIdAttribute is
// global process state and Vitest runs every file in a single fork, so other
// suites that call configure({ testIdAttribute: "data-ocid" }) would otherwise
// leak into this file depending on run order. Declare the expectation here so
// the suite is order-independent.
configure({ testIdAttribute: "data-testid" });

const personalTrack: CartItem = {
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

const commercialTrack: CartItem = {
  kind: "track",
  trackId: BigInt(2),
  licenseTierId: BigInt(2),
  title: "Cumbia Sunrise",
  artist: "Ritmo Raíz",
  coverUrl: "",
  licenseName: "Commercial",
  priceCents: 2999,
  quantity: 1,
};

const customMusic: CartItem = {
  kind: "customMusic",
  title: "Custom Music — Ritmo Raíz",
  priceCents: 11999,
  quantity: 1,
};

function Harness() {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotalCents,
    count,
    coupon,
    applyCoupon,
    removeCoupon,
    discountCents,
    totalCents,
    toBackendItems,
  } = useCartContext();

  return (
    <div>
      <p data-testid="count">{count}</p>
      <p data-testid="subtotal">{subtotalCents}</p>
      <p data-testid="discount">{discountCents}</p>
      <p data-testid="total">{totalCents}</p>
      <p data-testid="coupon">{coupon ? coupon.code : "none"}</p>
      <p data-testid="items">{items.map(itemKey).join(",")}</p>
      <p data-testid="backend">
        {JSON.stringify(toBackendItems(), (_k, v) =>
          typeof v === "bigint" ? v.toString() : v,
        )}
      </p>
      <button type="button" onClick={() => addItem(personalTrack)}>
        add personal
      </button>
      <button type="button" onClick={() => addItem(commercialTrack)}>
        add commercial
      </button>
      <button type="button" onClick={() => addItem(customMusic)}>
        add custom
      </button>
      <button type="button" onClick={() => removeItem(itemKey(personalTrack))}>
        remove personal
      </button>
      <button
        type="button"
        onClick={() => updateQuantity(itemKey(commercialTrack), 3)}
      >
        set commercial qty 3
      </button>
      <button type="button" onClick={() => clearCart()}>
        clear
      </button>
      <button
        type="button"
        onClick={() =>
          applyCoupon({
            code: "SAVE25",
            discountType: "percentage",
            amount: 25,
          })
        }
      >
        apply 25%
      </button>
      <button
        type="button"
        onClick={() =>
          applyCoupon({ code: "FIVE", discountType: "fixed", amount: 500 })
        }
      >
        apply $5
      </button>
      <button type="button" onClick={() => removeCoupon()}>
        remove coupon
      </button>
    </div>
  );
}

function renderHarness() {
  return render(
    <CartProvider>
      <Harness />
    </CartProvider>,
  );
}

// The cart's persistence effect calls JSON.stringify on items that contain
// BigInt track/license ids, which throws "Do not know how to serialize a
// BigInt". That is a product regression in CartContext (the cart cannot be
// persisted). To still verify the cart arithmetic and coupon logic, the
// JSON.stringify call is stubbed here with a BigInt-safe replacer; the
// dedicated persistence test below restores the real implementation to expose
// the regression.
let stringifySpy: ReturnType<typeof vi.spyOn>;
const originalStringify = JSON.stringify.bind(JSON);

beforeEach(() => {
  localStorage.clear();
  stringifySpy = vi
    .spyOn(JSON, "stringify")
    .mockImplementation((value: unknown) =>
      originalStringify(value, (_k, v) =>
        typeof v === "bigint" ? v.toString() : v,
      ),
    ) as ReturnType<typeof vi.spyOn>;
});

afterEach(() => {
  stringifySpy.mockRestore();
});

describe("CartContext", () => {
  it("adds multiple tracks with different license tiers and sums the subtotal", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText("add personal"));
    await user.click(screen.getByText("add commercial"));

    // 499 + 2999 = 3498 cents
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("3498");
    expect(screen.getByTestId("total")).toHaveTextContent("3498");
    // Each line is keyed by track + license tier, so both are distinct lines.
    expect(screen.getByTestId("items")).toHaveTextContent(
      "track-1-1,track-2-2",
    );
  });

  it("increments quantity when the same track+tier is added again", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText("add personal"));
    await user.click(screen.getByText("add personal"));

    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("998");
    expect(screen.getByTestId("items")).toHaveTextContent("track-1-1");
  });

  it("applies a percentage coupon to the whole-cart total", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText("add personal"));
    await user.click(screen.getByText("add commercial"));
    await user.click(screen.getByText("apply 25%"));

    // 25% of 3498 = 874.5 -> rounds to 875
    expect(screen.getByTestId("discount")).toHaveTextContent("875");
    expect(screen.getByTestId("total")).toHaveTextContent("2623");
    expect(screen.getByTestId("coupon")).toHaveTextContent("SAVE25");
  });

  it("applies a fixed coupon to the whole-cart total", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText("add personal"));
    await user.click(screen.getByText("add commercial"));
    await user.click(screen.getByText("apply $5"));

    // 3498 - 500 = 2998
    expect(screen.getByTestId("discount")).toHaveTextContent("500");
    expect(screen.getByTestId("total")).toHaveTextContent("2998");
  });

  it("clears the cart and coupon on clearCart", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText("add personal"));
    await user.click(screen.getByText("apply 25%"));
    await user.click(screen.getByText("clear"));

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("0");
    expect(screen.getByTestId("coupon")).toHaveTextContent("none");
  });

  it("maps cart items to backend CartItem shape", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText("add personal"));
    await user.click(screen.getByText("add custom"));

    const backend = JSON.parse(screen.getByTestId("backend").textContent ?? "");
    expect(backend).toEqual([
      {
        __kind__: "track",
        track: { trackId: "1", licenseTierId: "1" },
      },
      { __kind__: "customMusic", customMusic: {} },
    ]);
  });

  it("persists the cart across a remount (page refresh / restart)", async () => {
    // Restore the real JSON.stringify so this test exercises the actual
    // persistence path. The cart contains BigInt ids, so JSON.stringify throws
    // here — this documents the CartContext persistence regression.
    stringifySpy.mockRestore();

    const user = userEvent.setup();
    const { unmount } = renderHarness();

    await user.click(screen.getByText("add personal"));
    await user.click(screen.getByText("add commercial"));

    unmount();
    renderHarness();

    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("3498");
  });
});
