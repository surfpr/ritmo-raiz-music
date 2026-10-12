import type { Track } from "@/backend";
import { useLanguage } from "@/hooks/useLanguage";
import { useNewArrivalTracks, useUpdateTrack } from "@/hooks/useQueries";
import { FlagPanel, trackInputFrom } from "@/pages/admin/FeaturedPanel";
import { useState } from "react";
import { toast } from "sonner";

export function NewArrivalsPanel() {
  const { t } = useLanguage();
  const { data: tracks = [], isLoading } = useNewArrivalTracks();
  const updateTrack = useUpdateTrack();
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const toggle = async (track: Track) => {
    const key = String(track.id);
    setPendingId(key);
    setSuccessId(null);
    try {
      await updateTrack.mutateAsync({
        id: track.id,
        input: trackInputFrom(track, { isNewArrival: !track.isNewArrival }),
      });
      setSuccessId(key);
      toast.success(
        track.isNewArrival
          ? t("Quitado de Novedades", "Removed from New Arrivals")
          : t("Añadido a Novedades", "Added to New Arrivals"),
      );
      window.setTimeout(
        () => setSuccessId((c) => (c === key ? null : c)),
        1500,
      );
    } catch {
      toast.error(t("Error al actualizar", "Error updating"));
    } finally {
      setPendingId((c) => (c === key ? null : c));
    }
  };

  return (
    <FlagPanel
      tracks={tracks}
      isLoading={isLoading}
      search={search}
      onSearchChange={setSearch}
      isFlagged={(track) => track.isNewArrival}
      onToggle={toggle}
      pendingId={pendingId}
      successId={successId}
      panelOcid="admin.new_arrivals_panel"
      searchOcid="admin.new_arrivals_search_input"
      rowOcid="admin.new_arrivals.item"
      toggleOcid="admin.new_arrivals_toggle"
      emptyOcid="admin.new_arrivals.empty_state"
      loadingOcid="admin.new_arrivals.loading_state"
      title={t("Novedades", "New Arrivals")}
      countLabel={t("En Novedades", "In New Arrivals")}
      searchPlaceholder={t("Buscar canciones...", "Search tracks...")}
      emptyTitle={t("Sin novedades", "No new arrivals")}
      emptyBody={t(
        "Marca canciones como novedad desde la pestaña Canciones para que aparezcan aquí.",
        "Mark tracks as new arrivals from the Tracks tab to see them here.",
      )}
      noResults={t("Sin resultados", "No results")}
      addLabel={t("Añadir a Novedades", "Add to New Arrivals")}
      removeLabel={t("Quitar de Novedades", "Remove from New Arrivals")}
      flaggedBadge={t("Novedad", "New")}
    />
  );
}
