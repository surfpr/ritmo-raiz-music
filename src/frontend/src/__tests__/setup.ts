import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// The @caffeineai/object-storage package's dist/index.js imports a "./blob"
// module that is not present in this environment, which breaks any module that
// transitively imports @/backend (e.g. TrackCard). Mock the package so the
// store tests can exercise the components without the broken dependency.
vi.mock("@caffeineai/object-storage", () => {
  class ExternalBlob {
    private readonly bytes: Uint8Array;
    private readonly onProgress?: (p: number) => void;

    constructor(
      bytes: Uint8Array = new Uint8Array(),
      onProgress?: (p: number) => void,
    ) {
      this.bytes = bytes;
      this.onProgress = onProgress;
    }

    static fromBytes(bytes: Uint8Array): ExternalBlob {
      return new ExternalBlob(bytes);
    }

    withUploadProgress(onProgress: (p: number) => void): ExternalBlob {
      return new ExternalBlob(this.bytes, onProgress);
    }

    getDirectURL(): string {
      return "";
    }
  }
  return { ExternalBlob };
});

// jsdom does not implement HTMLMediaElement playback or loading; stub the
// methods the audio prefetch hook and player rely on so tests observe state
// transitions without jsdom's "Not implemented" noise.
beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
  HTMLMediaElement.prototype.load = vi.fn();
  vi.stubGlobal("requestAnimationFrame", vi.fn());
});

afterEach(() => {
  cleanup();
});
