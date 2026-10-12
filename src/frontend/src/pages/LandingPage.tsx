import type { ServiceItem } from "@/backend";
import { TrackCard } from "@/components/TrackCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useFeaturedTracks,
  useLandingContent,
  useNewArrivalTracks,
} from "@/hooks/useQueries";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Film,
  Guitar,
  Megaphone,
  Music,
  Radio,
  Sparkles,
  Star,
} from "lucide-react";
import { motion } from "motion/react";

const FALLBACK_SERVICES: ServiceItem[] = [
  {
    id: 1n,
    icon: "Music",
    title: { es: "Aficionados", en: "Enthusiasts" },
    description: {
      es: "Música perfecta para tu colección personal",
      en: "Perfect music for your personal collection",
    },
  },
  {
    id: 2n,
    icon: "Radio",
    title: { es: "Radio", en: "Radio" },
    description: {
      es: "Tracks con licencia para emisoras",
      en: "Licensed tracks for radio stations",
    },
  },
  {
    id: 3n,
    icon: "Film",
    title: { es: "Cine & TV", en: "Film & TV" },
    description: {
      es: "Bandas sonoras para producciones audiovisuales",
      en: "Soundtracks for visual productions",
    },
  },
  {
    id: 4n,
    icon: "Megaphone",
    title: { es: "Comerciales", en: "Commercials" },
    description: {
      es: "Música vibrante para publicidad",
      en: "Vibrant music for advertising",
    },
  },
  {
    id: 5n,
    icon: "Guitar",
    title: { es: "Músicos", en: "Musicians" },
    description: {
      es: "Samples e inspiración para artistas",
      en: "Samples and inspiration for artists",
    },
  },
  {
    id: 6n,
    icon: "Star",
    title: { es: "Música Custom", en: "Custom Music" },
    description: {
      es: "Composiciones únicas para tu proyecto",
      en: "Unique compositions for your project",
    },
  },
];

const ICON_MAP: Record<string, typeof Music> = {
  Music,
  Radio,
  Film,
  Megaphone,
  Guitar,
  Star,
  Sparkles,
};

// Floating decorative elements — Latin instruments + music notes
const FLOAT_ITEMS = [
  { top: "7%", left: "4%", emoji: "🎵", size: "text-3xl", delay: 0 },
  { top: "12%", right: "7%", emoji: "🎶", size: "text-2xl", delay: 0.5 },
  { top: "28%", left: "2%", emoji: "🥁", size: "text-4xl", delay: 1.0 },
  { top: "50%", right: "3%", emoji: "🎺", size: "text-3xl", delay: 0.3 },
  { top: "68%", left: "6%", emoji: "🎸", size: "text-3xl", delay: 0.8 },
  { top: "18%", left: "28%", emoji: "🎵", size: "text-xl", delay: 1.2 },
  { top: "42%", right: "18%", emoji: "🎶", size: "text-2xl", delay: 0.6 },
  { top: "78%", right: "12%", emoji: "🪘", size: "text-3xl", delay: 1.4 },
  { top: "60%", left: "22%", emoji: "🎵", size: "text-lg", delay: 0.9 },
  { top: "85%", left: "40%", emoji: "🎶", size: "text-xl", delay: 1.6 },
] as const;

