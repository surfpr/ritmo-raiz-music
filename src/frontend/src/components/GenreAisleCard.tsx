import { useLanguage } from "@/hooks/useLanguage";
import type { AisleSummary } from "@/lib/genreAisles";
import { Disc3 } from "lucide-react";

interface GenreAisleCardProps {
  aisle: AisleSummary;
  index: number;
  onSelect: (genre: string) => void;
}

/**
 * A single genre aisle card — the crate. A colored spine tab on the left edge
 * carries the genre family hue; the cover art and track count sit on top.
 * Selecting the card drills into that genre's aisle view.
 */
export function GenreAisleCard({
  aisle,
  index,
  onSelect,
}: GenreAisleCardProps) {
  const { t, lang } = useLanguage();
  const label = lang === "es" ? aisle.es : aisle.en;
  const isEmpty = aisle.count === 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(aisle.value)}
      className="aisle-card group text-left animate-aisle-rise"
      style={{
        animationDelay: `${Math.min(index, 11) * 40}ms`,
        ["--aisle-spine" as string]: `var(--genre-${aisle.spine})`,
      }}
      aria-label={t(
        `Abrir pasillo ${label}, ${aisle.count} canciones`,
        `Open ${label} aisle, ${aisle.count} tracks`,
      )}
      data-ocid={`storefront.aisle_card.${index + 1}`}
    >
      <span className="aisle-spine" aria-hidden="true" />

      <div className="aisle-art">
        {aisle.coverUrl ? (
          <img
            src={aisle.coverUrl}
            alt=""
            className="w-full h-full object-cover transition-smooth group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc3 size={40} className="empty-state-icon" />
          </div>
        )}
        <span className="absolute top-3 left-4 z-10 inline-flex items-center rounded-full bg-background/70 backdrop-blur px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-foreground">
          {isEmpty
            ? t("Próximamente", "Coming soon")
            : `${aisle.count} ${t("pistas", "tracks")}`}
        </span>
      </div>

      <div className="p-4 pl-5">
        <h3 className="aisle-name truncate">{label}</h3>
        <p className="aisle-count mt-1">
          {t("PASILLO", "AISLE")} · {aisle.value.toUpperCase()}
        </p>
      </div>
    </button>
  );
}
