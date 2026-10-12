import { useCallback, useMemo } from "react";

export const STORE_PAGE_SIZE = 24;

/**
 * Derives pagination bounds from the total filtered count and the current page.
 * The page value is owned by useStoreFilters (synced to the URL); this hook
 * only computes the safe page, the visible slice bounds, and the page controls.
 */
export function useStorePagination(
  total: number,
  page: number,
  setPage: (page: number) => void,
) {
  const totalPages = Math.max(1, Math.ceil(total / STORE_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * STORE_PAGE_SIZE;
  const end = Math.min(start + STORE_PAGE_SIZE, total);

  const goToPage = useCallback(
    (next: number) => {
      setPage(Math.min(Math.max(1, next), totalPages));
    },
    [setPage, totalPages],
  );

  return useMemo(
    () => ({
      page: safePage,
      totalPages,
      start,
      end,
      goToPage,
      pageSize: STORE_PAGE_SIZE,
    }),
    [safePage, totalPages, start, end, goToPage],
  );
}
