import type { OrderStatus } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useCustomMusicOrders,
  useUpdateCustomOrderStatus,
} from "@/hooks/useQueries";
import { CheckCircle, Clock, Inbox } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<
  string,
  {
    labelEs: string;
    labelEn: string;
    variant: "default" | "secondary" | "outline";
  }
> = {
  pending: { labelEs: "Pendiente", labelEn: "Pending", variant: "outline" },
  inProgress: {
    labelEs: "En proceso",
    labelEn: "In progress",
    variant: "secondary",
  },
  completed: {
    labelEs: "Completado",
    labelEn: "Completed",
    variant: "default",
  },
};

function formatDate(ts: bigint) {
  const d = new Date(Number(ts / 1_000_000n));
  return d.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function OrdersPanel() {
  const { t } = useLanguage();
  const { data: orders = [], isLoading } = useCustomMusicOrders();
  const updateStatus = useUpdateCustomOrderStatus();

  const markStatus = async (id: bigint, status: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(t("Estado actualizado", "Status updated"));
    } catch {
      toast.error(t("Error al actualizar", "Error updating"));
    }
  };

  if (isLoading) {
    return (
      <Skeleton
        className="h-48 w-full rounded-2xl"
        data-ocid="admin.orders.loading_state"
      />
    );
  }

  return (
    <div data-ocid="admin.orders_panel">
      <h2 className="font-display text-2xl font-bold text-foreground mb-6">
        {t("Pedidos Custom", "Custom Orders")}
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          ({orders.length})
        </span>
      </h2>

      {orders.length === 0 ? (
        <div
          className="text-center py-20 text-muted-foreground"
          data-ocid="admin.orders.empty_state"
        >
          <Inbox size={40} className="mx-auto mb-3 opacity-40" />
          <p>{t("Sin pedidos aún", "No orders yet")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const statusCfg =
              STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            return (
              <div
                key={String(order.id)}
                className="bg-card border border-border rounded-xl p-5"
                data-ocid={`admin.order.item.${i + 1}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">
                        {order.customerEmail}
                      </p>
                      <Badge variant={statusCfg.variant}>
                        {t(statusCfg.labelEs, statusCfg.labelEn)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {order.projectType}
                      {order.genrePreference && ` · ${order.genrePreference}`}
                      {" · "}
                      {formatDate(order.createdAt)}
                    </p>
                    {order.styleDescription && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {order.styleDescription}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {order.status !== "inProgress" &&
                      order.status !== "completed" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs whitespace-nowrap"
                          onClick={() =>
                            markStatus(order.id, "inProgress" as OrderStatus)
                          }
                          disabled={updateStatus.isPending}
                          data-ocid={`admin.order_in_progress_button.${i + 1}`}
                        >
                          <Clock size={12} />
                          {t("En proceso", "In progress")}
                        </Button>
                      )}
                    {order.status !== "completed" && (
                      <Button
                        type="button"
                        size="sm"
                        className="bg-primary text-primary-foreground gap-1 text-xs whitespace-nowrap"
                        onClick={() =>
                          markStatus(order.id, "completed" as OrderStatus)
                        }
                        disabled={updateStatus.isPending}
                        data-ocid={`admin.order_complete_button.${i + 1}`}
                      >
                        <CheckCircle size={12} />
                        {t("Completado", "Completed")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
