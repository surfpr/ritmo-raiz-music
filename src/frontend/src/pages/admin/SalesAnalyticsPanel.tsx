import { createActor } from "@/backend";
import type { AnalyticsPeriod, SalesSummary, TopTrack } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { useSalesSummary, useTopTracks } from "@/hooks/useQueries";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  BarChart2,
  Download,
  Music,
  ShoppingBag,
  Star,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Period = "daily" | "weekly" | "monthly" | "allTime";

const PERIODS: { id: Period; labelEs: string; labelEn: string }[] = [
  { id: "daily", labelEs: "Diario", labelEn: "Daily" },
  { id: "weekly", labelEs: "Semanal", labelEn: "Weekly" },
  { id: "monthly", labelEs: "Mensual", labelEn: "Monthly" },
  { id: "allTime", labelEs: "Todo", labelEn: "All" },
];

function centsToUsd(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof BarChart2;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={`border-border ${
        accent ? "border-primary/30 bg-primary/5" : "bg-card"
      }`}
    >
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              {label}
            </p>
            <p
              className={`font-display text-2xl font-bold truncate ${
                accent ? "text-primary" : "text-foreground"
              }`}
            >
              {value}
            </p>
          </div>
          <div
            className={`rounded-lg p-2 shrink-0 ${
              accent ? "bg-primary/15" : "bg-muted"
            }`}
          >
            <Icon
              size={18}
              className={accent ? "text-primary" : "text-muted-foreground"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummarySection({
  summary,
  isLoading,
  t,
}: {
  summary: SalesSummary | undefined;
  isLoading: boolean;
  t: (es: string, en: string) => string;
}) {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        data-ocid="analytics.summary.loading_state"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={`sum-skel-${i + 1}`} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }
  if (!summary) return null;
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
      data-ocid="analytics.summary_section"
    >
      <SummaryCard
        icon={TrendingUp}
        label={t("Total Ingresos", "Total Revenue")}
        value={centsToUsd(summary.totalRevenueCents)}
        accent
      />
      <SummaryCard
        icon={ShoppingBag}
        label={t("Unidades Vendidas", "Units Sold")}
        value={String(summary.unitsSold)}
      />
      <SummaryCard
        icon={BarChart2}
        label={t("Promedio por Venta", "Avg Order Value")}
        value={centsToUsd(summary.avgOrderCents)}
      />
      <SummaryCard
        icon={Music}
        label={t("Pistas", "Track Sales")}
        value={String(summary.trackSales)}
      />
      <SummaryCard
        icon={Star}
        label={t("Custom", "Custom Music")}
        value={String(summary.customMusicSales)}
      />
    </div>
  );
}

function TopTracksTable({
  tracks,
  isLoading,
  t,
}: {
  tracks: TopTrack[] | undefined;
  isLoading: boolean;
  t: (es: string, en: string) => string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2" data-ocid="analytics.top_tracks.loading_state">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={`tt-skel-${i + 1}`} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }
  if (!tracks || tracks.length === 0) {
    return (
      <div
        className="text-center py-16 text-muted-foreground"
        data-ocid="analytics.top_tracks.empty_state"
      >
        <Music size={36} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">
          {t("No hay ventas en este período", "No sales in this period")}
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto" data-ocid="analytics.top_tracks_table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-3 text-muted-foreground font-medium w-10">
              #
            </th>
            <th className="text-left py-3 px-3 text-muted-foreground font-medium">
              {t("Pista", "Track")}
            </th>
            <th className="text-right py-3 px-3 text-muted-foreground font-medium">
              {t("Unidades", "Units")}
            </th>
            <th className="text-right py-3 px-3 text-muted-foreground font-medium">
              {t("Ingresos", "Revenue")}
            </th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, i) => (
            <tr
              key={String(track.trackId)}
              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              data-ocid={`analytics.top_track.item.${i + 1}`}
            >
              <td className="py-3 px-3">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    i === 0
                      ? "bg-yellow-500/20 text-yellow-600"
                      : i === 1
                        ? "bg-slate-400/20 text-slate-500"
                        : i === 2
                          ? "bg-orange-500/20 text-orange-600"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
              </td>
              <td className="py-3 px-3">
                <span className="font-medium text-foreground line-clamp-1">
                  {track.trackTitle}
                </span>
              </td>
              <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">
                {String(track.unitsSold)}
              </td>
              <td className="py-3 px-3 text-right tabular-nums font-semibold text-foreground">
                {centsToUsd(track.totalRevenueCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SalesAnalyticsPanel() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<Period>("allTime");
  const { actor } = useActor(createActor);

  const backendPeriod = period as AnalyticsPeriod;

  const { data: summary, isLoading: summaryLoading } =
    useSalesSummary(backendPeriod);
  const { data: topTracks, isLoading: tracksLoading } = useTopTracks(10);

  const handleExport = async () => {
    if (!actor) {
      toast.error(t("Actor no disponible", "Actor not available"));
      return;
    }
    try {
      toast.info(t("Generando CSV...", "Generating CSV..."));
      const csv = await actor.exportSalesCsv(backendPeriod);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().split("T")[0];
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("CSV descargado", "CSV downloaded"));
    } catch {
      toast.error(t("Error al exportar", "Export failed"));
    }
  };

  const noData = !summaryLoading && summary && summary.unitsSold === BigInt(0);

  return (
    <div className="space-y-8" data-ocid="analytics.panel">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart2 size={22} className="text-primary" />
            {t("Análisis de Ventas", "Sales Analytics")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t(
              "Pistas vendidas, ingresos y música custom",
              "Track sales, revenue, and custom music",
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-2 border-border hover:border-primary/60 transition-smooth self-start sm:self-auto"
          onClick={handleExport}
          data-ocid="analytics.export_button"
        >
          <Download size={16} />
          {t("Exportar CSV", "Export CSV")}
        </Button>
      </div>

      {/* Period tabs */}
      <div
        className="flex gap-1 border-b border-border"
        data-ocid="analytics.period_tabs"
      >
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-smooth whitespace-nowrap -mb-px ${
              period === p.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-ocid={`analytics.${p.id}_tab`}
          >
            {t(p.labelEs, p.labelEn)}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <SummarySection summary={summary} isLoading={summaryLoading} t={t} />

      {/* No-data state (after loading) */}
      {noData && (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="analytics.summary.empty_state"
        >
          <BarChart2 size={40} className="mx-auto mb-3 opacity-25" />
          <p className="font-medium">
            {t("No hay ventas en este período", "No sales in this period")}
          </p>
        </div>
      )}

      {/* Top 10 table */}
      <Card className="border-border" data-ocid="analytics.top_tracks_card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Star size={16} className="text-primary" />
            {t("Top 10 Pistas Más Vendidas", "Top 10 Best Selling Tracks")}
            <Badge variant="secondary" className="ml-auto font-normal text-xs">
              {t("Todas las épocas", "All time")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <TopTracksTable tracks={topTracks} isLoading={tracksLoading} t={t} />
        </CardContent>
      </Card>
    </div>
  );
}
