import type { TrackInput } from "@/backend";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { BulkUploadPanel } from "@/pages/admin/BulkUploadPanel";
import {
  configure,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The admin bulk-upload queue: dropping multiple audio files queues one editable
// row per file, derives each title from its filename, derives each genre from
// the filename (falling back to the selected target genre), fixes the sample
// window at 25 seconds, and submits the reviewed rows through bulkAddTracks.

configure({ testIdAttribute: "data-ocid" });

const bulkAddTracks = vi.fn().mockResolvedValue([]);

vi.mock("@/hooks/useQueries", () => ({
  useBulkAddTracks: () => ({ mutateAsync: bulkAddTracks }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  bulkAddTracks.mockReset();
  bulkAddTracks.mockResolvedValue([]);
  // jsdom does not implement object URLs; the panel creates one per queued file.
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
});

function renderPanel() {
  return render(
    <LanguageProvider>
      <BulkUploadPanel />
    </LanguageProvider>,
  );
}

/** Builds a File that the panel's audio filter accepts. */
function audioFile(name: string): File {
  const file = new File([new Uint8Array([1, 2, 3])], name, {
    type: "audio/mpeg",
  });
  // jsdom's File does not always implement arrayBuffer(); the panel reads the
  // bytes through it before uploading.
  if (typeof file.arrayBuffer !== "function") {
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => new Uint8Array([1, 2, 3]).buffer,
    });
  }
  return file;
}

/** Drops files onto the dropzone, the panel's primary multi-file entry point. */
async function dropFiles(files: File[]) {
  const user = userEvent.setup();
  const dropzone = screen.getByTestId("bulk.dropzone");
  const dataTransfer = { files };
  // fireEvent is not imported; userEvent cannot synthesize a drop payload, so
  // dispatch the drag events directly on the dropzone button.
  dropzone.dispatchEvent(
    Object.assign(new Event("drop", { bubbles: true, cancelable: true }), {
      dataTransfer,
    }),
  );
  return user;
}

describe("BulkUploadPanel queue", () => {
  it("starts with an empty queue and no upload action", () => {
    renderPanel();

    expect(screen.getByTestId("bulk.empty_state")).toBeInTheDocument();
    expect(
      screen.queryByTestId("bulk.upload_all_button"),
    ).not.toBeInTheDocument();
  });

  it("queues one editable row per dropped audio file", async () => {
    renderPanel();

    await dropFiles([
      audioFile("salsa-nights.mp3"),
      audioFile("cumbia_sunrise.wav"),
    ]);

    expect(screen.getByTestId("bulk.track_row.item.1")).toBeInTheDocument();
    expect(screen.getByTestId("bulk.track_row.item.2")).toBeInTheDocument();
    expect(screen.queryByTestId("bulk.empty_state")).not.toBeInTheDocument();
  });

  it("derives each title from its filename, stripping the extension and separators", async () => {
    renderPanel();

    await dropFiles([
      audioFile("salsa-nights.mp3"),
      audioFile("cumbia_sunrise.wav"),
    ]);

    expect(screen.getByTestId("bulk.track_row.title_input.1")).toHaveValue(
      "Salsa Nights",
    );
    expect(screen.getByTestId("bulk.track_row.title_input.2")).toHaveValue(
      "Cumbia Sunrise",
    );
  });

  it("lets the admin edit a derived title before confirming", async () => {
    const user = userEvent.setup();
    renderPanel();

    await dropFiles([audioFile("salsa-nights.mp3")]);

    const titleInput = screen.getByTestId("bulk.track_row.title_input.1");
    await user.clear(titleInput);
    await user.type(titleInput, "Noches de Salsa");

    expect(titleInput).toHaveValue("Noches de Salsa");
  });

  it("derives the genre from the filename when it is recognizable", async () => {
    renderPanel();

    await dropFiles([
      audioFile("cumbia-sunrise.mp3"),
      audioFile("bachata_azul.wav"),
    ]);

    expect(screen.getByTestId("bulk.track_row.genre_select.1")).toHaveValue(
      "Cumbia",
    );
    expect(screen.getByTestId("bulk.track_row.genre_select.2")).toHaveValue(
      "Bachata",
    );
  });

  it("normalizes a Trap Latino filename to the Reggaeton genre", async () => {
    renderPanel();

    await dropFiles([audioFile("trap-latino-night.mp3")]);

    expect(screen.getByTestId("bulk.track_row.genre_select.1")).toHaveValue(
      "Reggaeton",
    );
  });

  it("falls back to the selected target genre when the filename has no genre", async () => {
    const user = userEvent.setup();
    renderPanel();

    // Pick a non-default target genre, then drop a file with no genre token.
    await user.click(screen.getByTestId("bulk.genre.cumbia"));
    await dropFiles([audioFile("track-01.mp3")]);

    expect(screen.getByTestId("bulk.track_row.genre_select.1")).toHaveValue(
      "Cumbia",
    );
  });

  it("offers per-track metadata selects for each queued file", async () => {
    renderPanel();

    await dropFiles([audioFile("salsa-nights.mp3")]);

    expect(
      screen.getByTestId("bulk.track_row.vocal_type_select.1"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("bulk.track_row.mood_select.1"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("bulk.track_row.tempo_select.1"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("bulk.track_row.recommended_use_select.1"),
    ).toBeInTheDocument();
  });

  it("removes a single queued file without disturbing the others", async () => {
    const user = userEvent.setup();
    renderPanel();

    await dropFiles([
      audioFile("salsa-nights.mp3"),
      audioFile("cumbia_sunrise.wav"),
    ]);

    await user.click(screen.getByTestId("bulk.track_row.delete_button.1"));

    // Rows are keyed by position, so the surviving file re-indexes to row 1.
    const rows = screen.getAllByTestId(/bulk\.track_row\.item\./);
    expect(rows).toHaveLength(1);
    expect(screen.getByTestId("bulk.track_row.title_input.1")).toHaveValue(
      "Cumbia Sunrise",
    );
  });

  it("rejects a drop that contains no audio files", async () => {
    renderPanel();

    await dropFiles([new File(["x"], "notes.txt", { type: "text/plain" })]);

    expect(screen.getByTestId("bulk.empty_state")).toBeInTheDocument();
    expect(
      screen.queryByTestId("bulk.track_row.item.1"),
    ).not.toBeInTheDocument();
  });

  it("submits the reviewed rows through bulkAddTracks with the derived title, genre, and 25s sample", async () => {
    const user = userEvent.setup();
    renderPanel();

    await dropFiles([audioFile("salsa-nights.mp3")]);

    await user.click(screen.getByTestId("bulk.upload_all_button"));

    await waitFor(
      () => {
        expect(bulkAddTracks).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 },
    );

    const inputs = bulkAddTracks.mock.calls[0][0] as TrackInput[];
    expect(inputs).toHaveLength(1);
    expect(inputs[0].title).toEqual({
      es: "Salsa Nights",
      en: "Salsa Nights",
    });
    expect(inputs[0].genre).toBe("Salsa");
    // The 25-second sample window is fixed by the panel.
    expect(inputs[0].sampleStartSec).toBe(0n);
    expect(inputs[0].sampleEndSec).toBe(25n);
    // Uploaded songs are new arrivals so they surface in the store's shelf.
    expect(inputs[0].isNewArrival).toBe(true);
  });

  it("clears the queue after a successful upload", async () => {
    const user = userEvent.setup();
    renderPanel();

    await dropFiles([audioFile("salsa-nights.mp3")]);
    await user.click(screen.getByTestId("bulk.upload_all_button"));

    await waitFor(() => {
      expect(screen.getByTestId("bulk.success_state")).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId("bulk.track_row.item.1"),
    ).not.toBeInTheDocument();
  });

  it("keeps the queue and flags the row when the backend save fails", async () => {
    bulkAddTracks.mockRejectedValueOnce(new Error("boom"));
    const user = userEvent.setup();
    renderPanel();

    await dropFiles([audioFile("salsa-nights.mp3")]);
    await user.click(screen.getByTestId("bulk.upload_all_button"));

    await waitFor(() => {
      expect(
        screen.getByTestId("bulk.track_row.error_state.1"),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("bulk.track_row.item.1")).toBeInTheDocument();
  });

  it("offers every canonical genre as a target, including Sacra", async () => {
    renderPanel();

    expect(screen.getByTestId("bulk.genre.salsa")).toBeInTheDocument();
    expect(screen.getByTestId("bulk.genre.sacra")).toBeInTheDocument();
    // Trap Latino is not a separate target; it folds into Reggaeton.
    expect(screen.queryByTestId("bulk.genre.trap_latino")).toBeNull();
  });
});
