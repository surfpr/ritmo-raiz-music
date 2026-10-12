import { AudioPlayer } from "@/components/AudioPlayer";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// jsdom does not implement HTMLMediaElement playback; stub the methods the
// component relies on so we can observe the play/pause state transitions.
beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
  // requestAnimationFrame is not driven in jsdom; stub it so the progress
  // tick loop does not spin forever.
  vi.stubGlobal("requestAnimationFrame", vi.fn());
});

describe("AudioPlayer", () => {
  it("renders a play button, progress bar, and time readouts", () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/sample.mp3"
        sampleStartSec={0}
        sampleEndSec={25}
      />,
    );

    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    // current time starts at the sample start (0:00)
    expect(screen.getByText("0:00")).toBeInTheDocument();
    // duration shows the remaining sample length (25s -> -0:25)
    expect(screen.getByText("-0:25")).toBeInTheDocument();
  });

  it("loads the sample URL only on demand when play is tapped", async () => {
    const user = userEvent.setup();
    render(
      <AudioPlayer
        audioUrl="https://example.com/sample.mp3"
        sampleStartSec={5}
        sampleEndSec={30}
      />,
    );

    // The <audio> element mounts with no src: no audio bytes are fetched for
    // off-screen or unplayed cards.
    const audio = document.querySelector("audio");
    expect(audio).not.toBeNull();
    expect(audio?.getAttribute("src")).toBeNull();

    // Tapping play loads the sample URL on demand.
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(audio?.getAttribute("src")).toBe("https://example.com/sample.mp3");
  });

  it("toggles between Play and Pause when the button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AudioPlayer
        audioUrl="https://example.com/sample.mp3"
        sampleStartSec={0}
        sampleEndSec={25}
      />,
    );

    const playButton = screen.getByRole("button", { name: "Play" });
    await user.click(playButton);

    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("switches to a new sample URL when the audioUrl prop changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <AudioPlayer
        audioUrl="https://example.com/sample1.mp3"
        sampleStartSec={0}
        sampleEndSec={25}
      />,
    );

    // Nothing is loaded until play is tapped.
    expect(document.querySelector("audio")?.getAttribute("src")).toBeNull();

    // Playing loads the first sample.
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(document.querySelector("audio")?.getAttribute("src")).toBe(
      "https://example.com/sample1.mp3",
    );

    // Switching between samples in the store re-renders the player with a new
    // URL; playing again must load the selected track rather than the previous
    // one. The player stays in its playing state across the rerender, so pause
    // first, then play the new sample.
    rerender(
      <AudioPlayer
        audioUrl="https://example.com/sample2.mp3"
        sampleStartSec={0}
        sampleEndSec={25}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Pause" }));
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(document.querySelector("audio")?.getAttribute("src")).toBe(
      "https://example.com/sample2.mp3",
    );
  });

  it("stops the previously playing sample when a second player starts", async () => {
    const user = userEvent.setup();
    render(
      <>
        <AudioPlayer
          audioUrl="https://example.com/sample1.mp3"
          sampleStartSec={0}
          sampleEndSec={25}
        />
        <AudioPlayer
          audioUrl="https://example.com/sample2.mp3"
          sampleStartSec={0}
          sampleEndSec={25}
        />
      </>,
    );

    // Both players start paused.
    expect(screen.getAllByRole("button", { name: "Play" })).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "Pause" }),
    ).not.toBeInTheDocument();

    // Start the first sample.
    await user.click(screen.getAllByRole("button", { name: "Play" })[0]);
    expect(screen.getAllByRole("button", { name: "Pause" })).toHaveLength(1);

    // Starting the second sample stops the first: only one preview plays at a
    // time through the shared current-audio registry.
    await user.click(screen.getAllByRole("button", { name: "Play" })[0]);
    expect(screen.getAllByRole("button", { name: "Pause" })).toHaveLength(1);
  });

  it("renders the compact variant with the same controls", () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/sample.mp3"
        sampleStartSec={0}
        sampleEndSec={25}
        compact
      />,
    );

    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
