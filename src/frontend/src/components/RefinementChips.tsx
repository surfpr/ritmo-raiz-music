import { useLanguage } from "@/hooks/useLanguage";
import { X } from "lucide-react";

export interface RefinementChip {
  key: string;
  value: string;
  label: string;
}

interface RefinementChipsProps {
  chips: RefinementChip[];
  onRemove: (chip: RefinementChip) => void;
  onClearAll: () => void;
}

/**
 * Active refinements shown as removable chips with a single "clear all"
 * action. Renders nothing when there are no active refinements.
 */
export function RefinementChips({
  chips,
  onRemove,
  onClearAll,
}: RefinementChipsProps) {
  const { t } = useLanguage();

  if (chips.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2 mb-5"
      data-ocid="aisle.refinement_chips"
    >
      {chips.map((chip) => (
        <span key={`${chip.key}-${chip.value}`} className="refine-chip">
          {chip.label}
          <button
            type="button"
            className="refine-chip-remove"
            onClick={() => onRemove(chip)}
            aria-label={t(
              `Quitar refinamiento ${chip.label}`,
              `Remove refinement ${chip.label}`,
            )}
            data-ocid={`aisle.refinement_chip.${chip.key}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs text-muted-foreground underline hover:text-foreground transition-smooth ml-1"
        data-ocid="aisle.clear_refinements_button"
      >
        {t("Limpiar todo", "Clear all")}
      </button>
    </div>
  );
}
