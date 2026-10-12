import {
  EMPTY_FILTERS,
  FILTER_COUNTRIES,
  FilterPanel,
  type FilterState,
} from "@/components/FilterPanel";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// Characterization of the store's country refinement. The Pasillo por País
// requirement builds on this country list, so the existing options — including
// Puerto Rico and España — and the single-select toggle must keep working.

configure({ testIdAttribute: "data-ocid" });

function renderPanel(filters: FilterState = EMPTY_FILTERS) {
  const onChange = vi.fn();
  render(
    <LanguageProvider>
      <FilterPanel filters={filters} onChange={onChange} />
    </LanguageProvider>,
  );
  return onChange;
}

describe("FilterPanel country refinement", () => {
  it("offers every canonical country, including Puerto Rico and España", () => {
    renderPanel();

    // The country section is open by default.
    for (const country of FILTER_COUNTRIES) {
      const ocid = `filter.country.${country
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")}`;
      expect(screen.getByTestId(ocid)).toBeInTheDocument();
    }
    expect(
      screen.getByTestId("filter.country.puerto_rico"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("filter.country.espa_a")).toBeInTheDocument();
  });

  it("selects a country and reports it through onChange", async () => {
    const user = userEvent.setup();
    const onChange = renderPanel();

    await user.click(screen.getByTestId("filter.country.puerto_rico"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ country: "Puerto Rico" }),
    );
  });

  it("clears an already-selected country when it is clicked again", async () => {
    const user = userEvent.setup();
    const onChange = renderPanel({ ...EMPTY_FILTERS, country: "España" });

    await user.click(screen.getByTestId("filter.country.espa_a"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ country: "" }),
    );
  });

  it("hides the genre section when showGenre is false", () => {
    render(
      <LanguageProvider>
        <FilterPanel
          filters={EMPTY_FILTERS}
          onChange={vi.fn()}
          showGenre={false}
        />
      </LanguageProvider>,
    );

    expect(screen.queryByText("Género")).not.toBeInTheDocument();
    expect(screen.getByText("País de origen")).toBeInTheDocument();
  });
});
