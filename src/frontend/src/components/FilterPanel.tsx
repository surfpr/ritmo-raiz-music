import { useLanguage } from "@/hooks/useLanguage";
import {
  MOODS,
  RECOMMENDED_USES,
  TEMPOS,
  VOCAL_TYPES,
} from "@/lib/filterConstants";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

// ── Filter option definitions ──────────────────────────────────────────────

export const FILTER_GENRES = [
  "Salsa",
  "Merengue",
  "Bachata",
  "Reggaeton",
  "Cumbia",
  "Vallenato",
  "Bolero",
  "Latin Pop",
  "Mariachi",
  "Flamenco",
  "Afrobeat Latino",
  "Sacra",
];

/**
 * Canonical country list for the store. Covers all Latin countries plus
 * Puerto Rico and España, followed by the non-Latin markets the catalog uses.
 */
export const FILTER_COUNTRIES = [
  "México",
  "Colombia",
  "Puerto Rico",
  "Cuba",
  "República Dominicana",
  "Argentina",
  "Venezuela",
  "España",
  "Panamá",
  "Perú",
  "Chile",
  "Ecuador",
  "Bolivia",
  "Guatemala",
  "Honduras",
  "El Salvador",
  "Nicaragua",
  "Costa Rica",
  "Paraguay",
  "Uruguay",
  "Estados Unidos",
  "Internacional",
];

// VOCAL_TYPES, MOODS, TEMPOS, RECOMMENDED_USES imported from @/lib/filterConstants
export {
  VOCAL_TYPES,
  MOODS,
  TEMPOS,
  RECOMMENDED_USES,
} from "@/lib/filterConstants";

export const PRICE_RANGES = [
  { value: "0-10", es: "Hasta $10", en: "Up to $10" },
  { value: "10-50", es: "$10 – $50", en: "$10 – $50" },
  { value: "50-200", es: "$50 – $200", en: "$50 – $200" },
  { value: "200+", es: "Más de $200", en: "$200+" },
];

// ── FilterState type ────────────────────────────────────────────────────────

export interface FilterState {
  genre: string;
  country: string;
  vocalTypes: string[];
  moods: string[];
  tempos: string[];
  recommendedUses: string[];
  priceRanges: string[];
}

export const EMPTY_FILTERS: FilterState = {
  genre: "",
  country: "",
  vocalTypes: [],
  moods: [],
  tempos: [],
  recommendedUses: [],
  priceRanges: [],
};

export function countActiveFilters(f: FilterState): number {
  return (
    (f.genre ? 1 : 0) +
    (f.country ? 1 : 0) +
    f.vocalTypes.length +
    f.moods.length +
    f.tempos.length +
    f.recommendedUses.length +
    f.priceRanges.length
  );
}

// ── Shared pill helper ───────────────────────────────────────────────────────

