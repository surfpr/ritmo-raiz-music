import {
  ExternalBlob,
  type LicenseTier,
  type Track,
  type TrackSummary,
} from "@/backend";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStopAudioOnLeaveView } from "@/hooks/useAudioPrefetch";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/hooks/useLanguage";
import { useGetPaymentLinks, useIsStripeConfigured } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { Award, ShoppingCart } from "lucide-react";
import { useState } from "react";

/** Resolves a cover image URL from either a full Track or a TrackSummary. */
function coverUrl(track: Track | TrackSummary): string {
  if ("coverImageUrl" in track) return track.coverImageUrl;
  return getBlobUrl(track.coverImage);
}

/** Resolves an audio sample URL from either a full Track or a TrackSummary. */
function audioUrl(track: Track | TrackSummary): string {
  if ("audioSampleUrl" in track) return track.audioSampleUrl;
  return getBlobUrl(track.audioFile);
}

/**
 * Resolves the 25-second sample window from either a full Track or a
 * TrackSummary. Both carry sampleStartSec/sampleEndSec at runtime; the
 * TrackSummary type does not declare them, so the `in` check narrows to Track
 * while still reading the values the backend returns on summaries.
 */
function sampleWindow(track: Track | TrackSummary): {
  start: number;
  end?: number;
} {
  if ("sampleStartSec" in track) {
    return {
      start: Number(track.sampleStartSec),
      end: Number(track.sampleEndSec),
    };
  }
  return { start: 0, end: undefined };
}

export function getBlobUrl(
  blob: ExternalBlob | { directURL?: string } | unknown,
): string {
  if (blob instanceof ExternalBlob) {
    return blob.getDirectURL();
  }
  if (blob && typeof blob === "object") {
    const url = (blob as Record<string, unknown>).directURL;
    if (typeof url === "string") return url;
  }
  return "";
}

const LICENSE_DESCRIPTIONS: Record<string, { es: string; en: string }> = {
  personal: {
    es: "Para uso individual y no comercial. Ideal para proyectos personales, tareas escolares o contenido privado sin monetizar.",
    en: "For individual, non-commercial use only. Ideal for personal projects, school assignments, or private content that is not monetized.",
  },
  commercial: {
    es: "Para empresas, creadores y profesionales que usan música en contenido monetizado o distribuido públicamente.",
    en: "For businesses, content creators, and professionals using music in monetized or publicly distributed content.",
  },
  enterprise: {
    es: "Derechos completos de emisión y sincronización para uso comercial a gran escala. Incluye Certificado PDF de Licencia.",
    en: "Full broadcast and sync rights for large-scale commercial use. Includes PDF License Certificate.",
  },
  broadcast: {
    es: "Derechos completos de emisión y sincronización para uso comercial a gran escala. Incluye Certificado PDF de Licencia.",
    en: "Full broadcast and sync rights for large-scale commercial use. Includes PDF License Certificate.",
  },
};

const DEFAULT_DESCRIPTIONS: { es: string; en: string }[] = [
  LICENSE_DESCRIPTIONS.personal,
  LICENSE_DESCRIPTIONS.commercial,
  LICENSE_DESCRIPTIONS.enterprise,
];

function getLicenseDescription(
  lic: LicenseTier,
  index: number,
): { es: string; en: string } {
  try {
    const stored = localStorage.getItem(`lic_desc_${String(lic.id)}`);
    if (stored) return JSON.parse(stored) as { es: string; en: string };
  } catch {
    // ignore
  }
  const nameLower = (lic.name.en || lic.name.es).toLowerCase();
  for (const [key, desc] of Object.entries(LICENSE_DESCRIPTIONS)) {
    if (nameLower.includes(key)) return desc;
  }
  return DEFAULT_DESCRIPTIONS[index] ?? DEFAULT_DESCRIPTIONS[2];
}

export function isEnterpriseTier(lic: LicenseTier): boolean {
  const name = (lic.name.en || lic.name.es).toLowerCase();
  return name.includes("enterprise") || name.includes("broadcast");
}

interface TrackCardProps {
  track: Track | TrackSummary;
  licenses?: LicenseTier[];
  className?: string;
}

