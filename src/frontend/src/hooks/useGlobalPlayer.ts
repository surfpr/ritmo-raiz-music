import type { TrackSummary } from "@/backend";
import { useTrackSummaries } from "@/hooks/useQueries";
import { useEffect, useReducer } from "react";

// ── Global player store (module-level) ──────────────────────────────────────
// A single persistent audio player that survives route navigation. The store
// lives at module scope (like useAudioPrefetch's current-URL registry) so the
// <audio> element and playback state are not tied to any React component's
// lifecycle. The React hook below subscribes to this store and exposes its
// state and controls. Playback starts paused; the first play() call loads a
// shuffled queue of up to 50 random samples and starts the first one. Only the
// 25-second sample window (sampleStartSec..sampleEndSec) ever plays.

const QUEUE_SIZE = 50;

let catalog: TrackSummary[] = [];
let queue: TrackSummary[] = [];
let currentIndex = -1;
let isPlaying = false;
let volume = 0.8;
let muted = false;
let progress = 0;
let currentTime = 0;
let duration = 0;
let loadedUrl: string | null = null;
let audio: HTMLAudioElement | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadQueue() {
  if (catalog.length === 0) return;
  queue = shuffle(catalog).slice(0, QUEUE_SIZE);
  currentIndex = 0;
}

function getCurrentTrack(): TrackSummary | null {
  if (currentIndex < 0 || currentIndex >= queue.length) return null;
  return queue[currentIndex];
}

function ensureAudio(): HTMLAudioElement | null {
  if (audio) return audio;
  if (typeof Audio === "undefined") return null;
  audio = new Audio();
  audio.preload = "auto";
  audio.addEventListener("loadedmetadata", handleLoadedMetadata);
  audio.addEventListener("timeupdate", handleTimeUpdate);
  audio.addEventListener("ended", handleEnded);
  return audio;
}

function handleLoadedMetadata() {
  const track = getCurrentTrack();
  if (!track || !audio) return;
  const start = Number(track.sampleStartSec);
  audio.currentTime = start;
  duration = Number(track.sampleEndSec) - start;
  emit();
}

function handleTimeUpdate() {
  const track = getCurrentTrack();
  if (!track || !audio) return;
  const start = Number(track.sampleStartSec);
  const end = Number(track.sampleEndSec);
  currentTime = audio.currentTime;
  const range = end - start;
  progress = range > 0 ? Math.min((currentTime - start) / range, 1) : 0;
  if (currentTime >= end) {
    advance();
    return;
  }
  emit();
}

function handleEnded() {
  advance();
}

function startTrack(index: number) {
  const track = queue[index];
  if (!track) return;
  currentIndex = index;
  const el = ensureAudio();
  if (!el) return;
  loadedUrl = track.audioSampleUrl;
  el.src = track.audioSampleUrl;
  el.volume = muted ? 0 : volume;
  el.currentTime = Number(track.sampleStartSec);
  void el
    .play()
    .then(() => {
      isPlaying = true;
      emit();
    })
    .catch(() => {
      isPlaying = false;
      emit();
    });
}

function advance() {
  if (queue.length === 0) return;
  if (currentIndex < queue.length - 1) {
    startTrack(currentIndex + 1);
  } else {
    loadQueue();
    startTrack(0);
  }
}

/** Starts playback. On the first call it loads the queue and plays the first random sample. */
export function play() {
  if (catalog.length === 0) return;
  if (queue.length === 0 || currentIndex < 0) loadQueue();
  if (currentIndex < 0) return;
  const el = ensureAudio();
  if (!el) return;
  if (isPlaying) return;
  const track = getCurrentTrack();
  if (track && loadedUrl === track.audioSampleUrl) {
    el.volume = muted ? 0 : volume;
    void el
      .play()
      .then(() => {
        isPlaying = true;
        emit();
      })
      .catch(() => {});
  } else {
    startTrack(currentIndex);
  }
}

/** Pauses playback, keeping the current track and position. */
export function pause() {
  if (audio) audio.pause();
  isPlaying = false;
  emit();
}

/** Toggles between playing and paused. */
export function toggle() {
  if (isPlaying) pause();
  else play();
}

/** Advances forward only. When the queue ends, reshuffles a new set of up to 50 songs. */
export function skip() {
  if (catalog.length === 0) return;
  if (queue.length === 0 || currentIndex < 0) loadQueue();
  if (currentIndex < 0) return;
  if (currentIndex < queue.length - 1) {
    startTrack(currentIndex + 1);
  } else {
    loadQueue();
    startTrack(0);
  }
}

/** Sets the volume (0..1) and unmutes. Persists for the session. */
export function setVolume(v: number) {
  volume = Math.min(1, Math.max(0, v));
  if (!muted && audio) audio.volume = volume;
  emit();
}

/** Toggles mute. */
export function toggleMute() {
  muted = !muted;
  if (audio) audio.volume = muted ? 0 : volume;
  emit();
}

/** Seeks within the current 25-second sample window (frac 0..1). */
export function seek(frac: number) {
  const track = getCurrentTrack();
  if (!track || !audio) return;
  const start = Number(track.sampleStartSec);
  const end = Number(track.sampleEndSec);
  const range = end - start;
  audio.currentTime = start + Math.min(Math.max(frac, 0), 1) * range;
  emit();
}

/**
 * React binding for the global player. Fetches the store catalog via
 * useTrackSummaries and feeds it into the module store, then subscribes to
 * store changes so the returned state stays in sync across route navigation.
 */
export function useGlobalPlayer() {
  const { data: summaries } = useTrackSummaries();
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    if (summaries && summaries.length > 0) {
      catalog = summaries;
    }
  }, [summaries]);

  useEffect(() => subscribe(forceUpdate), []);

  const currentTrack = getCurrentTrack();

  return {
    currentTrack,
    isPlaying,
    volume,
    muted,
    progress,
    currentTime,
    duration,
    hasCatalog: catalog.length > 0,
    play,
    pause,
    toggle,
    skip,
    setVolume,
    toggleMute,
    seek,
  };
}
