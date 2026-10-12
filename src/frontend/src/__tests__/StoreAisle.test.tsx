import type { LicenseTier, TrackSummary } from "@/backend";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { STORE_PAGE_SIZE } from "@/hooks/useStorePagination";
import StorePage from "@/pages/StorePage";
import {
  configure,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The genre aisle journey: selecting an aisle card drills into a focused,
// paginated shelf for that genre, with in-aisle search, sort, refinements, and
// URL-backed state that survives refresh. There is no full-catalog flat grid.

configure({ testIdAttribute: "data-ocid" });

function makeTrack(
  id: number,
  genre: string,
  titleEs: string,
  titleEn: string,
  priceCents: number,
  extra: Partial<TrackSummary> = {},
): TrackSummary {
  return {
    id: BigInt(id),
    title: { en: titleEn, es: titleEs },
    country: "Colombia",
    genre,
    artist: "Ritmo Raíz",
    sampleStartSec: BigInt(0),
    sampleEndSec: BigInt(25),
    licenseTierId: BigInt(1),
    priceCents: BigInt(priceCents),
    coverImageUrl: `https://example.com/cover${id}.jpg`,
    audioSampleUrl: `https://example.com/sample${id}.mp3`,
    ...extra,
  };
}

// 30 Salsa tracks (more than one page) plus a couple of Cumbia tracks, so the
// aisle view can be exercised for filtering, sorting, and pagination.
const salsaTracks: TrackSummary[] = Array.from(
  { length: STORE_PAGE_SIZE + 6 },
  (_, i) =>
    makeTrack(
      i + 1,
      "Salsa",
      `Salsa ${String(i + 1).padStart(2, "0")}`,
      `Salsa ${String(i + 1).padStart(2, "0")}`,
      // Descending price so "price low-high" reverses the natural order.
      (STORE_PAGE_SIZE + 6 - i) * 100,
      { vocalType: i % 2 === 0 ? "Lyrical" : "Instrumental" },
    ),
);

const cumbiaTracks: TrackSummary[] = [
  makeTrack(101, "Cumbia", "Amanecer Cumbia", "Cumbia Sunrise", 499),
  makeTrack(102, "Cumbia", "Cumbia Nocturna", "Night Cumbia", 899),
];

const tracks: TrackSummary[] = [...salsaTracks, ...cumbiaTracks];

const licenses: LicenseTier[] = [
  {
    id: BigInt(1),
    name: { en: "Personal", es: "Personal" },
    description: { en: "For individual use.", es: "Para uso individual." },
    priceUsd: BigInt(499),
  },
];

vi.mock("@/hooks/useQueries", () => ({
  useTrackSummaries: () => ({ data: tracks, isLoading: false }),
  useLicenseTiers: () => ({ data: licenses }),
  useFeaturedTracks: () => ({ data: [], isLoading: false }),
  useNewArrivalTracks: () => ({ data: [], isLoading: false }),
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
  // jsdom does not implement scrolling; the aisle handlers call it on select.
  window.scrollTo = vi.fn();
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

/** Opens the Salsa aisle by clicking its directory card. */
async function openSalsaAisle() {
  const user = userEvent.setup();
  renderStore();
  await user.click(
    screen.getByRole("button", { name: /Abrir pasillo Salsa/i }),
  );
  return user;
}

describe("StorePage genre aisle", () => {
  it("opens the aisle view for the selected genre and shows only that genre's tracks", async () => {
    await openSalsaAisle();

    // The aisle header replaces the storefront.
    expect(screen.getByTestId("aisle.header")).toBeInTheDocument();
    expect(screen.getByTestId("aisle.title")).toHaveTextContent("Salsa");
    expect(screen.queryByTestId("storefront.hero")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("storefront.aisle_directory"),
    ).not.toBeInTheDocument();

    // Only Salsa tracks are shown; the Cumbia tracks are filtered out.
    expect(screen.getByText("Salsa 01")).toBeInTheDocument();
    expect(screen.queryByText("Amanecer Cumbia")).not.toBeInTheDocument();
    expect(screen.queryByText("Cumbia Nocturna")).not.toBeInTheDocument();
  });

  it("shows the genre name, live track count, and a breadcrumb back to the storefront", async () => {
    const user = await openSalsaAisle();

    expect(screen.getByTestId("aisle.title")).toHaveTextContent("Salsa");
    expect(screen.getByTestId("aisle.track_count")).toHaveTextContent(
      `${salsaTracks.length} PISTAS`,
    );

    // Breadcrumb returns to the storefront.
    await user.click(screen.getByTestId("aisle.breadcrumb_storefront"));
    expect(screen.getByTestId("storefront.hero")).toBeInTheDocument();
    expect(screen.queryByTestId("aisle.header")).not.toBeInTheDocument();
  });

  it("paginates the aisle shelf and reflects the page in the URL", async () => {
    const user = await openSalsaAisle();

    // First page shows STORE_PAGE_SIZE tracks and a running count.
    expect(screen.getByTestId("store.pagination")).toBeInTheDocument();
    expect(screen.getByTestId("store.results_count")).toHaveTextContent(
      `Mostrando 1-${STORE_PAGE_SIZE} de ${salsaTracks.length} canciones`,
    );
    expect(screen.getByTestId("store.pagination_page")).toHaveTextContent(
      "1 / 2",
    );

    await user.click(screen.getByTestId("store.pagination_next"));

    expect(screen.getByTestId("store.pagination_page")).toHaveTextContent(
      "2 / 2",
    );
    // The page lives in the URL.
    expect(window.location.search).toContain("page=2");
  });

  it("filters within the selected genre via in-aisle search", async () => {
    const user = await openSalsaAisle();

    await user.type(screen.getByTestId("aisle.search_input"), "Salsa 07");

    expect(screen.getByText("Salsa 07")).toBeInTheDocument();
    expect(screen.queryByText("Salsa 01")).not.toBeInTheDocument();
    // The query is in the URL.
    expect(window.location.search).toContain("q=Salsa+07");
  });

  it("sorts the aisle shelf by price low to high", async () => {
    const user = await openSalsaAisle();

    await user.selectOptions(
      screen.getByTestId("aisle.sort_select"),
      "price-asc",
    );

    // The cheapest Salsa track is the last generated one (price 100).
    const cards = screen.getAllByTestId(/aisle\.track\.item\./);
    expect(within(cards[0]).getByText("Salsa 30")).toBeInTheDocument();
    expect(window.location.search).toContain("sort=price-asc");
  });

  it("restores genre, search, sort, and page from the URL on refresh", async () => {
    window.history.replaceState(
      null,
      "",
      "/store?genre=Salsa&q=Salsa+0&sort=price-asc&page=1",
    );

    renderStore();

    // The aisle view is restored directly from the URL.
    expect(screen.getByTestId("aisle.header")).toBeInTheDocument();
    expect(screen.getByTestId("aisle.title")).toHaveTextContent("Salsa");
    expect(screen.getByTestId("aisle.search_input")).toHaveValue("Salsa 0");
    expect(screen.getByTestId("aisle.sort_select")).toHaveValue("price-asc");
  });

  it("refines the aisle with a filter and shows a removable chip with clear all", async () => {
    const user = await openSalsaAisle();

    // The desktop refinement drawer is present and never offers a genre
    // control (the aisle is already genre-scoped).
    const drawer = screen.getByTestId("aisle.filter_drawer");
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).queryByText("Género")).not.toBeInTheDocument();

    // Apply a vocal-type refinement from the drawer (open by default).
    await user.click(within(drawer).getByTestId("filter.vocal_type.lyrical"));

    // A removable chip appears and the refinement is in the URL.
    const chips = screen.getByTestId("aisle.refinement_chips");
    expect(chips).toBeInTheDocument();
    expect(window.location.search).toContain("vocal=Lyrical");

    // Clear all removes the refinement.
    await user.click(screen.getByTestId("aisle.clear_refinements_button"));
    await waitFor(() => {
      expect(
        screen.queryByTestId("aisle.refinement_chips"),
      ).not.toBeInTheDocument();
    });
    expect(window.location.search).not.toContain("vocal=Lyrical");
  });

  it("shows an empty aisle state with a path back to the storefront", async () => {
    const user = await openSalsaAisle();

    // A query that matches nothing in this genre empties the shelf.
    await user.type(screen.getByTestId("aisle.search_input"), "zzz-no-match");

    expect(screen.getByTestId("aisle.empty_state")).toBeInTheDocument();
    expect(
      screen.getByText("No hay canciones en este pasillo"),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("aisle.empty_back_button"));
    expect(screen.getByTestId("storefront.hero")).toBeInTheDocument();
  });

  it("never offers a full-catalog flat grid from the aisle view", async () => {
    await openSalsaAisle();

    // The aisle is genre-scoped: the refinement drawer has no genre control,
    // and the shelf count never equals the whole catalog.
    const drawer = screen.getByTestId("aisle.filter_drawer");
    expect(within(drawer).queryByText("Género")).not.toBeInTheDocument();
    expect(screen.getByTestId("aisle.track_count")).not.toHaveTextContent(
      `${tracks.length} PISTAS`,
    );
  });
});
