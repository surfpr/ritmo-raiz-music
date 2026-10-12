import { EMPTY_FILTERS, type FilterState } from "@/components/FilterPanel";
import { useCallback, useEffect, useState } from "react";

const FILTER_KEYS = [
  "page",
  "q",
  "genre",
  "country",
  "vocal",
  "mood",
  "tempo",
  "use",
  "price",
];

function readParams(): { page: number; search: string; filters: FilterState } {
  const sp = new URLSearchParams(window.location.search);
  const arr = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);
  return {
    page: Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1),
    search: sp.get("q") ?? "",
    filters: {
      genre: sp.get("genre") ?? "",
      country: sp.get("country") ?? "",
      vocalTypes: arr(sp.get("vocal")),
      moods: arr(sp.get("mood")),
      tempos: arr(sp.get("tempo")),
      recommendedUses: arr(sp.get("use")),
      priceRanges: arr(sp.get("price")),
    },
  };
}

function writeParams(page: number, search: string, filters: FilterState) {
  const sp = new URLSearchParams(window.location.search);
  // Preserve any non-filter params (e.g. Stripe Payment Link return params)
  // so they survive the filter sync until their own handler cleans them up.
  const next = new URLSearchParams();
  for (const [key, value] of sp.entries()) {
    if (!FILTER_KEYS.includes(key)) next.set(key, value);
  }
  if (page > 1) next.set("page", String(page));
  if (search) next.set("q", search);
  if (filters.genre) next.set("genre", filters.genre);
  if (filters.country) next.set("country", filters.country);
  if (filters.vocalTypes.length)
    next.set("vocal", filters.vocalTypes.join(","));
  if (filters.moods.length) next.set("mood", filters.moods.join(","));
  if (filters.tempos.length) next.set("tempo", filters.tempos.join(","));
  if (filters.recommendedUses.length)
    next.set("use", filters.recommendedUses.join(","));
  if (filters.priceRanges.length)
    next.set("price", filters.priceRanges.join(","));
  const qs = next.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${qs ? `?${qs}` : ""}`,
  );
}

/**
 * Owns the store's filter, search, page, and mobile-panel state, syncing them
 * to the page URL so they survive refresh and are shareable. Changing any
 * filter resets the page to 1 so the user always sees the first page of the
 * newly filtered catalog.
 */
export function useStoreFilters() {
  const initial = readParams();
  const [page, setPage] = useState(initial.page);
  const [search, setSearch] = useState(initial.search);
  const [filters, setFilters] = useState<FilterState>(initial.filters);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    writeParams(page, search, filters);
  }, [page, search, filters]);

  const setFiltersResettingPage = useCallback((next: FilterState) => {
    setFilters(next);
    setPage(1);
  }, []);

  const setSearchResettingPage = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const clearAll = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setSearch("");
    setPage(1);
  }, []);

  return {
    page,
    setPage,
    search,
    setSearch: setSearchResettingPage,
    filters,
    setFilters: setFiltersResettingPage,
    mobileOpen,
    setMobileOpen,
    clearAll,
  };
}
