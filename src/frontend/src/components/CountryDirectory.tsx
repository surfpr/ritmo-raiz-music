import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { Globe2 } from "lucide-react";

interface CountryDirectoryProps {
  countries: string[];
  isLoading: boolean;
  onSelect: (country: string) => void;
}

/**
 * "Pasillo por País" — browse the store by country. Covers all Latin countries
 * plus Puerto Rico and España. Selecting a country browses that country's
 * songs through the existing country refinement.
 */
export function CountryDirectory({
  countries,
  isLoading,
  onSelect,
}: CountryDirectoryProps) {
  const { t } = useLanguage();

  return (
    <section
      id="countries"
      className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 scroll-mt-20"
      data-ocid="storefront.country_directory"
    >
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="store-eyebrow mb-2">{t("Origen", "Origin")}</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t("Pasillo por País", "Aisle by Country")}
          </h2>
        </div>
        <p className="hidden sm:block text-sm text-muted-foreground max-w-xs text-right">
          {t(
            "Recorre la música por su país de origen.",
            "Browse the music by its country of origin.",
          )}
        </p>
      </div>

      {isLoading ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          data-ocid="storefront.country_directory.loading_state"
        >
          {Array.from({ length: 8 }, (_, i) => `country-skeleton-${i}`).map(
            (id) => (
              <Skeleton key={id} className="h-14 rounded-xl" />
            ),
          )}
        </div>
      ) : countries.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {countries.map((country, index) => (
            <button
              key={country}
              type="button"
              onClick={() => onSelect(country)}
              className="group flex items-center gap-3 rounded-xl border border-aisle-border/70 bg-aisle-surface px-4 py-3 text-left transition-smooth hover:-translate-y-0.5 hover:border-accent/70 hover:bg-aisle-surface-hover"
              data-ocid={`storefront.country_card.${index + 1}`}
            >
              <Globe2
                size={18}
                className="shrink-0 text-muted-foreground transition-colors group-hover:text-accent"
              />
              <span className="min-w-0 truncate font-display font-semibold text-foreground">
                {country}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div
          className="empty-state"
          data-ocid="storefront.country_directory.empty_state"
        >
          <Globe2 size={44} className="empty-state-icon" />
          <h3 className="font-display text-xl font-bold text-foreground">
            {t("Sin países disponibles", "No countries available")}
          </h3>
          <p className="text-muted-foreground max-w-sm">
            {t(
              "Vuelve pronto para explorar por país.",
              "Check back soon to browse by country.",
            )}
          </p>
        </div>
      )}
    </section>
  );
}
