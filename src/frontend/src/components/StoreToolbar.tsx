import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/useLanguage";
import { Search, SlidersHorizontal } from "lucide-react";

interface StoreToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeFilterCount: number;
  onOpenFilters: () => void;
}

/**
 * Top toolbar: mobile filter toggle + search input. The running count and
 * pagination live in the Pagination component below the grid.
 */
export function StoreToolbar({
  search,
  onSearchChange,
  activeFilterCount,
  onOpenFilters,
}: StoreToolbarProps) {
  const { t } = useLanguage();

  return (
    <div className="flex gap-3 mb-6" data-ocid="store.filters_section">
      {/* Mobile: Filter button */}
      <Button
        type="button"
        variant="outline"
        className="md:hidden relative flex items-center gap-2 border-border shrink-0"
        onClick={onOpenFilters}
        data-ocid="store.mobile_filter_button"
      >
        <SlidersHorizontal size={16} />
        <span>{t("Filtrar", "Filter")}</span>
        {activeFilterCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {/* Search */}
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <Input
          placeholder={t(
            "Buscar por título o artista...",
            "Search by title or artist...",
          )}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
          data-ocid="store.search_input"
        />
      </div>
    </div>
  );
}
