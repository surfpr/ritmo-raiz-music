import {
  getCurrentAudio,
  setCurrentAudio,
  stopAllAudio,
  stopAudio,
  subscribeAudio,
  useStopAudioOnLeaveView,
} from "@/hooks/useAudioPrefetch";
import { render } from "@testing-library/react";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The store now plays at most one preview at a time through a module-level
// "current URL" registry. Audio is loaded strictly on demand — nothing is
// fetched until the visitor taps play — so these tests observe the registry
// and the leave-view stop hook rather than any media loading.

beforeEach(() => {
  stopAllAudio();
});

describe("setCurrentAudio / getCurrentAudio", () => {
  it("records the currently playing preview URL", () => {
    expect(getCurrentAudio()).toBeNull();
    setCurrentAudio("https://example.com/sample.mp3");
    expect(getCurrentAudio()).toBe("https://example.com/sample.mp3");
  });

  it("clears the current URL when passed null", () => {
    setCurrentAudio("https://example.com/sample.mp3");
    setCurrentAudio(null);
    expect(getCurrentAudio()).toBeNull();
  });

  it("does not notify listeners when the URL is unchanged", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAudio(listener);
    setCurrentAudio("https://example.com/sample.mp3");
    setCurrentAudio("https://example.com/sample.mp3");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});

describe("subscribeAudio", () => {
  it("notifies subscribers when the current preview changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAudio(listener);

    setCurrentAudio("https://example.com/sample1.mp3");
    expect(listener).toHaveBeenLastCalledWith(
      "https://example.com/sample1.mp3",
    );

    setCurrentAudio("https://example.com/sample2.mp3");
    expect(listener).toHaveBeenLastCalledWith(
      "https://example.com/sample2.mp3",
    );

    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAudio(listener);
    unsubscribe();

    setCurrentAudio("https://example.com/sample.mp3");
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("stopAudio", () => {
  it("stops the preview for the currently playing URL", () => {
    setCurrentAudio("https://example.com/sample.mp3");
    stopAudio("https://example.com/sample.mp3");
    expect(getCurrentAudio()).toBeNull();
  });

  it("is a no-op for a URL that is not currently playing", () => {
    setCurrentAudio("https://example.com/sample.mp3");
    stopAudio("https://example.com/other.mp3");
    expect(getCurrentAudio()).toBe("https://example.com/sample.mp3");
  });
});

describe("stopAllAudio", () => {
  it("clears whatever preview is currently playing", () => {
    setCurrentAudio("https://example.com/sample.mp3");
    stopAllAudio();
    expect(getCurrentAudio()).toBeNull();
  });
});

describe("useStopAudioOnLeaveView", () => {
  it("stops the preview when the card leaves the viewport", () => {
    let callback: IntersectionObserverCallback | undefined;
    class FakeIntersectionObserver {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
      root = null;
      rootMargin = "";
      thresholds = [];
    }
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);

    setCurrentAudio("https://example.com/sample.mp3");

    function Card() {
      const ref = useStopAudioOnLeaveView<HTMLDivElement>(
        "https://example.com/sample.mp3",
      );
      return createElement("div", { ref }, "card");
    }

    render(createElement(Card));

    // The card scrolls out of view; the preview for its URL stops.
    callback?.(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(getCurrentAudio()).toBeNull();
  });

  it("does not stop a different preview when the card leaves the viewport", () => {
    let callback: IntersectionObserverCallback | undefined;
    class FakeIntersectionObserver {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
      root = null;
      rootMargin = "";
      thresholds = [];
    }
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);

    setCurrentAudio("https://example.com/other.mp3");

    function Card() {
      const ref = useStopAudioOnLeaveView<HTMLDivElement>(
        "https://example.com/sample.mp3",
      );
      return createElement("div", { ref }, "card");
    }

    render(createElement(Card));

    callback?.(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(getCurrentAudio()).toBe("https://example.com/other.mp3");
  });
});