export default function LandingPage() {
  const { t } = useLanguage();
  const { data: landing } = useLandingContent();
  const { data: featured, isLoading: featLoading } = useFeaturedTracks();
  const { data: newArrivals, isLoading: newLoading } = useNewArrivalTracks();

  const heroSubtitleEs =
    landing?.heroSubtitle?.es ??
    "La primera tienda de música impulsada por IA para la cultura Latina.";
  const heroSubtitleEn =
    landing?.heroSubtitle?.en ??
    "The first AI-powered music store for Latin culture.";

  const services: ServiceItem[] =
    landing?.services && landing.services.length > 0
      ? landing.services
      : FALLBACK_SERVICES;

  const servicesSectionTitle = landing?.servicesTitle
    ? { es: landing.servicesTitle.es, en: landing.servicesTitle.en }
    : { es: "Nuestros Servicios", en: "Our Services" };

  return (
    <div className="flex flex-col">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background"
        data-ocid="landing.hero_section"
      >
        {/* Animated waveform bars */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <svg
            className="w-full h-full opacity-[0.07]"
            viewBox="0 0 1440 800"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            role="presentation"
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <path
                key={n}
                d={`M0,${390 + n * 12} Q360,${340 + n * 8} 720,${390 + n * 12} T1440,${390 + n * 12}`}
                stroke={`oklch(${0.62 + n * 0.025} ${0.23 - n * 0.01} ${20 + n * 10})`}
                strokeWidth={3 - n * 0.4}
                fill="none"
                style={{ animationDelay: `${n * 0.4}s` }}
                className="animate-pulse"
              />
            ))}
          </svg>
        </div>

        {/* Floating Latin instruments */}
        {FLOAT_ITEMS.map((item) => (
          <motion.div
            key={`fi-${item.top}-${item.emoji}`}
            className={`absolute pointer-events-none select-none ${item.size}`}
            style={{
              top: item.top,
              ...("left" in item
                ? { left: item.left }
                : { right: (item as { right: string }).right }),
            }}
            aria-hidden="true"
            animate={{
              y: [-10, 10, -10],
              rotate: [-6, 6, -6],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 3 + item.delay * 0.5,
              delay: item.delay,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            {item.emoji}
          </motion.div>
        ))}

        {/* Hero content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/40 text-sm px-4 py-1.5">
              🎵{" "}
              {t(
                "IA Generativa para Música Latina",
                "Generative AI for Latin Music",
              )}
            </Badge>
          </motion.div>

          {/* Bilingual stacked headline — both lines always visible */}
          <motion.h1
            className="font-display font-bold leading-tight mb-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="block text-4xl md:text-6xl text-foreground">
              Ritmo Raíz Music
            </span>
            <span className="block text-4xl md:text-6xl text-accent mt-1">
              {t(
                "Descubre el Futuro del Ritmo Latino",
                "Discover the Future of Latin Rhythm",
              )}
            </span>
          </motion.h1>

          <motion.p
            className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {heroSubtitleEs}
          </motion.p>
          <motion.p
            className="text-muted-foreground/70 text-sm md:text-base max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {heroSubtitleEn}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-lg px-8 py-6 rounded-full shadow-lg transition-smooth"
              data-ocid="landing.explore_button"
            >
              <Link to="/store">
                {t("Explora la Música", "Explore the Music")}
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-primary/50 text-foreground hover:bg-primary/10 font-semibold text-lg px-8 py-6 rounded-full transition-smooth"
              data-ocid="landing.custom_music_cta_button"
            >
              <Link to="/custom-music">
                {t("Música Custom", "Custom Music")}
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          aria-hidden="true"
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/40 flex items-start justify-center pt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </div>
        </motion.div>
      </section>

      {/* ─── Services ─────────────────────────────────────────── */}
      <section
        className="bg-muted/30 py-24 px-6"
        data-ocid="landing.services_section"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
              {t(servicesSectionTitle.es, servicesSectionTitle.en)}
            </h2>
            <p className="text-accent font-medium mb-3">
              / {t(servicesSectionTitle.en, servicesSectionTitle.es)}
            </p>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t(
                "Música latina de IA para cada necesidad creativa",
                "AI Latin music for every creative need",
              )}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => {
              const IconComp = ICON_MAP[service.icon] ?? Music;
              return (
                <motion.div
                  key={String(service.id)}
                  className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-md transition-smooth group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  data-ocid={`landing.service.item.${i + 1}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-smooth">
                    <IconComp className="text-primary" size={24} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground mb-1">
                    {service.title.es}
                  </h3>
                  <p className="text-accent text-xs font-medium mb-2">
                    {service.title.en}
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t(service.description.es, service.description.en)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Tracks */}
      <section
        className="bg-background py-24 px-6"
        data-ocid="landing.featured_section"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="flex items-end justify-between mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <h2 className="font-display text-4xl font-bold text-foreground">
                {t("Canciones Destacadas", "Featured Tracks")}
              </h2>
              <p className="text-accent font-semibold mt-1">
                / {t("Featured Tracks", "Canciones Destacadas")}
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              className="text-primary hover:text-primary"
              data-ocid="landing.view_all_featured_button"
            >
              <Link to="/store">
                {t("Ver en Tienda", "View in Store")}{" "}
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </Button>
          </motion.div>

          {featLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : featured && featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.slice(0, 6).map((track, i) => (
                <motion.div
                  key={String(track.id)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  data-ocid={`landing.featured_track.item.${i + 1}`}
                >
                  <TrackCard track={track} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div
              className="text-center py-16 text-muted-foreground"
              data-ocid="landing.featured_tracks.empty_state"
            >
              <Music size={48} className="mx-auto mb-4 opacity-40" />
              <p>
                {t(
                  "Los tracks destacados aparecerán aquí",
                  "Featured tracks will appear here",
                )}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section
        className="bg-muted/30 py-24 px-6"
        data-ocid="landing.new_arrivals_section"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="flex items-end justify-between mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <h2 className="font-display text-4xl font-bold text-foreground">
                {t("Recién Llegados", "New Arrivals")}
              </h2>
              <p className="text-accent font-semibold mt-1">
                / {t("New Arrivals", "Recién Llegados")}
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              className="text-primary hover:text-primary"
              data-ocid="landing.view_all_new_button"
            >
              <Link to="/custom-music">
                {t("Pedir Custom", "Order Custom")}{" "}
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </Button>
          </motion.div>

          {newLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : newArrivals && newArrivals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newArrivals.slice(0, 6).map((track, i) => (
                <motion.div
                  key={String(track.id)}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  data-ocid={`landing.new_arrival.item.${i + 1}`}
                >
                  <TrackCard track={track} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div
              className="text-center py-16 text-muted-foreground"
              data-ocid="landing.new_arrivals.empty_state"
            >
              <Sparkles size={48} className="mx-auto mb-4 opacity-40" />
              <p>
                {t(
                  "Los nuevos arrivals aparecerán aquí",
                  "New arrivals will appear here",
                )}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Custom Music CTA */}
      <section
        className="bg-background py-24 px-6"
        data-ocid="landing.custom_cta_section"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="bg-card border border-primary/30 rounded-3xl p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
              <Sparkles className="mx-auto text-primary mb-4" size={48} />
              <h2 className="font-display text-4xl font-bold text-foreground mb-4">
                {landing?.customMusicCtaTitle
                  ? t(
                      landing.customMusicCtaTitle.es,
                      landing.customMusicCtaTitle.en,
                    )
                  : t("¿Necesitas música única?", "Need unique music?")}
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                {landing?.customMusicCtaBody
                  ? t(
                      landing.customMusicCtaBody.es,
                      landing.customMusicCtaBody.en,
                    )
                  : t(
                      "Creamos composiciones exclusivas para tu proyecto en 24 horas.",
                      "We create exclusive compositions for your project in 24 hours.",
                    )}
              </p>
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-lg px-10 py-6 rounded-full shadow-lg transition-smooth"
                data-ocid="landing.custom_music_bottom_cta_button"
              >
                <Link to="/custom-music">
                  {t("Pedir Música Custom", "Order Custom Music")}
                  <ArrowRight className="ml-2" size={20} />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
