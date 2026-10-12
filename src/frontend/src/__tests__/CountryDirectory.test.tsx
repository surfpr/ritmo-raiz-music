import { CountryDirectory } from "@/components/CountryDirectory";
import { FILTER_COUNTRIES } from "@/components/FilterPanel";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// "Pasillo por País" browses the store by country. It must cover all Latin
// countries plus Puerto Rico and España, and selecting a country reports it
// through onSelect.

configure({ testIdAttribute: "data-ocid" });

function renderDirectory(
  countries: string[] = FILTER_COUNTRIES,
  onSelect = vi.fn(),
) {
  render(
    <LanguageProvider>
      <CountryDirectory
        countries={countries}
        isLoading={false}
        onSelect={onSelect}
      />
    </LanguageProvider>,
  );
  return onSelect;
}

describe("CountryDirectory", () => {
  it("renders a card for every canonical country", () => {
    renderDirectory();

    expect(
      screen.getByTestId("storefront.country_directory"),
    ).toBeInTheDocument();
    expect(screen.getByText("Pasillo por País")).toBeInTheDocument();
    expect(screen.getByTestId("storefront.country_card.1")).toBeInTheDocument();
    // One card per country in the canonical list.
    expect(screen.getAllByTestId(/storefront\.country_card\./)).toHaveLength(
      FILTER_COUNTRIES.length,
    );
  });

  it("includes Puerto Rico and España", () => {
    renderDirectory();

    expect(screen.getByText("Puerto Rico")).toBeInTheDocument();
    expect(screen.getByText("España")).toBeInTheDocument();
  });

  it("reports the selected country through onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = renderDirectory();

    await user.click(screen.getByText("Puerto Rico"));

    expect(onSelect).toHaveBeenCalledWith("Puerto Rico");
  });

  it("shows an empty state when there are no countries", () => {
    renderDirectory([]);

    expect(
      screen.getByTestId("storefront.country_directory.empty_state"),
    ).toBeInTheDocument();
  });
});
