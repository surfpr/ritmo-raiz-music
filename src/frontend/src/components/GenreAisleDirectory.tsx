import { GenreAisleCard } from "@/components/GenreAisleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import type { AisleSummary } from "@/lib/genreAisles";

interface GenreAisleDirectoryProps {
  aisles: AisleSummary[];
  isLoading: boolean;
  onSelect: (genre: string) => void;
}

/**
 * The genre aisle directory: every genre shown as a browsable aisle card with
 * a representative cover and live track count. This is the store's primary
 * navigation surface — there is no flat all-catalog grid.
 */
export function GenreAisleDirectory({
  aisles,
  isLoading,
  onSelect,
}: GenreAisleDirectoryProps) {
  const { t } = useLanguage();

  return (
    <section
      id="aisles"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-12 scroll-mt-20"
      data-ocid="storefront.aisle_directory"
    >
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="store-eyebrow mb-2">{t("Directorio", "Directory")}</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t("Pasillos por género", "Genre aisles")}
          </h2>
        </div>
        <p className="hidden sm:block text-sm text-muted-foreground max-w-xs text-right">
          {t(
            "Elige un pasillo para recorrer solo ese género.",
            "Pick an aisle to browse just that genre.",
          )}
        </p>
      </div>

      {isLoading ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          data-ocid="storefront.aisle_directory.loading_state"
        >
          {Array.from({ length: 8 }, (_, i) => `aisle-skeleton-${i}`).map(
            (id) => (
              <Skeleton key={id} className="h-64 rounded-xl" />
            ),
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {aisles.map((aisle, index) => (
            <GenreAisleCard
              key={aisle.value}
              aisle={aisle}
              index={index}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}
