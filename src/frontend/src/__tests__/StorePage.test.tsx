import type { LicenseTier, Track, TrackSummary } from "@/backend";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { getCurrentAudio, setCurrentAudio } from "@/hooks/useAudioPrefetch";
import StorePage from "@/pages/StorePage";
import { configure, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The store opens on a curated storefront — a hero band leading with featured
// tracks, a "New arrivals" shelf, and a genre aisle directory — not a flat
// grid. These tests pin that storefront surface and the storefront search
// results view. The aisle drill-down lives in StoreAisle.test.tsx.

configure({ testIdAttribute: "data-ocid" });

const tracks: TrackSummary[] = [
  {
    id: BigInt(1),
    title: { en: "Salsa Nights", es: "Noches de Salsa" },
    country: "Colombia",
    genre: "Salsa",
    artist: "Ritmo Raíz",
    sampleStartSec: BigInt(0),
    sampleEndSec: BigInt(25),
    licenseTierId: BigInt(1),
    priceCents: BigInt(499),
    coverImageUrl: "https://example.com/cover1.jpg",
    audioSampleUrl: "https://example.com/sample1.mp3",
  },
  {
    id: BigInt(2),
    title: { en: "Cumbia Sunrise", es: "Amanecer Cumbia" },
    country: "Mexico",
    genre: "Cumbia",
    artist: "Ritmo Raíz",
    sampleStartSec: BigInt(0),
    sampleEndSec: BigInt(25),
    licenseTierId: BigInt(1),
    priceCents: BigInt(499),
    coverImageUrl: "https://example.com/cover2.jpg",
    audioSampleUrl: "https://example.com/sample2.mp3",
  },
];

const licenses: LicenseTier[] = [
  {
    id: BigInt(1),
    name: { en: "Personal", es: "Personal" },
    description: { en: "For individual use.", es: "Para uso individual." },
    priceUsd: BigInt(499),
  },
];

// The Destacadas / New Arrivals shelves read the backend-flagged songs through
// these hooks, never a client-side derivation of the catalog.
const featuredTracks: Track[] = [
  {
    id: BigInt(1),
    title: { en: "Salsa Nights", es: "Noches de Salsa" },
    artist: "Ritmo Raíz",
    genre: "Salsa",
    country: "Colombia",
    sampleStartSec: BigInt(0),
    sampleEndSec: BigInt(25),
    isFeatured: true,
    isNewArrival: false,
    createdAt: BigInt(0),
    audioFile: { getDirectURL: () => "" } as Track["audioFile"],
    coverImage: { getDirectURL: () => "" } as Track["coverImage"],
  },
];

const newArrivalTracks: Track[] = [
  {
    id: BigInt(2),
    title: { en: "Cumbia Sunrise", es: "Amanecer Cumbia" },
    artist: "Ritmo Raíz",
    genre: "Cumbia",
    country: "Mexico",
    sampleStartSec: BigInt(0),
    sampleEndSec: BigInt(25),
    isFeatured: false,
    isNewArrival: true,
    createdAt: BigInt(0),
    audioFile: { getDirectURL: () => "" } as Track["audioFile"],
    coverImage: { getDirectURL: () => "" } as Track["coverImage"],
  },
];

vi.mock("@/hooks/useQueries", () => ({
  useTrackSummaries: () => ({ data: tracks, isLoading: false }),
  useLicenseTiers: () => ({ data: licenses }),
  useFeaturedTracks: () => ({ data: featuredTracks, isLoading: false }),
  useNewArrivalTracks: () => ({ data: newArrivalTracks, isLoading: false }),
  useRecordSale: () => ({ mutate: vi.fn() }),
  useCheckoutReturn: () => undefined,
  useGetPaymentLinks: () => ({
    data: {
      personalLicenseLink: "https://buy.example/personal",
      commercialLicenseLink: "https://buy.example/commercial",
      enterpriseLicenseLink: "https://buy.example/enterprise",
      customMusicLink: "",
    },
  }),
  useIsStripeConfigured: () => ({ data: false }),
}));

// motion/react animations and sonner toasts are not needed for these
// behavioral assertions; stub them to keep the render deterministic.
vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      exit,
      whileInView,
      viewport,
      transition,
      ...props
    }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
  vi.stubGlobal("requestAnimationFrame", vi.fn());
  window.history.replaceState(null, "", "/store");
});

