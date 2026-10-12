import type { LicenseTier, TrackSummary } from "@/backend";
import { InstrumentalArea } from "@/components/InstrumentalArea";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { InstrumentalGroup } from "@/lib/genreAisles";
import { configure, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The dedicated Instrumental area groups instrumental songs by their existing
// genre. Sacra is religious music and is intentionally excluded. Selecting a
// genre label drills into that genre's aisle.

configure({ testIdAttribute: "data-ocid" });

const licenses: LicenseTier[] = [
  {
    id: BigInt(1),
    name: { en: "Personal", es: "Personal" },
    description: { en: "For individual use.", es: "Para uso individual." },
    priceUsd: BigInt(499),
  },
];

function summary(id: number, genre: string, titleEs: string): TrackSummary {
  return {
    id: BigInt(id),
    title: { en: `Track ${id}`, es: titleEs },
    country: "Colombia",
    genre,
    artist: "Ritmo Raíz",
    sampleStartSec: BigInt(0),
    sampleEndSec: BigInt(25),
    licenseTierId: BigInt(1),
    priceCents: BigInt(499),
    coverImageUrl: `https://example.com/cover${id}.jpg`,
    audioSampleUrl: `https://example.com/sample${id}.mp3`,
    vocalType: "Instrumental",
  };
}

vi.mock("@/hooks/useQueries", () => ({
  useGetPaymentLinks: () => ({
    data: {
      personalLicenseLink: "",
      commercialLicenseLink: "",
      enterpriseLicenseLink: "",
      customMusicLink: "",
    },
  }),
  useIsStripeConfigured: () => ({ data: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
  vi.stubGlobal("requestAnimationFrame", vi.fn());
});

function renderArea(groups: InstrumentalGroup[], onSelectGenre = vi.fn()) {
  render(
    <LanguageProvider>
      <CartProvider>
        <InstrumentalArea
          groups={groups}
          isLoading={false}
          licenses={licenses}
          onSelectGenre={onSelectGenre}
        />
      </CartProvider>
    </LanguageProvider>,
  );
  return onSelectGenre;
}

describe("InstrumentalArea", () => {
  it("shows an empty state when there are no instrumental groups", () => {
    renderArea([]);

    expect(
      screen.getByTestId("storefront.instrumental.empty_state"),
    ).toBeInTheDocument();
  });

  it("renders one shelf per genre group with its tracks", () => {
    renderArea([
      {
        genre: "Salsa",
        label: "Salsa",
        tracks: [summary(1, "Salsa", "Salsa Instrumental")],
      },
      {
        genre: "Cumbia",
        label: "Cumbia",
        tracks: [summary(2, "Cumbia", "Cumbia Instrumental")],
      },
    ]);

    expect(
      screen.getByTestId("storefront.instrumental.group.1"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("storefront.instrumental.group.2"),
    ).toBeInTheDocument();
    expect(screen.getByText("Salsa Instrumental")).toBeInTheDocument();
    expect(screen.getByText("Cumbia Instrumental")).toBeInTheDocument();
  });

  it("drills into the genre aisle when a group label is selected", async () => {
    const user = userEvent.setup();
    const onSelectGenre = renderArea([
      {
        genre: "Salsa",
        label: "Salsa",
        tracks: [summary(1, "Salsa", "Salsa Instrumental")],
      },
    ]);

    await user.click(
      screen.getByTestId("storefront.instrumental.group_link.1"),
    );

    expect(onSelectGenre).toHaveBeenCalledWith("Salsa");
  });

  it("does not render a Sacra group", () => {
    renderArea([
      {
        genre: "Salsa",
        label: "Salsa",
        tracks: [summary(1, "Salsa", "Salsa Instrumental")],
      },
    ]);

    const area = screen.getByTestId("storefront.instrumental");
    expect(within(area).queryByText("Sacra")).not.toBeInTheDocument();
  });
});
