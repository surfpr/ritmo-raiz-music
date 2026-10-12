/**
 * Shared canonical filter constants.
 * Values are PascalCase / spaced strings — the single source of truth
 * for TracksPanel, BulkUploadPanel, FilterPanel, and useFilteredTracks.
 */

export interface MetaOption {
  value: string;
  es: string;
  en: string;
}

/** Vocal type options */
export const VOCAL_TYPES: MetaOption[] = [
  { value: "Lyrical", es: "Con letra", en: "Lyrical" },
  { value: "Instrumental", es: "Instrumental", en: "Instrumental" },
];

/** Mood options */
export const MOODS: MetaOption[] = [
  { value: "Energetic", es: "Energético", en: "Energetic" },
  { value: "Romantic", es: "Romántico", en: "Romantic" },
  { value: "Festive", es: "Festivo", en: "Festive" },
  { value: "Melancholic", es: "Melancólico", en: "Melancholic" },
  { value: "Relaxing", es: "Relajante", en: "Relaxing" },
  { value: "Motivational", es: "Motivacional", en: "Motivational" },
  { value: "Dramatic", es: "Dramático", en: "Dramatic" },
  { value: "Upbeat", es: "Alegre", en: "Upbeat" },
  { value: "Nostalgic", es: "Nostálgico", en: "Nostalgic" },
];

/** Tempo options */
export const TEMPOS: MetaOption[] = [
  { value: "Slow", es: "Lento (<80 BPM)", en: "Slow (<80 BPM)" },
  {
    value: "Moderate",
    es: "Moderado (80–120 BPM)",
    en: "Moderate (80–120 BPM)",
  },
  { value: "Fast", es: "Rápido (>120 BPM)", en: "Fast (>120 BPM)" },
];

/** Recommended use options */
export const RECOMMENDED_USES: MetaOption[] = [
  { value: "Advertising", es: "Publicidad", en: "Advertising" },
  { value: "Film & TV", es: "Cine & TV", en: "Film & TV" },
  { value: "Social Media", es: "Redes Sociales", en: "Social Media" },
  { value: "On-Hold Music", es: "Call Center", en: "On-Hold Music" },
  { value: "Podcast", es: "Podcast", en: "Podcast" },
  { value: "Event", es: "Evento", en: "Event" },
  { value: "Gaming", es: "Juegos", en: "Gaming" },
];

/**
 * Helper: convert a MetaOption array into a <select> options array.
 * Prepends a blank "-- Select --" entry.
 */
export function toSelectOptions(
  items: MetaOption[],
): { value: string; label: string }[] {
  return [
    { value: "", label: "-- Seleccionar / Select --" },
    ...items.map((i) => ({ value: i.value, label: `${i.es} / ${i.en}` })),
  ];
}
