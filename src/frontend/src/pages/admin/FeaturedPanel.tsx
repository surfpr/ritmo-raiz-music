import type { Track, TrackInput } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { useFeaturedTracks, useUpdateTrack } from "@/hooks/useQueries";
import { Check, Loader2, Music, Search, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/** Build a full TrackInput from an existing track, toggling only isFeatured. */
export function trackInputFrom(
  track: Track,
  overrides: Partial<Pick<TrackInput, "isFeatured" | "isNewArrival">>,
): TrackInput {
  return {
    title: track.title,
    artist: track.artist,
    genre: track.genre,
    country: track.country,
    sampleStartSec: track.sampleStartSec,
    sampleEndSec: track.sampleEndSec,
    isFeatured: overrides.isFeatured ?? track.isFeatured,
    isNewArrival: overrides.isNewArrival ?? track.isNewArrival,
    coverImage: track.coverImage,
    vocalType: track.vocalType,
    mood: track.mood,
    tempo: track.tempo,
    recommendedUse: track.recommendedUse,
  };
}

export function matchesTrackSearch(track: Track, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    track.title.es.toLowerCase().includes(q) ||
    track.title.en.toLowerCase().includes(q) ||
    track.artist.toLowerCase().includes(q) ||
    track.genre.toLowerCase().includes(q) ||
    track.country.toLowerCase().includes(q)
  );
}

interface FlagPanelProps {
  tracks: Track[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  isFlagged: (track: Track) => boolean;
  onToggle: (track: Track) => void;
  pendingId: string | null;
  successId: string | null;
  panelOcid: string;
  searchOcid: string;
  rowOcid: string;
  toggleOcid: string;
  emptyOcid: string;
  loadingOcid: string;
  title: string;
  countLabel: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyBody: string;
  noResults: string;
  addLabel: string;
  removeLabel: string;
  flaggedBadge: string;
}

export function FlagPanel({
  tracks,
  isLoading,
  search,
  onSearchChange,
  isFlagged,
  onToggle,
  pendingId,
  successId,
  panelOcid,
  searchOcid,
  rowOcid,
  toggleOcid,
  emptyOcid,
  loadingOcid,
  title,
  countLabel,
  searchPlaceholder,
  emptyTitle,
  emptyBody,
  noResults,
  addLabel,
  removeLabel,
  flaggedBadge,
}: FlagPanelProps) {
  const filtered = tracks.filter((track) => matchesTrackSearch(track, search));

  return (
    <div data-ocid={panelOcid}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">
          {title}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({tracks.length})
          </span>
        </h2>
        <Badge variant="secondary" className="gap-1.5">
          <Star size={12} />
          {countLabel}
        </Badge>
      </div>

      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
          data-ocid={searchOcid}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid={loadingOcid}>
          {Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map((id) => (
            <Skeleton key={id} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" data-ocid={emptyOcid}>
          <Music size={40} className="empty-state-icon" />
          <h3 className="font-display text-lg font-semibold text-foreground">
            {search ? noResults : emptyTitle}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {search ? noResults : emptyBody}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((track, i) => {
            const flagged = isFlagged(track);
            const key = String(track.id);
            const isPending = pendingId === key;
            const isSuccess = successId === key;
            return (
              <div
                key={key}
                className="flex items-center gap-3 bg-card border border-border rounded-xl p-3"
                data-ocid={`${rowOcid}.${i + 1}`}
              >
                <button
                  type="button"
                  onClick={() => onToggle(track)}
                  disabled={isPending}
                  aria-pressed={flagged}
                  aria-label={flagged ? removeLabel : addLabel}
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${
                    flagged
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                  data-ocid={`${toggleOcid}.${i + 1}`}
                >
                  {isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isSuccess ? (
                    <Check size={16} />
                  ) : (
                    <Check size={16} className={flagged ? "" : "opacity-30"} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">
                    {track.title.es}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {track.artist} · {track.genre} · {track.country}
                  </p>
                </div>

                {flagged && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {flaggedBadge}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FeaturedPanel() {
  const { t } = useLanguage();
  const { data: tracks = [], isLoading } = useFeaturedTracks();
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
        input: trackInputFrom(track, { isFeatured: !track.isFeatured }),
      });
      setSuccessId(key);
      toast.success(
        track.isFeatured
          ? t("Quitado de Destacadas", "Removed from Featured")
          : t("Añadido a Destacadas", "Added to Featured"),
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
      isFlagged={(track) => track.isFeatured}
      onToggle={toggle}
      pendingId={pendingId}
      successId={successId}
      panelOcid="admin.featured_panel"
      searchOcid="admin.featured_search_input"
      rowOcid="admin.featured.item"
      toggleOcid="admin.featured_toggle"
      emptyOcid="admin.featured.empty_state"
      loadingOcid="admin.featured.loading_state"
      title={t("Destacadas", "Featured")}
      countLabel={t("En Destacadas", "In Featured")}
      searchPlaceholder={t("Buscar canciones...", "Search tracks...")}
      emptyTitle={t("Sin canciones destacadas", "No featured tracks")}
      emptyBody={t(
        "Marca canciones como destacadas desde la pestaña Canciones para que aparezcan aquí.",
        "Mark tracks as featured from the Tracks tab to see them here.",
      )}
      noResults={t("Sin resultados", "No results")}
      addLabel={t("Añadir a Destacadas", "Add to Featured")}
      removeLabel={t("Quitar de Destacadas", "Remove from Featured")}
      flaggedBadge={t("Destacada", "Featured")}
    />
  );
}
