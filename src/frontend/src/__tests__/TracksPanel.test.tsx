import type { Track } from "@/backend";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TracksPanel } from "@/pages/admin/TracksPanel";
import {
  configure,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Characterization of the admin track editor's flag controls. The store's
// Destacadas and New Arrivals shelves are driven by the isFeatured /
// isNewArrival flags this form writes, so the checkbox -> updateTrack seam must
// keep working while the shelf-selection logic changes.

configure({ testIdAttribute: "data-ocid" });

const updateTrack = vi.fn().mockResolvedValue(null);
const deleteTrack = vi.fn().mockResolvedValue(true);
const addTrack = vi.fn().mockResolvedValue(null);
const bulkAddTracks = vi.fn().mockResolvedValue([]);

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

let tracks: Track[] = [makeTrack()];

vi.mock("@/hooks/useQueries", () => ({
  useTracks: () => ({ data: tracks, isLoading: false }),
  useAddTrack: () => ({ mutateAsync: addTrack }),
  useBulkAddTracks: () => ({ mutateAsync: bulkAddTracks }),
  useDeleteTrack: () => ({ mutateAsync: deleteTrack }),
  useUpdateTrack: () => ({ mutateAsync: updateTrack }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  tracks = [makeTrack()];
  updateTrack.mockReset();
  updateTrack.mockResolvedValue(null);
  deleteTrack.mockReset();
  deleteTrack.mockResolvedValue(true);
  addTrack.mockReset();
  bulkAddTracks.mockReset();
});

function renderPanel() {
  return render(
    <LanguageProvider>
      <TracksPanel />
    </LanguageProvider>,
  );
}

describe("TracksPanel flag controls", () => {
  it("lists the catalog tracks", () => {
    renderPanel();

    expect(screen.getByTestId("admin.track.item.1")).toBeInTheDocument();
    expect(screen.getByText("Noches de Salsa")).toBeInTheDocument();
  });

  it("opens the editor pre-filled with the track's current flags", async () => {
    tracks = [makeTrack({ isFeatured: true, isNewArrival: true })];
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByTestId("admin.edit_track_button.1"));

    expect(
      screen.getByTestId("admin.track_edit.1.featured_checkbox"),
    ).toBeChecked();
    expect(
      screen.getByTestId("admin.track_edit.1.new_arrival_checkbox"),
    ).toBeChecked();
  });

  it("saves a toggled featured flag through updateTrack", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByTestId("admin.edit_track_button.1"));
    await user.click(
      screen.getByTestId("admin.track_edit.1.featured_checkbox"),
    );
    await user.click(screen.getByTestId("admin.track_edit_save.1"));

    await waitFor(() => {
      expect(updateTrack).toHaveBeenCalledTimes(1);
    });
    const call = updateTrack.mock.calls[0][0] as {
      id: bigint;
      input: { isFeatured: boolean; isNewArrival: boolean };
    };
    expect(call.id).toBe(1n);
    expect(call.input.isFeatured).toBe(true);
    expect(call.input.isNewArrival).toBe(false);
  });

  it("saves a toggled new-arrival flag through updateTrack", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByTestId("admin.edit_track_button.1"));
    await user.click(
      screen.getByTestId("admin.track_edit.1.new_arrival_checkbox"),
    );
    await user.click(screen.getByTestId("admin.track_edit_save.1"));

    await waitFor(() => {
      expect(updateTrack).toHaveBeenCalledTimes(1);
    });
    const call = updateTrack.mock.calls[0][0] as {
      input: { isFeatured: boolean; isNewArrival: boolean };
    };
    expect(call.input.isNewArrival).toBe(true);
    expect(call.input.isFeatured).toBe(false);
  });

  it("keeps the 25-second sample window when saving an edit", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByTestId("admin.edit_track_button.1"));
    await user.click(screen.getByTestId("admin.track_edit_save.1"));

    await waitFor(() => {
      expect(updateTrack).toHaveBeenCalledTimes(1);
    });
    const call = updateTrack.mock.calls[0][0] as {
      input: { sampleStartSec: bigint; sampleEndSec: bigint };
    };
    expect(call.input.sampleStartSec).toBe(0n);
    expect(call.input.sampleEndSec).toBe(25n);
  });

  it("filters the track list by the search box", async () => {
    tracks = [
      makeTrack({
        id: BigInt(1),
        title: { es: "Noches de Salsa", en: "Salsa Nights" },
      }),
      makeTrack({
        id: BigInt(2),
        title: { es: "Amanecer Cumbia", en: "Cumbia Sunrise" },
      }),
    ];
    const user = userEvent.setup();
    renderPanel();

    await user.type(screen.getByTestId("admin.tracks_search_input"), "Cumbia");

    const list = screen.getByTestId("admin.track.item.1");
    expect(within(list).getByText("Amanecer Cumbia")).toBeInTheDocument();
    expect(screen.queryByText("Noches de Salsa")).not.toBeInTheDocument();
  });
});
