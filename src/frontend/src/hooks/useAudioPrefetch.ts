import { useEffect, useRef } from "react";

// ── Single-player audio coordination ────────────────────────────────────────
// The store plays at most one preview at a time. A module-level "current URL"
// registry lets every AudioPlayer know when another player has started (or the
// current one stopped) so it can pause itself. Audio is loaded strictly on
// demand — nothing is fetched until the visitor taps play.

let currentUrl: string | null = null;
const listeners = new Set<(url: string | null) => void>();

function notify(url: string | null) {
  for (const listener of listeners) listener(url);
}

/** Returns the URL of the currently playing preview, or null. */
export function getCurrentAudio(): string | null {
  return currentUrl;
}

/**
 * Sets the currently playing preview URL. Passing null stops playback.
 * Every subscribed AudioPlayer receives the change and pauses itself unless
 * the new URL is its own.
 */
export function setCurrentAudio(url: string | null): void {
  if (currentUrl === url) return;
  currentUrl = url;
  notify(url);
}

/** Subscribes a player to current-URL changes. Returns an unsubscribe fn. */
export function subscribeAudio(
  listener: (url: string | null) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Stops the preview for the given URL if it is currently playing. */
export function stopAudio(url: string): void {
  if (currentUrl === url) setCurrentAudio(null);
}

/** Stops whatever preview is currently playing. */
export function stopAllAudio(): void {
  setCurrentAudio(null);
}

/**
 * Stops the preview for `url` once the referenced element leaves the viewport.
 * Used by TrackCard so a sample stops/unloads when its card scrolls off screen.
 */
export function useStopAudioOnLeaveView<T extends HTMLElement>(url: string) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !url) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          stopAudio(url);
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [url]);

  return ref;
}