function getLicenseLink(
  lic: LicenseTier,
  links:
    | {
        personalLicenseLink: string;
        commercialLicenseLink: string;
        enterpriseLicenseLink: string;
      }
    | undefined,
): string {
  if (!links) return "";
  const name = (lic.name.en || lic.name.es).toLowerCase();
  if (name.includes("enterprise") || name.includes("broadcast"))
    return links.enterpriseLicenseLink;
  if (name.includes("commercial")) return links.commercialLicenseLink;
  return links.personalLicenseLink;
}

export function TrackCard({ track, licenses, className }: TrackCardProps) {
  const { t } = useLanguage();
  const { data: paymentLinks } = useGetPaymentLinks();
  const { data: isStripeConfigured } = useIsStripeConfigured();
  const { addItem, openCart } = useCart();
  const [opened, setOpened] = useState<bigint | null>(null);

  // Stop/unload the preview when this card scrolls out of view.
  const cardRef = useStopAudioOnLeaveView<HTMLDivElement>(audioUrl(track));

  const handleBuy = (lic: LicenseTier) => {
    // Dynamic checkout configured: add the track + chosen tier to the cart.
    if (isStripeConfigured) {
      addItem({
        kind: "track",
        trackId: track.id,
        licenseTierId: lic.id,
        title: t(track.title.es, track.title.en),
        artist: track.artist,
        coverUrl: coverUrl(track),
        licenseName: t(lic.name.es, lic.name.en),
        priceCents: Number(lic.priceUsd),
        quantity: 1,
      });
      openCart();
      return;
    }
    // Fallback: open the static Payment Link when dynamic checkout is off.
    const url = getLicenseLink(lic, paymentLinks);
    if (url) {
      window.open(url, "_blank");
      setOpened(lic.id);
      setTimeout(() => setOpened(null), 2000);
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-smooth group",
        className,
      )}
      data-ocid="track_card"
    >
      {/* Cover image — lazy-loaded only when the card is on screen */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={coverUrl(track)}
          alt={track.title.es}
          className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <Badge className="bg-primary/80 text-primary-foreground text-xs border-0">
            {track.genre}
          </Badge>
          <Badge className="bg-card/50 text-foreground text-xs border-0">
            {track.country}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display font-bold text-foreground truncate">
            {t(track.title.es, track.title.en)}
          </h3>
          <p className="text-sm text-muted-foreground">{track.artist}</p>
        </div>

        {/* On-demand audio player — plays only the 25s sample window */}
        <AudioPlayer
          audioUrl={audioUrl(track)}
          sampleStartSec={sampleWindow(track).start}
          sampleEndSec={sampleWindow(track).end}
          data-ocid="track_card.audio_player"
        />

        {/* License purchase buttons */}
        {licenses && licenses.length > 0 && (
          <div className="space-y-2">
            {licenses.map((lic, index) => {
              const isEnterprise = isEnterpriseTier(lic);
              const desc = getLicenseDescription(lic, index);
              const link = getLicenseLink(lic, paymentLinks);
              const isOpened = opened === lic.id;
              return (
                <div
                  key={String(lic.id)}
                  className="rounded-xl border border-border px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold text-foreground">
                      {t(lic.name.es, lic.name.en)}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEnterprise && (
                        <span className="flex items-center gap-0.5 text-[10px] bg-primary/15 text-primary border border-primary/30 rounded-full px-1.5 py-0.5 font-medium">
                          <Award size={10} />
                          PDF
                        </span>
                      )}
                      <span className="text-xs font-bold text-muted-foreground">
                        ${(Number(lic.priceUsd) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                    {t(desc.es, desc.en)}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={cn(
                      "w-full gap-1.5 text-xs transition-smooth",
                      isOpened
                        ? "bg-accent text-accent-foreground border-accent hover:bg-accent/90"
                        : "border-primary/40 text-primary hover:bg-primary/10",
                    )}
                    onClick={() => handleBuy(lic)}
                    disabled={!isStripeConfigured && !link}
                    data-ocid={`track_card.buy_${index + 1}_button`}
                  >
                    <ShoppingCart size={12} />
                    {isOpened
                      ? t("Abierto", "Opened")
                      : t(
                          `Agregar ${t(lic.name.es, lic.name.en)}`,
                          `Add ${t(lic.name.en, lic.name.es)}`,
                        )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
