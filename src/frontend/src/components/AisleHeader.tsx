import { useLanguage } from "@/hooks/useLanguage";
import { findAisle } from "@/lib/genreAisles";
import { ChevronRight, Home } from "lucide-react";

interface AisleHeaderProps {
  genre: string;
  count: number;
  onBackToStorefront: () => void;
}

/**
 * Aisle header: breadcrumb back to the storefront, the genre name, and the
 * live track count. The colored spine echoes the aisle card the user came from.
 */
export function AisleHeader({
  genre,
  count,
  onBackToStorefront,
}: AisleHeaderProps) {
  const { t, lang } = useLanguage();
  const aisle = findAisle(genre);
  const label = aisle ? (lang === "es" ? aisle.es : aisle.en) : genre;
  const spine = aisle?.spine ?? 1;

  return (
    <header
      className="aisle-header"
      style={{ ["--aisle-spine" as string]: `var(--genre-${spine})` }}
      data-ocid="aisle.header"
    >
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{
          backgroundImage:
            "linear-gradient(180deg, oklch(var(--aisle-spine)), oklch(var(--aisle-spine) / 0.3))",
        }}
        aria-hidden="true"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pl-6">
        <nav aria-label={t("Ruta", "Breadcrumb")} className="mb-3">
          <ol className="breadcrumb">
            <li>
              <button
                type="button"
                onClick={onBackToStorefront}
                className="inline-flex items-center gap-1.5"
                data-ocid="aisle.breadcrumb_storefront"
              >
                <Home size={12} />
                {t("Inicio", "Storefront")}
              </button>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={12} />
            </li>
            <li>
              <span
                className="text-foreground"
                aria-current="page"
                data-ocid="aisle.breadcrumb_current"
              >
                {label}
              </span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1
            className="font-display text-3xl md:text-4xl font-bold text-foreground"
            data-ocid="aisle.title"
          >
            {label}
          </h1>
          <p className="aisle-count" data-ocid="aisle.track_count">
            {count} {t("PISTAS", "TRACKS")}
          </p>
        </div>
      </div>
    </header>
  );
}
