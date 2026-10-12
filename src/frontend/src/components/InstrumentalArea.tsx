import type { LicenseTier } from "@/backend";
import { TrackCard } from "@/components/TrackCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import type { InstrumentalGroup } from "@/lib/genreAisles";
import { AudioLines } from "lucide-react";

interface InstrumentalAreaProps {
  groups: InstrumentalGroup[];
  isLoading: boolean;
  licenses: LicenseTier[];
  onSelectGenre: (genre: string) => void;
}

/**
 * The dedicated Instrumental area: instrumental songs grouped by their existing
 * genre (Salsa, Cumbia, …). Each genre is its own shelf; selecting the genre
 * label drills into that genre's aisle.
 */
export function InstrumentalArea({
  groups,
  isLoading,
  licenses,
  onSelectGenre,
}: InstrumentalAreaProps) {
  const { t } = useLanguage();

  return (
    <section
      id="instrumental"
      className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 scroll-mt-20"
      data-ocid="storefront.instrumental"
    >
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="store-eyebrow mb-2">{t("Sin voz", "Without vocals")}</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t("Instrumental", "Instrumental")}
          </h2>
        </div>
        <p className="hidden sm:block text-sm text-muted-foreground max-w-xs text-right">
          {t(
            "Pistas instrumentales agrupadas por su género.",
            "Instrumental tracks grouped by their genre.",
          )}
        </p>
      </div>

      {isLoading ? (
        <div
          className="space-y-6"
          data-ocid="storefront.instrumental.loading_state"
        >
          {Array.from(
            { length: 2 },
            (_, i) => `instrumental-skeleton-${i}`,
          ).map((id) => (
            <Skeleton key={id} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group, groupIndex) => (
            <div
              key={group.genre}
              className="shelf"
              data-ocid={`storefront.instrumental.group.${groupIndex + 1}`}
            >
              <div className="shelf-head">
                <button
                  type="button"
                  onClick={() => onSelectGenre(group.genre)}
                  className="shelf-title hover:text-accent transition-colors"
                  data-ocid={`storefront.instrumental.group_link.${groupIndex + 1}`}
                >
                  {group.label}
                </button>
                <span className="aisle-count">
                  {group.tracks.length} {t("PISTAS", "TRACKS")}
                </span>
              </div>
              <div className="shelf-rail">
                {group.tracks.map((track) => (
                  <div key={String(track.id)} className="w-56">
                    <TrackCard track={track} licenses={licenses} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="empty-state"
          data-ocid="storefront.instrumental.empty_state"
        >
          <AudioLines size={44} className="empty-state-icon" />
          <h3 className="font-display text-xl font-bold text-foreground">
            {t(
              "Aún no hay pistas instrumentales",
              "No instrumental tracks yet",
            )}
          </h3>
          <p className="text-muted-foreground max-w-sm">
            {t(
              "Cuando subas pistas sin voz, aparecerán aquí agrupadas por género.",
              "When instrumental tracks are added, they will appear here grouped by genre.",
            )}
          </p>
        </div>
      )}
    </section>
  );
}
