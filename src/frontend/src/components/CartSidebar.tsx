import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { itemKey, useCart } from "@/hooks/useCart";
import { useLanguage } from "@/hooks/useLanguage";
import { useCheckout, useValidateCoupon } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { Minus, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CartSidebar() {
  const { t } = useLanguage();
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    subtotalCents,
    count,
    coupon,
    applyCoupon,
    removeCoupon,
    discountCents,
    totalCents,
    toBackendItems,
  } = useCart();
  const validateCoupon = useValidateCoupon();
  const checkout = useCheckout();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponError("");
    validateCoupon.mutate(code, {
      onSuccess: (result) => {
        if (!result) {
          setCouponError(
            t("Cupón inválido o inactivo", "Invalid or inactive coupon"),
          );
          return;
        }
        applyCoupon({
          code: result.code,
          discountType: result.discountType,
          amount: Number(result.amount),
        });
        setCouponInput("");
        toast.success(t("Cupón aplicado", "Coupon applied"));
      },
      onError: () => {
        setCouponError(
          t("No se pudo validar el cupón", "Could not validate coupon"),
        );
      },
    });
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    const successUrl = `${window.location.origin}${window.location.pathname}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${window.location.origin}${window.location.pathname}?payment=cancelled`;
    checkout.mutate(
      {
        items: toBackendItems(),
        couponCode: coupon?.code,
        successUrl,
        cancelUrl,
      },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "ok") {
            try {
              const session = JSON.parse(result.ok.sessionJson) as {
                url?: string;
              };
              if (session.url) {
                window.location.href = session.url;
              } else {
                toast.error(
                  t("No se pudo iniciar el pago", "Could not start payment"),
                );
              }
            } catch {
              toast.error(
                t("Respuesta de pago inválida", "Invalid payment response"),
              );
            }
          } else {
            const err = result.err;
            if (err.__kind__ === "stripeNotConfigured") {
              toast.error(
                t(
                  "El pago dinámico no está configurado",
                  "Dynamic checkout is not configured",
                ),
              );
            } else if (err.__kind__ === "invalidCoupon") {
              toast.error(t("Cupón inválido", "Invalid coupon"));
            } else if (err.__kind__ === "inactiveCoupon") {
              toast.error(t("Cupón inactivo", "Inactive coupon"));
            } else if (err.__kind__ === "emptyCart") {
              toast.error(t("El carrito está vacío", "Cart is empty"));
            } else {
              toast.error(
                t("Error al procesar el pago", "Error processing payment"),
              );
            }
          }
        },
        onError: () => {
          toast.error(t("Error al iniciar el pago", "Error starting payment"));
        },
      },
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-card border-l border-border"
        data-ocid="cart.sheet"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <ShoppingBag size={18} className="text-primary" />
            {t("Tu Carrito", "Your Cart")}
            {count > 0 && (
              <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </SheetTitle>
          <SheetDescription>
            {t(
              "Revisa tus artículos antes de pagar",
              "Review your items before checkout",
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16" data-ocid="cart.empty_state">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <ShoppingBag
                  size={28}
                  className="text-muted-foreground opacity-50"
                />
              </div>
              <p className="text-muted-foreground text-sm">
                {t(
                  "Tu carrito está vacío. Agrega música para comenzar.",
                  "Your cart is empty. Add some music to get started.",
                )}
              </p>
            </div>
          ) : (
            items.map((item, index) => {
              const key = itemKey(item);
              return (
                <div
                  key={key}
                  className="flex gap-3 rounded-xl border border-border p-3"
                  data-ocid={`cart.item.${index + 1}`}
                >
                  {item.kind === "track" && item.coverUrl ? (
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag size={20} className="text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {item.title}
                        </p>
                        {item.kind === "track" && (
                          <p className="text-xs text-muted-foreground">
                            {item.artist} · {item.licenseName}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => removeItem(key)}
                        aria-label={t("Eliminar", "Remove")}
                        data-ocid={`cart.remove_button.${index + 1}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="w-6 h-6 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => updateQuantity(key, item.quantity - 1)}
                          aria-label={t("Disminuir", "Decrease")}
                          data-ocid={`cart.decrease_button.${index + 1}`}
                        >
                          <Minus size={12} />
                        </button>
                        <span
                          className="w-7 text-center text-sm font-semibold text-foreground"
                          data-ocid={`cart.quantity.${index + 1}`}
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="w-6 h-6 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => updateQuantity(key, item.quantity + 1)}
                          aria-label={t("Aumentar", "Increase")}
                          data-ocid={`cart.increase_button.${index + 1}`}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-foreground">
                        {formatPrice(item.priceCents * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="border-t border-border px-4 py-4 space-y-3">
            {/* Coupon */}
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder={t("Código de cupón", "Coupon code")}
                    className="pl-9"
                    data-ocid="cart.coupon_input"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim() || validateCoupon.isPending}
                  data-ocid="cart.apply_coupon_button"
                >
                  {t("Aplicar", "Apply")}
                </Button>
              </div>
              {couponError && (
                <p
                  className="text-destructive text-xs mt-1"
                  data-ocid="cart.coupon_error"
                >
                  {couponError}
                </p>
              )}
              {coupon && (
                <div
                  className="flex items-center justify-between mt-2 text-sm"
                  data-ocid="cart.coupon_applied"
                >
                  <span className="flex items-center gap-1.5 text-accent font-medium">
                    <Tag size={13} />
                    {coupon.code}
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={t("Quitar cupón", "Remove coupon")}
                      data-ocid="cart.remove_coupon_button"
                    >
                      <X size={13} />
                    </button>
                  </span>
                  <span className="text-accent font-semibold">
                    −{formatPrice(discountCents)}
                  </span>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t("Subtotal", "Subtotal")}</span>
                <span>{formatPrice(subtotalCents)}</span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between text-accent">
                  <span>{t("Descuento", "Discount")}</span>
                  <span>−{formatPrice(discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-foreground text-base pt-1 border-t border-border">
                <span>{t("Total", "Total")}</span>
                <span data-ocid="cart.total">{formatPrice(totalCents)}</span>
              </div>
            </div>

            <Button
              type="button"
              size="lg"
              className="w-full font-bold rounded-xl py-6"
              onClick={handleCheckout}
              disabled={checkout.isPending}
              data-ocid="cart.checkout_button"
            >
              {checkout.isPending
                ? t("Procesando...", "Processing...")
                : t("Pagar ahora", "Checkout")}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
