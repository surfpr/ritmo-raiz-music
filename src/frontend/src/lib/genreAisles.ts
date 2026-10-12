import type { TrackSummary } from "@/backend";

/**
 * Canonical genre aisle definitions. The `value` matches the backend Genre
 * string exactly (see FilterPanel.FILTER_GENRES). `spine` selects one of the
 * six --genre-N OKLCH hues defined in index.css so each aisle family keeps a
 * stable record-crate tab color.
 */
export interface GenreAisle {
  value: string;
  es: string;
  en: string;
  spine: 1 | 2 | 3 | 4 | 5 | 6;
}

export const GENRE_AISLES: GenreAisle[] = [
  { value: "Salsa", es: "Salsa", en: "Salsa", spine: 1 },
  { value: "Merengue", es: "Merengue", en: "Merengue", spine: 2 },
  { value: "Bachata", es: "Bachata", en: "Bachata", spine: 6 },
  { value: "Cumbia", es: "Cumbia", en: "Cumbia", spine: 2 },
  { value: "Reggaeton", es: "Reggaetón", en: "Reggaeton", spine: 4 },
  { value: "Vallenato", es: "Vallenato", en: "Vallenato", spine: 5 },
  { value: "Bolero", es: "Bolero", en: "Bolero", spine: 3 },
  { value: "Latin Pop", es: "Latin Pop", en: "Latin Pop", spine: 3 },
  { value: "Mariachi", es: "Mariachi", en: "Mariachi", spine: 1 },
  { value: "Flamenco", es: "Flamenco", en: "Flamenco", spine: 1 },
  {
    value: "Afrobeat Latino",
    es: "Afrobeat Latino",
    en: "Afrobeat Latino",
    spine: 4,
  },
  { value: "Sacra", es: "Sacra", en: "Sacred", spine: 5 },
];

/**
 * Legacy genre aliases folded into a canonical genre. "Trap Latino" is
 * presented as "Reggaeton" everywhere in the store, so existing Trap Latino
 * songs surface under the Reggaeton aisle.
 */
const GENRE_ALIASES: Record<string, string> = {
  "Trap Latino": "Reggaeton",
};

/** Resolves a raw backend genre value to its canonical store genre. */
export function normalizeGenre(genre: string): string {
  return GENRE_ALIASES[genre] ?? genre;
}

/** Looks up an aisle definition by its backend genre value. */
export function findAisle(genre: string): GenreAisle | undefined {
  const canonical = normalizeGenre(genre);
  return GENRE_AISLES.find((a) => a.value === canonical);
}

/** Bilingual display label for a genre value, falling back to the raw value. */
export function genreLabel(genre: string, lang: "es" | "en"): string {
  const aisle = findAisle(genre);
  if (!aisle) return genre;
  return lang === "es" ? aisle.es : aisle.en;
}

export interface AisleSummary extends GenreAisle {
  count: number;
  coverUrl: string;
}

/**
 * Builds the aisle directory from the full catalog: one entry per canonical
 * genre, with its live track count and a representative cover (the first track
 * that has a cover image). Genres with no tracks still appear, so the directory
 * is a stable, complete map of the store. Legacy aliases (Trap Latino) are
 * folded into their canonical genre before counting.
 */
export function buildAisleDirectory(tracks: TrackSummary[]): AisleSummary[] {
  const byGenre = new Map<string, TrackSummary[]>();
  for (const track of tracks) {
    const key = normalizeGenre(track.genre);
    const list = byGenre.get(key);
    if (list) list.push(track);
    else byGenre.set(key, [track]);
  }

  return GENRE_AISLES.map((aisle) => {
    const list = byGenre.get(aisle.value) ?? [];
    const withCover = list.find((t) => t.coverImageUrl);
    return {
      ...aisle,
      count: list.length,
      coverUrl: withCover?.coverImageUrl ?? "",
    };
  });
}

/** A genre group inside the Instrumental area, with its instrumental tracks. */
export interface InstrumentalGroup {
  genre: string;
  label: string;
  tracks: TrackSummary[];
}

/**
 * Groups instrumental songs by their existing genre (Salsa, Cumbia, …) for the
 * dedicated Instrumental area. Only genres that actually have instrumental
 * songs appear, ordered by the canonical aisle order.
 */
export function buildInstrumentalGroups(
  tracks: TrackSummary[],
): InstrumentalGroup[] {
  const byGenre = new Map<string, TrackSummary[]>();
  for (const track of tracks) {
    if (track.vocalType !== "Instrumental") continue;
    const key = normalizeGenre(track.genre);
    const list = byGenre.get(key);
    if (list) list.push(track);
    else byGenre.set(key, [track]);
  }

  const groups: InstrumentalGroup[] = [];
  for (const aisle of GENRE_AISLES) {
    // Sacra is religious music and is intentionally excluded from the
    // Instrumental area, even when a track is tagged vocalType "Instrumental".
    if (aisle.value === "Sacra") continue;
    const list = byGenre.get(aisle.value);
    if (list && list.length > 0) {
      groups.push({ genre: aisle.value, label: aisle.es, tracks: list });
    }
  }
  return groups;
}
