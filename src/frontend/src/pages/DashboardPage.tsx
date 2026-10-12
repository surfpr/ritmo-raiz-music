import { createActor } from "@/backend";
import type { SaleRecord } from "@/backend";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { useAllPurchases } from "@/hooks/useQueries";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Loader2,
  LogIn,
  Music,
  Package,
} from "lucide-react";
import { useCallback, useState } from "react";

function formatDate(ts: bigint, lang: "es" | "en") {
  const d = new Date(Number(ts) / 1_000_000);
  return d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCents(cents: bigint) {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function DashboardLoginPrompt() {
  const { login } = useInternetIdentity();
  const { t } = useLanguage();
  return (
    <div className="min-h-[60vh] bg-background flex items-center justify-center px-4">
      <div className="bg-card border border-border rounded-2xl p-10 flex flex-col items-center gap-6 w-full max-w-sm shadow-lg">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Music size={32} className="text-primary" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {t("Mi Dashboard", "My Dashboard")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t(
              "Inicia sesión con Internet Identity para ver tu historial de compras",
              "Sign in with Internet Identity to view your purchase history",
            )}
          </p>
        </div>
        <Button
          type="button"
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => login()}
          data-ocid="dashboard.login_button"
        >
          <LogIn size={16} />
          {t("Iniciar sesión", "Sign in")}
        </Button>
      </div>
    </div>
  );
}

function DownloadButton({ record }: { record: SaleRecord }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<
    "idle" | "downloading" | "success" | "error"
  >("idle");
  const { actor } = useActor(createActor);

  const handleDownload = useCallback(async () => {
    if (status === "downloading" || status === "success") return;
    if (!actor || !record.trackId) {
      setStatus("error");
      return;
    }
    setStatus("downloading");
    try {
      const track = await actor.getTrack(record.trackId);
      if (!track || !track.audioFile) {
        setStatus("error");
        return;
      }
      const url = track.audioFile.getDirectURL();
      const a = document.createElement("a");
      a.href = url;
      a.download = `${record.trackTitle}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
    }
  }, [record, status, actor]);

  if (record.isCustomMusic) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Package size={14} />
        {t("Pendiente de entrega", "Pending delivery")}
      </span>
    );
  }

  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
        <CheckCircle size={14} />
        {t("Descargado", "Downloaded")}
      </span>
    );
  }

  if (status === "error") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        className="gap-1.5 text-xs text-destructive hover:text-destructive"
        data-ocid="dashboard.download_retry_button"
      >
        <AlertCircle size={14} />
        {t("Reintentar", "Retry")}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      disabled={status === "downloading"}
      className="gap-1.5 text-xs text-primary hover:text-primary"
      data-ocid="dashboard.download_button"
    >
      {status === "downloading" ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Download size={14} />
      )}
      {t("Descargar", "Download")}
    </Button>
  );
}

function PurchaseRow({ record, index }: { record: SaleRecord; index: number }) {
  const { t, lang } = useLanguage();
  return (
    <tr
      className="border-b border-border hover:bg-muted/30 transition-smooth"
      data-ocid={`dashboard.purchase_row.item.${index + 1}`}
    >
      <td className="px-4 py-3 text-sm text-foreground">
        {record.isCustomMusic ? (
          <span className="inline-flex items-center gap-1.5">
            <Package size={14} className="text-accent" />
            {t("Música Custom", "Custom Music")}
          </span>
        ) : (
          record.trackTitle
        )}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {record.licenseTierName}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-foreground">
        {formatCents(record.amountCents)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatDate(record.createdAt, lang)}
      </td>
      <td className="px-4 py-3">
        <DownloadButton record={record} />
      </td>
    </tr>
  );
}

export default function DashboardPage() {
  const { loginStatus } = useInternetIdentity();
  const { data: purchases = [], isLoading } = useAllPurchases();
  const { t } = useLanguage();

  if (loginStatus === "initializing" || isLoading) {
    return (
      <div className="min-h-[60vh] bg-background flex items-center justify-center px-4">
        <div className="space-y-4 w-full max-w-3xl">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    );
  }

  if (loginStatus !== "success") {
    return <DashboardLoginPrompt />;
  }

  return (
    <div className="bg-background min-h-[60vh] px-4 sm:px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold text-foreground">
            {t("Mi Dashboard", "My Dashboard")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t(
              "Historial de compras, descargas y licencias adquiridas",
              "Purchase history, downloads, and acquired licenses",
            )}
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
              {t("Total Compras", "Total Purchases")}
            </div>
            <div className="font-display text-2xl font-bold text-foreground">
              {purchases.length}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
              {t("Gasto Total", "Total Spent")}
            </div>
            <div className="font-display text-2xl font-bold text-primary">
              {formatCents(
                purchases.reduce((sum, p) => sum + p.amountCents, BigInt(0)),
              )}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
              {t("Tracks Adquiridos", "Tracks Acquired")}
            </div>
            <div className="font-display text-2xl font-bold text-accent">
              {purchases.filter((p) => !p.isCustomMusic).length}
            </div>
          </div>
        </div>

        {/* Purchases table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {purchases.length === 0 ? (
            <div className="p-12 text-center" data-ocid="dashboard.empty_state">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Package size={28} className="text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                {t("Aún no tienes compras", "No purchases yet")}
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                {t(
                  "Cuando compres tracks o música custom, aparecerán aquí con acceso a descargas y licencias.",
                  "When you purchase tracks or custom music, they will appear here with download and license access.",
                )}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("Track", "Track")}
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("Licencia", "License")}
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("Monto", "Amount")}
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("Fecha", "Date")}
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("Descarga", "Download")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((record, i) => (
                    <PurchaseRow
                      key={record.id.toString()}
                      record={record}
                      index={i}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
