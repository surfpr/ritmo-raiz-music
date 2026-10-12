import type { Track } from "@/backend";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FeaturedPanel } from "@/pages/admin/FeaturedPanel";
import { NewArrivalsPanel } from "@/pages/admin/NewArrivalsPanel";
import { configure, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The Destacadas and New Arrivals admin panels are checkmark lists: toggling a
// row writes the isFeatured / isNewArrival flag through updateTrack, which is
// what the store's shelves read. These tests pin that write seam.

configure({ testIdAttribute: "data-ocid" });

const updateTrack = vi.fn().mockResolvedValue(null);

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: BigInt(1),
    title: { es: "Noches de Salsa", en: "Salsa Nights" },
    artist: "Ritmo Raíz",
    genre: "Salsa",
    country: "Colombia",
    sampleStartSec: BigInt(0),
    sampleEndSec: BigInt(25),
    isFeatured: false,
    isNewArrival: false,
    createdAt: BigInt(0),
    audioFile: { getDirectURL: () => "" } as Track["audioFile"],
    coverImage: { getDirectURL: () => "" } as Track["coverImage"],
    ...overrides,
  };
}

let featuredTracks: Track[] = [];
let newArrivalTracks: Track[] = [];

vi.mock("@/hooks/useQueries", () => ({
  useFeaturedTracks: () => ({ data: featuredTracks, isLoading: false }),
  useNewArrivalTracks: () => ({ data: newArrivalTracks, isLoading: false }),
  useUpdateTrack: () => ({ mutateAsync: updateTrack }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  featuredTracks = [];
  newArrivalTracks = [];
  updateTrack.mockReset();
  updateTrack.mockResolvedValue(null);
});

function renderFeatured() {
  return render(
    <LanguageProvider>
      <FeaturedPanel />
    </LanguageProvider>,
  );
}

function renderNewArrivals() {
  return render(
    <LanguageProvider>
      <NewArrivalsPanel />
    </LanguageProvider>,
  );
}

describe("FeaturedPanel checkmark list", () => {
  it("shows an empty state when no tracks are featured", () => {
    renderFeatured();

    expect(
      screen.getByTestId("admin.featured.empty_state"),
    ).toBeInTheDocument();
  });

  it("adds a track to Destacadas by writing isFeatured through updateTrack", async () => {
    featuredTracks = [makeTrack({ isFeatured: false })];
    const user = userEvent.setup();
    renderFeatured();

    await user.click(screen.getByTestId("admin.featured_toggle.1"));

    await waitFor(() => {
      expect(updateTrack).toHaveBeenCalledTimes(1);
    });
    const call = updateTrack.mock.calls[0][0] as {
      id: bigint;
      input: { isFeatured: boolean; isNewArrival: boolean };
    };
    expect(call.id).toBe(1n);
    expect(call.input.isFeatured).toBe(true);
    // The other flag is preserved, not clobbered.
    expect(call.input.isNewArrival).toBe(false);
  });

  it("removes a track from Destacadas by clearing isFeatured", async () => {
    featuredTracks = [makeTrack({ isFeatured: true })];
    const user = userEvent.setup();
    renderFeatured();

    await user.click(screen.getByTestId("admin.featured_toggle.1"));

    await waitFor(() => {
      expect(updateTrack).toHaveBeenCalledTimes(1);
    });
    const call = updateTrack.mock.calls[0][0] as {
      input: { isFeatured: boolean };
    };
    expect(call.input.isFeatured).toBe(false);
  });
});

describe("NewArrivalsPanel checkmark list", () => {
  it("shows an empty state when there are no new arrivals", () => {
    renderNewArrivals();

    expect(
      screen.getByTestId("admin.new_arrivals.empty_state"),
    ).toBeInTheDocument();
  });

  it("adds a track to New Arrivals by writing isNewArrival through updateTrack", async () => {
    newArrivalTracks = [makeTrack({ isNewArrival: false })];
    const user = userEvent.setup();
    renderNewArrivals();

    await user.click(screen.getByTestId("admin.new_arrivals_toggle.1"));

    await waitFor(() => {
      expect(updateTrack).toHaveBeenCalledTimes(1);
    });
    const call = updateTrack.mock.calls[0][0] as {
      id: bigint;
      input: { isFeatured: boolean; isNewArrival: boolean };
    };
    expect(call.id).toBe(1n);
    expect(call.input.isNewArrival).toBe(true);
    expect(call.input.isFeatured).toBe(false);
  });

  it("removes a track from New Arrivals by clearing isNewArrival", async () => {
    newArrivalTracks = [makeTrack({ isNewArrival: true })];
    const user = userEvent.setup();
    renderNewArrivals();

    await user.click(screen.getByTestId("admin.new_arrivals_toggle.1"));

    await waitFor(() => {
      expect(updateTrack).toHaveBeenCalledTimes(1);
    });
    const call = updateTrack.mock.calls[0][0] as {
      input: { isNewArrival: boolean };
    };
    expect(call.input.isNewArrival).toBe(false);
  });
});