function renderStore() {
  return render(
    <LanguageProvider>
      <CartProvider>
        <StorePage />
      </CartProvider>
    </LanguageProvider>,
  );
}

describe("StorePage storefront", () => {
  it("opens on the curated storefront with hero, new arrivals, featured, and aisle directory", () => {
    renderStore();

    // Hero band leads the storefront.
    expect(screen.getByTestId("storefront.hero")).toBeInTheDocument();
    expect(screen.getByText("Explora por pasillos")).toBeInTheDocument();

    // New arrivals shelf sits beneath the hero.
    expect(screen.getByTestId("storefront.new_arrivals")).toBeInTheDocument();
    expect(screen.getByText("Nuevos lanzamientos")).toBeInTheDocument();

    // Featured shelf.
    expect(screen.getByTestId("storefront.featured")).toBeInTheDocument();
    expect(screen.getByText("Destacadas")).toBeInTheDocument();

    // Genre aisle directory is the primary navigation surface.
    expect(
      screen.getByTestId("storefront.aisle_directory"),
    ).toBeInTheDocument();
    expect(screen.getByText("Pasillos por género")).toBeInTheDocument();
  });

  it("shows exactly the backend-flagged songs in the Destacadas and New Arrivals shelves", () => {
    renderStore();

    // Destacadas shelf shows the featured-flagged track only.
    const featured = screen.getByTestId("storefront.featured");
    expect(within(featured).getByText("Noches de Salsa")).toBeInTheDocument();
    expect(
      within(featured).queryByText("Amanecer Cumbia"),
    ).not.toBeInTheDocument();

    // New Arrivals shelf shows the new-arrival-flagged track only.
    const newArrivals = screen.getByTestId("storefront.new_arrivals");
    expect(
      within(newArrivals).getByText("Amanecer Cumbia"),
    ).toBeInTheDocument();
    expect(
      within(newArrivals).queryByText("Noches de Salsa"),
    ).not.toBeInTheDocument();
  });

  it("renders a genre aisle card per canonical genre with a track count", () => {
    renderStore();

    // Salsa has one track in the fixture; the card exposes the count.
    expect(screen.getByTestId("storefront.aisle_card.1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Abrir pasillo Salsa, 1 canciones/i }),
    ).toBeInTheDocument();
    // Cumbia also has one track.
    expect(
      screen.getByRole("button", {
        name: /Abrir pasillo Cumbia, 1 canciones/i,
      }),
    ).toBeInTheDocument();
  });

  it("does not render a flat all-catalog grid on the storefront", () => {
    renderStore();

    // The storefront shows shelves and the aisle directory, never a paginated
    // flat grid of the whole catalog.
    expect(screen.queryByTestId("store.pagination")).not.toBeInTheDocument();
    expect(screen.queryByTestId("aisle.tracks.loading_state")).toBeNull();
  });

  it("renders track cards without loading any audio on mount", () => {
    renderStore();

    // The storefront shelves render cards, but no audio bytes are fetched
    // until the visitor taps play: every <audio> element mounts with no src.
    const audios = document.querySelectorAll("audio");
    expect(audios.length).toBeGreaterThan(0);
    for (const audio of audios) {
      expect(audio.getAttribute("src")).toBeNull();
    }
  });

  it("shows storefront search results for a matching query", async () => {
    const user = userEvent.setup();
    renderStore();

    await user.type(screen.getByTestId("storefront.search_input"), "Cumbia");

    // A results section appears with the matching track only.
    const results = screen.getByTestId("storefront.search_results");
    expect(results).toBeInTheDocument();
    expect(within(results).getByText("Amanecer Cumbia")).toBeInTheDocument();
    expect(
      within(results).queryByText("Noches de Salsa"),
    ).not.toBeInTheDocument();
  });

  it("shows the no-matches empty state when a storefront query matches nothing", async () => {
    const user = userEvent.setup();
    renderStore();

    await user.type(
      screen.getByTestId("storefront.search_input"),
      "zzz-no-match",
    );

    expect(
      screen.getByTestId("storefront.search_results.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sin coincidencias")).toBeInTheDocument();
  });

  it("stops the playing preview when leaving the store page", () => {
    setCurrentAudio("https://example.com/sample1.mp3");
    expect(getCurrentAudio()).toBe("https://example.com/sample1.mp3");

    const { unmount } = renderStore();
    unmount();

    // Leaving the store page stops whatever preview is playing.
    expect(getCurrentAudio()).toBeNull();
  });
});
