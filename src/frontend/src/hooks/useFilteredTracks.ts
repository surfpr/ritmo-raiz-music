import type { TrackSummary } from "@/backend";
import type { FilterState } from "@/components/FilterPanel";
import { normalizeGenre } from "@/lib/genreAisles";

/**
 * Tests whether a price (in cents) matches any of the active price-range segments.
 * priceRange values: "0-10" | "10-50" | "50-200" | "200+"
 */
function priceMatchesRanges(priceCents: number, ranges: string[]): boolean {
  if (!ranges.length) return true;
  const usd = priceCents / 100;
  return ranges.some((r) => {
    if (r === "0-10") return usd <= 10;
    if (r === "10-50") return usd > 10 && usd <= 50;
    if (r === "50-200") return usd > 50 && usd <= 200;
    if (r === "200+") return usd > 200;
    return false;
  });
}

/**
 * Client-side filtering of the full TrackSummary catalog based on FilterState.
 * TrackSummary carries all filterable metadata (genre, country, vocalType,
 * mood, tempo, recommendedUse, priceCents) plus direct cover/audio URLs, so
 * filtering here never triggers blob byte downloads. The result is then
 * paginated by the store page.
 */
export function applyFilters(
  tracks: TrackSummary[],
  filters: FilterState,
  search: string,
): TrackSummary[] {
  const q = search.toLowerCase().trim();

  return tracks.filter((track) => {
    // Search
    if (q) {
      const titleMatch =
        track.title.es.toLowerCase().includes(q) ||
        track.title.en.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q);
      if (!titleMatch) return false;
    }

    // Genre (single select) — legacy aliases fold into their canonical genre.
    if (filters.genre && normalizeGenre(track.genre) !== filters.genre)
      return false;

    // Country (single select)
    if (filters.country && track.country !== filters.country) return false;

    // Vocal type (multi, OR within category)
    if (filters.vocalTypes.length > 0) {
      const tv = track.vocalType ?? "";
      if (!filters.vocalTypes.includes(tv)) return false;
    }

    // Mood (multi, OR within category)
    if (filters.moods.length > 0) {
      const tm = track.mood ?? "";
      if (!filters.moods.includes(tm)) return false;
    }

    // Tempo (multi, OR within category)
    if (filters.tempos.length > 0) {
      const tt = track.tempo ?? "";
      if (!filters.tempos.includes(tt)) return false;
    }

    // Recommended use (multi, OR within category)
    if (filters.recommendedUses.length > 0) {
      const ru = track.recommendedUse ?? "";
      if (!filters.recommendedUses.includes(ru)) return false;
    }

    // Price range (client-side, from the track's own priceCents)
    if (filters.priceRanges.length > 0) {
      if (!priceMatchesRanges(Number(track.priceCents), filters.priceRanges)) {
        return false;
      }
    }

    return true;
  });
}
