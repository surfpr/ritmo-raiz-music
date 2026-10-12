import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/useLanguage";
import { Search, X } from "lucide-react";

interface StoreSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholderEs?: string;
  placeholderEn?: string;
  size?: "hero" | "inline";
  ocid?: string;
}

/**
 * Search entry used both in the storefront hero (large, prominent) and inside
 * an aisle (compact, filters within the selected genre). Submitting jumps
 * straight to matching results.
 */
export function StoreSearchBar({
  value,
  onChange,
  onSubmit,
  placeholderEs = "Busca por título o artista…",
  placeholderEn = "Search by title or artist…",
  size = "inline",
  ocid = "store.search_input",
}: StoreSearchBarProps) {
  const { t } = useLanguage();
  const isHero = size === "hero";

  return (
    <form
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <Search
        className={
          isHero
            ? "absolute left-4 top-1/2 -translate-y-1/2 text-accent"
            : "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        }
        size={isHero ? 20 : 18}
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t(placeholderEs, placeholderEn)}
        aria-label={t("Buscar canciones", "Search songs")}
        className={
          isHero
            ? "h-14 pl-12 pr-12 text-base rounded-full bg-background/70 border-accent/40 focus-visible:border-accent"
            : "pl-10 pr-10"
        }
        data-ocid={ocid}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("Borrar búsqueda", "Clear search")}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full text-muted-foreground hover:text-foreground transition-smooth"
          data-ocid={`${ocid}.clear_button`}
        >
          <X size={16} />
        </button>
      )}
    </form>
  );
}
