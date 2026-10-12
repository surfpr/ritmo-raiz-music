import { DiscountType } from "@/backend";
import type { Coupon } from "@/backend";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CouponsPanel } from "@/pages/admin/CouponsPanel";
import { configure, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The generated admin components use data-ocid rather than data-testid.
configure({ testIdAttribute: "data-ocid" });

const existingCoupons: Coupon[] = [
  {
    id: BigInt(1),
    code: "SAVE25",
    discountType: DiscountType.percentage,
    amount: BigInt(25),
    isActive: true,
  },
  {
    id: BigInt(2),
    code: "FIVE",
    discountType: DiscountType.fixed,
    amount: BigInt(500),
    isActive: false,
  },
];

const createCoupon = vi.fn();
const updateCoupon = vi.fn();
const deleteCoupon = vi.fn();

vi.mock("@/hooks/useQueries", () => ({
  useListCoupons: () => ({ data: existingCoupons, isLoading: false }),
  useCreateCoupon: () => ({ mutateAsync: createCoupon, isPending: false }),
  useUpdateCoupon: () => ({ mutateAsync: updateCoupon, isPending: false }),
  useDeleteCoupon: () => ({ mutateAsync: deleteCoupon, isPending: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  createCoupon.mockReset();
  updateCoupon.mockReset();
  deleteCoupon.mockReset();
  vi.stubGlobal(
    "confirm",
    vi.fn(() => true),
  );
});

function renderPanel() {
  return render(
    <LanguageProvider>
      <CouponsPanel />
    </LanguageProvider>,
  );
}

describe("CouponsPanel", () => {
  it("lists coupons with their discount type, amount, and active status", () => {
    renderPanel();

    expect(screen.getByText("SAVE25")).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes("25%")),
    ).toBeInTheDocument();
    expect(screen.getByText("FIVE")).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes("$5.00")),
    ).toBeInTheDocument();
    // SAVE25 is active, FIVE is inactive.
    expect(screen.getAllByText("Activo")).toHaveLength(1);
    expect(screen.getAllByText("Inactivo")).toHaveLength(1);
  });

  it("creates a new percentage coupon", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByText("Nuevo cupón"));

    await user.type(screen.getByPlaceholderText("BIENVENIDO25"), "welcome10");
    await user.type(screen.getByPlaceholderText("25"), "10");

    await user.click(screen.getByText("Guardar"));

    await waitFor(() => {
      expect(createCoupon).toHaveBeenCalledWith({
        code: "WELCOME10",
        discountType: DiscountType.percentage,
        isActive: true,
        amount: BigInt(10),
      });
    });
  });

  it("creates a new fixed-amount coupon", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByText("Nuevo cupón"));

    // Switch to fixed amount.
    await user.selectOptions(
      screen.getByTestId("admin.coupon.discount_type_select"),
      DiscountType.fixed,
    );

    await user.type(screen.getByPlaceholderText("BIENVENIDO25"), "five");
    await user.type(screen.getByPlaceholderText("5.00"), "5");

    await user.click(screen.getByText("Guardar"));

    await waitFor(() => {
      expect(createCoupon).toHaveBeenCalledWith({
        code: "FIVE",
        discountType: DiscountType.fixed,
        isActive: true,
        amount: BigInt(500),
      });
    });
  });

  it("toggles a coupon's active status", async () => {
    const user = userEvent.setup();
    renderPanel();

    // SAVE25 is active; deactivate it.
    await user.click(screen.getByText("Desactivar"));

    await waitFor(() => {
      expect(updateCoupon).toHaveBeenCalledWith({
        id: BigInt(1),
        input: {
          code: "SAVE25",
          discountType: DiscountType.percentage,
          isActive: false,
          amount: BigInt(25),
        },
      });
    });
  });

  it("deletes a coupon after confirmation", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getAllByLabelText("Delete coupon")[0]);

    await waitFor(() => {
      expect(deleteCoupon).toHaveBeenCalledWith(BigInt(1));
    });
  });
});
