import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  start: number;
  end: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Pill prev/next pagination with a mono running count
 * (e.g. "Showing 25-48 of 322 songs").
 */
export function Pagination({
  page,
  totalPages,
  start,
  end,
  total,
  onPageChange,
}: PaginationProps) {
  const { t } = useLanguage();

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8"
      data-ocid="store.pagination"
    >
      <p
        className="text-sm text-muted-foreground font-mono"
        data-ocid="store.results_count"
      >
        {t("Mostrando", "Showing")} {start + 1}-{end} {t("de", "of")} {total}{" "}
        {t("canciones", "songs")}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full gap-1 border-border"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          data-ocid="store.pagination_prev"
        >
          <ChevronLeft size={16} />
          {t("Anterior", "Prev")}
        </Button>
        <span
          className="text-sm text-muted-foreground font-mono px-2"
          data-ocid="store.pagination_page"
        >
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full gap-1 border-border"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          data-ocid="store.pagination_next"
        >
          {t("Siguiente", "Next")}
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
