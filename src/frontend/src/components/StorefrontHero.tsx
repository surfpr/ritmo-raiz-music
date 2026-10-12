import type { LicenseTier, Track } from "@/backend";
import { StoreSearchBar } from "@/components/StoreSearchBar";
import { TrackCard, getBlobUrl } from "@/components/TrackCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowRight, Disc3, Play } from "lucide-react";
import { motion } from "motion/react";

interface StorefrontHeroProps {
  featured: Track[];
  isLoading: boolean;
  licenses: LicenseTier[];
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onBrowseAisles: () => void;
  onPlayFeatured: () => void;
}

/**
 * Storefront hero band: the store's front door. Leads with the featured track
 * as the primary anchor, a prominent search entry, and a compact rail of the
 * remaining featured tracks.
 */
export function StorefrontHero({
  featured,
  isLoading,
  licenses,
  search,
  onSearchChange,
  onSearchSubmit,
  onBrowseAisles,
  onPlayFeatured,
}: StorefrontHeroProps) {
  const { t } = useLanguage();
  const lead = featured[0];
  const rest = featured.slice(1, 5);

  return (
    <section className="store-hero" data-ocid="storefront.hero">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          {/* Left: eyebrow, headline, search, CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >
            <p className="store-eyebrow mb-4">
              {t("La bodega de ritmos", "The rhythm crate")}
            </p>
            <h1 className="store-hero-title text-4xl sm:text-5xl md:text-6xl leading-[1.02] mb-4">
              {t("Explora por pasillos", "Browse the aisles")}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mb-7 leading-relaxed">
              {t(
                "Cada género es un pasillo. Recorre la tienda, escucha muestras y compra la licencia que necesitas.",
                "Every genre is an aisle. Wander the store, preview samples, and buy the license you need.",
              )}
            </p>

            <div className="max-w-xl mb-6">
              <StoreSearchBar
                value={search}
                onChange={onSearchChange}
                onSubmit={onSearchSubmit}
                size="hero"
                ocid="storefront.search_input"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onBrowseAisles}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary text-primary-foreground font-display font-bold text-sm px-5 py-3 shadow-elevated hover:-translate-y-0.5 transition-smooth"
                data-ocid="storefront.browse_aisles_button"
              >
                <Disc3 size={18} />
                {t("Ver pasillos", "Browse aisles")}
              </button>
              {lead && (
                <button
                  type="button"
                  onClick={onPlayFeatured}
                  className="inline-flex items-center gap-2 rounded-full border border-accent/50 text-foreground font-semibold text-sm px-5 py-3 hover:border-accent hover:bg-accent/10 transition-smooth"
                  data-ocid="storefront.play_featured_button"
                >
                  <Play size={16} />
                  {t("Ver destacadas", "View featured")}
                </button>
              )}
            </div>
          </motion.div>

          {/* Right: featured anchor card + mini rail */}
          <div className="min-w-0">
            {isLoading ? (
              <Skeleton
                className="h-[420px] w-full rounded-2xl"
                data-ocid="storefront.hero.loading_state"
              />
            ) : lead ? (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="animate-aisle-rise"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="store-eyebrow">
                    {t("Destacada", "Featured")}
                  </span>
                  <span className="aisle-count">{t("ANCLA", "ANCHOR")}</span>
                </div>
                <div className="max-w-sm">
                  <TrackCard track={lead} licenses={licenses} />
                </div>
                {rest.length > 0 && (
                  <div className="mt-4 flex gap-3 overflow-x-auto scrollbar-none pb-1">
                    {rest.map((track) => (
                      <div
                        key={String(track.id)}
                        className="w-28 shrink-0 rounded-xl overflow-hidden border border-aisle-border/60 bg-aisle-surface"
                      >
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={getBlobUrl(track.coverImage)}
                            alt={t(track.title.es, track.title.en)}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-[11px] font-semibold text-foreground truncate">
                            {t(track.title.es, track.title.en)}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <div
                className="empty-state"
                data-ocid="storefront.hero.empty_state"
              >
                <Disc3 size={40} className="empty-state-icon" />
                <p className="text-foreground font-semibold">
                  {t(
                    "Aún no hay canciones destacadas",
                    "No featured tracks yet",
                  )}
                </p>
                <button
                  type="button"
                  onClick={onBrowseAisles}
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                  data-ocid="storefront.hero.browse_link"
                >
                  {t("Explorar pasillos", "Browse aisles")}
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
