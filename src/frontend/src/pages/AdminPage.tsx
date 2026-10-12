import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { useIsAdmin } from "@/hooks/useQueries";
import { BulkUploadPanel } from "@/pages/admin/BulkUploadPanel";
import { CouponsPanel } from "@/pages/admin/CouponsPanel";
import { FeaturedPanel } from "@/pages/admin/FeaturedPanel";
import { LicensesPanel } from "@/pages/admin/LicensesPanel";
import { NewArrivalsPanel } from "@/pages/admin/NewArrivalsPanel";
import { OrdersPanel } from "@/pages/admin/OrdersPanel";
import { SalesAnalyticsPanel } from "@/pages/admin/SalesAnalyticsPanel";
import { SettingsPanel } from "@/pages/admin/SettingsPanel";
import { TracksPanel } from "@/pages/admin/TracksPanel";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  BarChart2,
  FileText,
  LogIn,
  LogOut,
  Music,
  Settings,
  Sparkles,
  Star,
  Tag,
  TicketPercent,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";

type Tab =
  | "tracks"
  | "featured"
  | "newArrivals"
  | "licenses"
  | "coupons"
  | "orders"
  | "settings"
  | "bulk"
  | "analytics";

const TABS: {
  id: Tab;
  icon: typeof Music;
  labelEs: string;
  labelEn: string;
}[] = [
  { id: "tracks", icon: Music, labelEs: "Canciones", labelEn: "Tracks" },
  {
    id: "featured",
    icon: Star,
    labelEs: "Destacadas",
    labelEn: "Featured",
  },
  {
    id: "newArrivals",
    icon: Sparkles,
    labelEs: "Novedades",
    labelEn: "New Arrivals",
  },
  { id: "licenses", icon: Tag, labelEs: "Licencias", labelEn: "Licenses" },
  {
    id: "coupons",
    icon: TicketPercent,
    labelEs: "Cupones",
    labelEn: "Coupons",
  },
  {
    id: "orders",
    icon: FileText,
    labelEs: "Pedidos Custom",
    labelEn: "Custom Orders",
  },
  {
    id: "settings",
    icon: Settings,
    labelEs: "Configuración",
    labelEn: "Settings",
  },
  {
    id: "bulk",
    icon: Upload,
    labelEs: "Subir por Género",
    labelEn: "Upload by Genre",
  },
  {
    id: "analytics",
    icon: BarChart2,
    labelEs: "Análisis",
    labelEn: "Analytics",
  },
];

export default function AdminPage() {
  const { t } = useLanguage();
  const { loginStatus, login, clear } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [activeTab, setActiveTab] = useState<Tab>("tracks");

  if (loginStatus !== "success") {
    return (
      <div
        className="min-h-[80vh] flex flex-col items-center justify-center gap-6"
        data-ocid="admin.login_gate"
      >
        <div className="text-center">
          <Music size={56} className="mx-auto mb-4 text-primary opacity-60" />
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            {t(
              "Conecta con Internet Identity para continuar",
              "Connect with Internet Identity to continue",
            )}
          </p>
        </div>
        <Button
          size="lg"
          className="bg-primary text-primary-foreground gap-2 px-8"
          onClick={() => login()}
          data-ocid="admin.login_button"
        >
          <LogIn size={18} />
          {t(
            "Conectar con Internet Identity",
            "Connect with Internet Identity",
          )}
        </Button>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="space-y-3 w-72">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="min-h-[80vh] flex flex-col items-center justify-center gap-6 text-center"
        data-ocid="admin.not_admin_gate"
      >
        <X size={56} className="text-destructive opacity-60" />
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            {t("Acceso denegado", "Access denied")}
          </h2>
          <p className="text-muted-foreground">
            {t(
              "No tienes permisos de administrador",
              "You don't have admin permissions",
            )}
          </p>
        </div>
        <Button variant="outline" onClick={() => clear()}>
          {t("Salir", "Sign out")}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin header */}
      <div
        className="bg-card border-b border-border px-6 py-4 flex items-center justify-between"
        data-ocid="admin.header"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm">Ritmo Raíz Music V2</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => clear()}
          className="gap-2"
          data-ocid="admin.logout_button"
        >
          <LogOut size={16} />
          {t("Salir", "Sign out")}
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border px-6">
        <div className="flex gap-1 max-w-6xl mx-auto overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-smooth whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-ocid={`admin.${tab.id}_tab`}
            >
              <tab.icon size={16} />
              {t(tab.labelEs, tab.labelEn)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === "tracks" && <TracksPanel />}
        {activeTab === "featured" && <FeaturedPanel />}
        {activeTab === "newArrivals" && <NewArrivalsPanel />}
        {activeTab === "licenses" && <LicensesPanel />}
        {activeTab === "coupons" && <CouponsPanel />}
        {activeTab === "orders" && <OrdersPanel />}
        {activeTab === "settings" && <SettingsPanel />}
        {activeTab === "bulk" && <BulkUploadPanel />}
        {activeTab === "analytics" && <SalesAnalyticsPanel />}
      </div>
    </div>
  );
}
