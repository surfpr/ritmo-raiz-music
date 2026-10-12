import { FilterPanel, type FilterState } from "@/components/FilterPanel";

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

/**
 * Persistent desktop filter sidebar. Hidden on mobile (the slide-in panel in
 * StorePage takes over there). Renders the shared FilterPanel controls.
 */
export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  return (
    <aside
      className="hidden md:block w-[280px] shrink-0 sticky top-6"
      data-ocid="store.filter_sidebar"
    >
      <FilterPanel filters={filters} onChange={onChange} />
    </aside>
  );
}