function Pill({
  label,
  active,
  onClick,
  ocid,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  ocid?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-ocid={ocid}
      className={[
        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer select-none",
        active
          ? "bg-[oklch(0.52_0.20_35)] border-[oklch(0.52_0.20_35)] text-white shadow-sm"
          : "bg-transparent border-border text-muted-foreground hover:border-[oklch(0.52_0.20_35)] hover:text-foreground",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function SingleSelectPills({
  options,
  value,
  onChange,
  ocidPrefix,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  ocidPrefix: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <Pill
          key={opt}
          label={opt}
          active={value === opt}
          onClick={() => onChange(value === opt ? "" : opt)}
          ocid={`${ocidPrefix}.${opt.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
        />
      ))}
    </div>
  );
}

function MultiSelectPills({
  options,
  values,
  onChange,
  ocidPrefix,
}: {
  options: { value: string; es: string; en: string }[];
  values: string[];
  onChange: (v: string[]) => void;
  ocidPrefix: string;
}) {
  const { t } = useLanguage();
  const toggle = (val: string) => {
    onChange(
      values.includes(val) ? values.filter((v) => v !== val) : [...values, val],
    );
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <Pill
          key={opt.value}
          label={t(opt.es, opt.en)}
          active={values.includes(opt.value)}
          onClick={() => toggle(opt.value)}
          ocid={`${ocidPrefix}.${opt.value.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
        />
      ))}
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
  ocid,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  ocid?: string;
}) {
  return (
    <label
      className="flex items-center gap-2.5 cursor-pointer group"
      data-ocid={ocid}
    >
      <div
        className={[
          "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-200",
          checked
            ? "bg-[oklch(0.52_0.20_35)] border-[oklch(0.52_0.20_35)]"
            : "border-border bg-transparent group-hover:border-[oklch(0.52_0.20_35)]",
        ].join(" ")}
      >
        {checked && (
          <svg
            width="10"
            height="8"
            viewBox="0 0 10 8"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 4l2.5 2.5L9 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

// ── Accordion section wrapper ────────────────────────────────────────────────

function Section({
  value,
  title,
  children,
}: {
  value: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Accordion.Item
      value={value}
      className="border-b border-border last:border-0"
    >
      <Accordion.Header>
        <Accordion.Trigger className="w-full flex items-center justify-between py-3 text-sm font-semibold text-foreground hover:text-primary transition-colors group">
          {title}
          <ChevronDown
            size={14}
            className="text-muted-foreground group-data-[state=open]:rotate-180 transition-transform duration-200"
          />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
        <div className="pb-4">{children}</div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

// ── FilterPanel component ────────────────────────────────────────────────────

interface FilterPanelProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  /**
   * Whether to render the Genre section. The in-aisle refinement drawer hides
   * it because the aisle is already genre-scoped — showing it there would be a
   * dead control. Defaults to true.
   */
  showGenre?: boolean;
}

export function FilterPanel({
  filters,
  onChange,
  showGenre = true,
}: FilterPanelProps) {
  const { t } = useLanguage();

  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  const togglePriceRange = (val: string) => {
    const ranges = filters.priceRanges.includes(val)
      ? filters.priceRanges.filter((r) => r !== val)
      : [...filters.priceRanges, val];
    set("priceRanges", ranges);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-bold text-foreground tracking-wide uppercase">
          {t("Filtros", "Filters")}
        </h2>
      </div>

      <Accordion.Root
        type="multiple"
        defaultValue={
          showGenre
            ? ["genre", "vocalType", "country"]
            : ["vocalType", "country"]
        }
        className="px-4"
      >
        {/* Genre */}
        {showGenre && (
          <Section value="genre" title={t("Género", "Genre")}>
            <SingleSelectPills
              options={FILTER_GENRES}
              value={filters.genre}
              onChange={(v) => set("genre", v)}
              ocidPrefix="filter.genre"
            />
          </Section>
        )}

        {/* Vocal Type */}
        <Section value="vocalType" title={t("Tipo vocal", "Vocal Type")}>
          <MultiSelectPills
            options={VOCAL_TYPES}
            values={filters.vocalTypes}
            onChange={(v) => set("vocalTypes", v)}
            ocidPrefix="filter.vocal_type"
          />
        </Section>

        {/* Country */}
        <Section value="country" title={t("País de origen", "Country")}>
          <SingleSelectPills
            options={FILTER_COUNTRIES}
            value={filters.country}
            onChange={(v) => set("country", v)}
            ocidPrefix="filter.country"
          />
        </Section>

        {/* Mood */}
        <Section value="mood" title={t("Estado de ánimo", "Mood")}>
          <MultiSelectPills
            options={MOODS}
            values={filters.moods}
            onChange={(v) => set("moods", v)}
            ocidPrefix="filter.mood"
          />
        </Section>

        {/* Tempo */}
        <Section value="tempo" title={t("Tempo / BPM", "Tempo / BPM")}>
          <MultiSelectPills
            options={TEMPOS}
            values={filters.tempos}
            onChange={(v) => set("tempos", v)}
            ocidPrefix="filter.tempo"
          />
        </Section>

        {/* Recommended Use */}
        <Section
          value="recommendedUse"
          title={t("Uso recomendado", "Recommended Use")}
        >
          <MultiSelectPills
            options={RECOMMENDED_USES}
            values={filters.recommendedUses}
            onChange={(v) => set("recommendedUses", v)}
            ocidPrefix="filter.rec_use"
          />
        </Section>

        {/* Price Range */}
        <Section value="priceRange" title={t("Rango de precio", "Price Range")}>
          <div className="flex flex-col gap-2">
            {PRICE_RANGES.map((pr) => (
              <CheckboxRow
                key={pr.value}
                label={t(pr.es, pr.en)}
                checked={filters.priceRanges.includes(pr.value)}
                onChange={() => togglePriceRange(pr.value)}
                ocid={`filter.price_range.${pr.value.replace("+", "plus")}`}
              />
            ))}
          </div>
        </Section>
      </Accordion.Root>
    </div>
  );
}
