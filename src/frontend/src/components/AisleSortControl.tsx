import { useLanguage } from "@/hooks/useLanguage";
import type { AisleSort } from "@/hooks/useStoreRoute";
import { ArrowDownWideNarrow } from "lucide-react";

interface AisleSortControlProps {
  value: AisleSort;
  onChange: (value: AisleSort) => void;
}

const SORT_OPTIONS: { value: AisleSort; es: string; en: string }[] = [
  { value: "newest", es: "Más recientes", en: "Newest" },
  { value: "title", es: "Título A-Z", en: "Title A-Z" },
  { value: "price-asc", es: "Precio: menor a mayor", en: "Price: low to high" },
  {
    value: "price-desc",
    es: "Precio: mayor a menor",
    en: "Price: high to low",
  },
];

/** In-aisle sort control. The selected sort lives in the URL. */
export function AisleSortControl({ value, onChange }: AisleSortControlProps) {
  const { t } = useLanguage();

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <ArrowDownWideNarrow
        size={16}
        className="text-muted-foreground"
        aria-hidden="true"
      />
      <span className="sr-only">{t("Ordenar por", "Sort by")}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AisleSort)}
        className="h-9 rounded-full border border-border bg-card px-3 pr-8 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        aria-label={t("Ordenar por", "Sort by")}
        data-ocid="aisle.sort_select"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.es, opt.en)}
          </option>
        ))}
      </select>
    </label>
  );
}
