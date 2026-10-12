import type { TrackSummary } from "@/backend";
import { act, configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The generated player bar uses data-ocid rather than data-testid.
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
    sampleStartSec: BigInt(5),
    sampleEndSec: BigInt(30),
    licenseTierId: BigInt(1),
    priceCents: BigInt(499),
    coverImageUrl: "https://example.com/cover2.jpg",
    audioSampleUrl: "https://example.com/sample2.mp3",
  },
];

// The global player store is module-level and persists across tests, so each
// test re-imports a fresh module instance via vi.resetModules(). The
// useTrackSummaries mock is hoisted and survives the reset, so the fresh
// module still receives the catalog.
vi.mock("@/hooks/useQueries", () => ({
  useTrackSummaries: () => ({ data: tracks, isLoading: false }),
}));

// The player bar links to the store page via @tanstack/react-router's Link.
// Render it as a plain anchor so the store CTA is observable without a router.
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// The global player creates its <audio> element via `new Audio()` at module
// scope, so it is never attached to the DOM. Stub the Audio constructor with a
// controllable fake so tests can observe the loaded sample URL, the sample
// start time, and fire the `ended` event to drive auto-advance.
let audioInstances: MockAudio[] = [];

class MockAudio {
  src = "";
  currentTime = 0;
  volume = 1;
  preload = "";
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  private listeners: Record<string, Array<() => void>> = {};

  constructor() {
    audioInstances.push(this);
  }

  addEventListener(type: string, cb: () => void) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(cb);
  }

  removeEventListener() {}

  fire(type: string) {
    for (const cb of this.listeners[type] ?? []) cb();
  }
}

beforeEach(() => {
  audioInstances = [];
  vi.stubGlobal("Audio", MockAudio);
});

async function renderFreshBar() {
  // Reset the module registry so the global player store starts fresh (paused,
  // empty queue) for each test.
  vi.resetModules();
  const { GlobalPlayerBar } = await import("@/components/GlobalPlayerBar");
  const { LanguageProvider } = await import("@/contexts/LanguageContext");
  return render(
    <LanguageProvider>
      <GlobalPlayerBar />
    </LanguageProvider>,
  );
}

describe("GlobalPlayerBar", () => {
  it("renders fixed at the bottom and starts paused with no track loaded", async () => {
    await renderFreshBar();

    // The bar renders with the player-bar class (fixed bottom positioning).
    expect(screen.getByTestId("global_player.bar")).toHaveClass("player-bar");

    // Starts paused: the play button is shown, not pause.
    expect(
      screen.getByTestId("global_player.play_pause_button"),
    ).toHaveAttribute("aria-label", "Reproducir");

    // No track is loaded yet: the placeholder artist label shows.
    expect(screen.getByTestId("global_player.artist")).toHaveTextContent(
      "Selecciona una canción",
    );

    // No audio element has been created until the first play.
    expect(audioInstances).toHaveLength(0);
  });

  it("plays the first random sample on the first click", async () => {
    const user = userEvent.setup();
    await renderFreshBar();

    await user.click(screen.getByTestId("global_player.play_pause_button"));

    // Now playing: the button becomes Pause.
    expect(
      screen.getByTestId("global_player.play_pause_button"),
    ).toHaveAttribute("aria-label", "Pausar");

    // A track from the catalog is now loaded (not the placeholder).
    const artist = screen.getByTestId("global_player.artist");
    expect(artist).not.toHaveTextContent("Selecciona una canción");

    // The audio element was created and loaded the sample URL of a catalog
    // track, starting at that track's sample start (sample-only playback).
    expect(audioInstances).toHaveLength(1);
    const audio = audioInstances[0];
    expect(tracks.map((t) => t.audioSampleUrl)).toContain(audio.src);
    const loaded = tracks.find((t) => t.audioSampleUrl === audio.src);
    expect(audio.currentTime).toBe(Number(loaded?.sampleStartSec));
  });

  it("skips forward only and never goes backward", async () => {
    const user = userEvent.setup();
    await renderFreshBar();

    await user.click(screen.getByTestId("global_player.play_pause_button"));
    const firstTitle = screen.getByTestId("global_player.title").textContent;

    // The only transport control besides play/pause is the forward skip; there
    // is no backward/replay button.
    expect(screen.queryByTestId("global_player.back_button")).toBeNull();

    await user.click(screen.getByTestId("global_player.skip_button"));

    // The queue advanced to a different track.
    const secondTitle = screen.getByTestId("global_player.title").textContent;
    expect(secondTitle).not.toBe(firstTitle);
    expect(audioInstances).toHaveLength(1);
    expect(audioInstances[0].src).not.toBe("");
  });

  it("auto-advances to the next track when a 25-second sample ends", async () => {
    const user = userEvent.setup();
    await renderFreshBar();

    await user.click(screen.getByTestId("global_player.play_pause_button"));
    const firstTitle = screen.getByTestId("global_player.title").textContent;

    // Fire the audio `ended` event, which the store listens for to advance.
    // The store sets the new track synchronously but re-renders in the play()
    // promise microtask, so flush it inside act().
    await act(async () => {
      audioInstances[0].fire("ended");
    });

    expect(screen.getByTestId("global_player.title").textContent).not.toBe(
      firstTitle,
    );
  });

  it("toggles mute and sets volume", async () => {
    const user = userEvent.setup();
    await renderFreshBar();

    // Mute toggles the button label between Mute and Unmute.
    expect(screen.getByTestId("global_player.mute_button")).toHaveAttribute(
      "aria-label",
      "Silenciar",
    );
    await user.click(screen.getByTestId("global_player.mute_button"));
    expect(screen.getByTestId("global_player.mute_button")).toHaveAttribute(
      "aria-label",
      "Activar sonido",
    );

    // The volume slider sets the volume.
    const slider = screen.getByTestId(
      "global_player.volume_slider",
    ) as HTMLInputElement;
    await user.click(slider);
    expect(slider.value).not.toBe("");
  });

  it("renders a store CTA that links to the store page", async () => {
    await renderFreshBar();

    const cta = screen.getByTestId("global_player.store_cta");
    expect(cta).toHaveTextContent("Tienda");
    expect(cta).toHaveAttribute("href", "/store");
  });
});
