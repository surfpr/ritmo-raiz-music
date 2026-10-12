import { EMPTY_FILTERS, type FilterState } from "@/components/FilterPanel";
import { useCallback, useEffect, useState } from "react";

export type AisleSort = "newest" | "title" | "price-asc" | "price-desc";

export const AISLE_SORTS: AisleSort[] = [
  "newest",
  "title",
  "price-asc",
  "price-desc",
];

const FILTER_KEYS = [
  "page",
  "q",
  "genre",
  "sort",
  "country",
  "vocal",
  "mood",
  "tempo",
  "use",
  "price",
];

export interface StoreRouteState {
  genre: string;
  search: string;
  sort: AisleSort;
  page: number;
  refinements: FilterState;
}

function isSort(value: string | null): value is AisleSort {
  return (
    value === "newest" ||
    value === "title" ||
    value === "price-asc" ||
    value === "price-desc"
  );
}

/** Reads a comma-separated multi-value param into a trimmed string array. */
function readList(sp: URLSearchParams, key: string): string[] {
  const raw = sp.get(key);
  if (!raw) return [];
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function readParams(): StoreRouteState {
  const sp = new URLSearchParams(window.location.search);
  const sortParam = sp.get("sort");
  return {
    genre: sp.get("genre") ?? "",
    search: sp.get("q") ?? "",
    sort: isSort(sortParam) ? sortParam : "newest",
    page: Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1),
    refinements: {
      // Genre is owned by the route, never by the refinement state.
      genre: "",
      country: sp.get("country") ?? "",
      vocalTypes: readList(sp, "vocal"),
      moods: readList(sp, "mood"),
      tempos: readList(sp, "tempo"),
      recommendedUses: readList(sp, "use"),
      priceRanges: readList(sp, "price"),
    },
  };
}

/**
 * Owns the store's route-level state — the selected genre aisle, in-aisle
 * search, sort, page, and the in-aisle refinements (country, vocal type, mood,
 * tempo, recommended use, price range) — and syncs it all to the URL so an
 * aisle view is shareable and refresh-safe. Non-store params (e.g. Stripe
 * return params) are preserved untouched. Changing genre, search, sort, or any
 * refinement resets the page to 1.
 */
export function useStoreRoute() {
  const initial = readParams();
  const [genre, setGenreState] = useState(initial.genre);
  const [search, setSearchState] = useState(initial.search);
  const [sort, setSortState] = useState<AisleSort>(initial.sort);
  const [page, setPageState] = useState(initial.page);
  const [refinements, setRefinementsState] = useState<FilterState>(
    initial.refinements,
  );

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const next = new URLSearchParams();
    for (const [key, value] of sp.entries()) {
      if (!FILTER_KEYS.includes(key)) next.set(key, value);
    }
    if (genre) next.set("genre", genre);
    if (search) next.set("q", search);
    if (sort !== "newest") next.set("sort", sort);
    if (page > 1) next.set("page", String(page));
    if (refinements.country) next.set("country", refinements.country);
    if (refinements.vocalTypes.length)
      next.set("vocal", refinements.vocalTypes.join(","));
    if (refinements.moods.length) next.set("mood", refinements.moods.join(","));
    if (refinements.tempos.length)
      next.set("tempo", refinements.tempos.join(","));
    if (refinements.recommendedUses.length)
      next.set("use", refinements.recommendedUses.join(","));
    if (refinements.priceRanges.length)
      next.set("price", refinements.priceRanges.join(","));
    const qs = next.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}`,
    );
  }, [genre, search, sort, page, refinements]);

  const setGenre = useCallback((value: string) => {
    setGenreState(value);
    setPageState(1);
  }, []);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPageState(1);
  }, []);

  const setSort = useCallback((value: AisleSort) => {
    setSortState(value);
    setPageState(1);
  }, []);

  const setPage = useCallback((value: number) => {
    setPageState(Math.max(1, value));
  }, []);

  const setRefinements = useCallback((value: FilterState) => {
    setRefinementsState(value);
    setPageState(1);
  }, []);

  const clearRefinements = useCallback(() => {
    setRefinementsState(EMPTY_FILTERS);
    setPageState(1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState("");
    setPageState(1);
  }, []);

  return {
    genre,
    search,
    sort,
    page,
    refinements,
    setGenre,
    setSearch,
    setSort,
    setPage,
    setRefinements,
    clearRefinements,
    clearSearch,
  };
}
