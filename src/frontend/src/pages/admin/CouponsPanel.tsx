import { DiscountType } from "@/backend";
import type { Coupon } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useCreateCoupon,
  useDeleteCoupon,
  useListCoupons,
  useUpdateCoupon,
} from "@/hooks/useQueries";
import { Edit2, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EditingCoupon {
  id: bigint;
  code: string;
  discountType: DiscountType;
  amount: string;
  isActive: boolean;
  isNew: boolean;
}

function formatAmount(coupon: Coupon): string {
  if (coupon.discountType === DiscountType.percentage) {
    return `${coupon.amount}%`;
  }
  return `$${(Number(coupon.amount) / 100).toFixed(2)}`;
}

export function CouponsPanel() {
  const { t } = useLanguage();
  const { data: coupons = [], isLoading } = useListCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const [editing, setEditing] = useState<EditingCoupon | null>(null);

  const startEdit = (c: Coupon) => {
    setEditing({
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      amount:
        c.discountType === DiscountType.percentage
          ? String(c.amount)
          : (Number(c.amount) / 100).toFixed(2),
      isActive: c.isActive,
      isNew: false,
    });
  };

  const startNew = () => {
    setEditing({
      id: BigInt(Date.now()),
      code: "",
      discountType: DiscountType.percentage,
      amount: "",
      isActive: true,
      isNew: true,
    });
  };

  const cancel = () => setEditing(null);

  const save = async () => {
    if (!editing) return;
    const code = editing.code.trim().toUpperCase();
    if (!code) {
      toast.error(t("Código requerido", "Code required"));
      return;
    }
    const amountNum = Number.parseFloat(editing.amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error(t("Monto inválido", "Invalid amount"));
      return;
    }
    const amount =
      editing.discountType === DiscountType.percentage
        ? BigInt(Math.round(amountNum))
        : BigInt(Math.round(amountNum * 100));
    try {
      const input = {
        code,
        discountType: editing.discountType,
        isActive: editing.isActive,
        amount,
      };
      if (editing.isNew) {
        await createCoupon.mutateAsync(input);
      } else {
        await updateCoupon.mutateAsync({ id: editing.id, input });
      }
      toast.success(t("Cupón guardado", "Coupon saved"));
      setEditing(null);
    } catch {
      toast.error(t("Error al guardar", "Error saving"));
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      await updateCoupon.mutateAsync({
        id: c.id,
        input: {
          code: c.code,
          discountType: c.discountType,
          isActive: !c.isActive,
          amount: c.amount,
        },
      });
      toast.success(
        c.isActive
          ? t("Cupón desactivado", "Coupon deactivated")
          : t("Cupón activado", "Coupon activated"),
      );
    } catch {
      toast.error(t("Error al actualizar", "Error updating"));
    }
  };

  const handleDelete = async (c: Coupon) => {
    if (!confirm(t("¿Eliminar este cupón?", "Delete this coupon?"))) return;
    try {
      await deleteCoupon.mutateAsync(c.id);
      toast.success(t("Cupón eliminado", "Coupon deleted"));
    } catch {
      toast.error(t("Error al eliminar", "Error deleting"));
    }
  };

  if (isLoading) {
    return (
      <Skeleton
        className="h-48 w-full rounded-2xl"
        data-ocid="admin.coupons.loading_state"
      />
    );
  }

  return (
    <div data-ocid="admin.coupons_panel">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">
          {t("Cupones", "Coupons")}
        </h2>
        <Button
          type="button"
          className="bg-primary text-primary-foreground gap-2"
          onClick={startNew}
          disabled={editing?.isNew}
          data-ocid="admin.add_coupon_button"
        >
          <Plus size={16} />
          {t("Nuevo cupón", "New coupon")}
        </Button>
      </div>

      {/* Edit / Add form */}
      {editing && (
        <div
          className="bg-card border border-primary/30 rounded-2xl p-5 mb-4"
          data-ocid="admin.coupon_edit_form"
        >
          <h3 className="font-semibold text-foreground mb-3">
            {editing.isNew
              ? t("Nuevo cupón", "New coupon")
              : t("Editar cupón", "Edit coupon")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>{t("Código", "Code")}</Label>
              <Input
                value={editing.code}
                onChange={(e) =>
                  setEditing({ ...editing, code: e.target.value })
                }
                placeholder="BIENVENIDO25"
                data-ocid="admin.coupon.code_input"
              />
            </div>
            <div>
              <Label>{t("Tipo de descuento", "Discount type")}</Label>
              <select
                value={editing.discountType}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    discountType: e.target.value as DiscountType,
                  })
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-ocid="admin.coupon.discount_type_select"
              >
                <option value={DiscountType.percentage}>
                  {t("Porcentaje (%)", "Percentage (%)")}
                </option>
                <option value={DiscountType.fixed}>
                  {t("Monto fijo ($)", "Fixed amount ($)")}
                </option>
              </select>
            </div>
            <div>
              <Label>
                {editing.discountType === DiscountType.percentage
                  ? t("Porcentaje de descuento", "Discount percentage")
                  : t("Monto de descuento (USD)", "Discount amount (USD)")}
              </Label>
              <Input
                type="number"
                min="0"
                step={
                  editing.discountType === DiscountType.percentage
                    ? "1"
                    : "0.01"
                }
                value={editing.amount}
                onChange={(e) =>
                  setEditing({ ...editing, amount: e.target.value })
                }
                placeholder={
                  editing.discountType === DiscountType.percentage
                    ? "25"
                    : "5.00"
                }
                data-ocid="admin.coupon.amount_input"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) =>
                    setEditing({ ...editing, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input accent-primary"
                  data-ocid="admin.coupon.active_checkbox"
                />
                {t("Activo", "Active")}
              </label>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancel}
              data-ocid="admin.coupon_cancel_button"
            >
              {t("Cancelar", "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-primary text-primary-foreground gap-2"
              onClick={save}
              disabled={createCoupon.isPending || updateCoupon.isPending}
              data-ocid="admin.coupon_save_button"
            >
              <Save size={14} />
              {t("Guardar", "Save")}
            </Button>
          </div>
        </div>
      )}

      {/* Coupon list */}
      <div className="space-y-2">
        {coupons.map((c, i) => (
          <div
            key={String(c.id)}
            className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
            data-ocid={`admin.coupon.item.${i + 1}`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground font-mono">
                  {c.code}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.isActive
                    ? t("Activo", "Active")
                    : t("Inactivo", "Inactive")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {c.discountType === DiscountType.percentage
                  ? t("Porcentaje", "Percentage")
                  : t("Monto fijo", "Fixed amount")}
                {" · "}
                {formatAmount(c)}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleActive(c)}
                aria-label={
                  c.isActive
                    ? t("Desactivar cupón", "Deactivate coupon")
                    : t("Activar cupón", "Activate coupon")
                }
                data-ocid={`admin.toggle_coupon_button.${i + 1}`}
              >
                {c.isActive ? (
                  <span className="text-muted-foreground">
                    {t("Desactivar", "Deactivate")}
                  </span>
                ) : (
                  <span className="text-primary">
                    {t("Activar", "Activate")}
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => startEdit(c)}
                aria-label="Edit coupon"
                data-ocid={`admin.edit_coupon_button.${i + 1}`}
              >
                <Edit2 size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(c)}
                aria-label="Delete coupon"
                data-ocid={`admin.delete_coupon_button.${i + 1}`}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="admin.coupons.empty_state"
          >
            <p className="font-medium text-foreground mb-1">
              {t("Sin cupones todavía", "No coupons yet")}
            </p>
            <p className="text-sm">
              {t(
                "Crea tu primer cupón para ofrecer descuentos en el carrito",
                "Create your first coupon to offer cart discounts",
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
