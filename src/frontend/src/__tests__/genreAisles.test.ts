import type { TrackSummary } from "@/backend";
import {
  GENRE_AISLES,
  buildAisleDirectory,
  buildInstrumentalGroups,
  findAisle,
  genreLabel,
  normalizeGenre,
} from "@/lib/genreAisles";
import { describe, expect, it } from "vitest";

// The genre aisle directory is the store's primary navigation surface. It must
// list every canonical genre with a live track count and a representative
// cover, including genres that currently have no tracks.

function track(
  id: number,
  genre: string,
  coverImageUrl: string,
  extra: Partial<TrackSummary> = {},
): TrackSummary {
  return {
    id: BigInt(id),
    title: { en: `Track ${id}`, es: `Pista ${id}` },
    country: "Colombia",
    genre,
    artist: "Ritmo Raíz",
    sampleStartSec: BigInt(0),
    sampleEndSec: BigInt(25),
    licenseTierId: BigInt(1),
    priceCents: BigInt(499),
    coverImageUrl,
    audioSampleUrl: `https://example.com/sample${id}.mp3`,
    ...extra,
  };
}

describe("buildAisleDirectory", () => {
  it("lists every canonical genre, including empty ones", () => {
    const aisles = buildAisleDirectory([]);

    expect(aisles).toHaveLength(GENRE_AISLES.length);
    expect(aisles.map((a) => a.value)).toEqual(
      GENRE_AISLES.map((a) => a.value),
    );
    for (const aisle of aisles) {
      expect(aisle.count).toBe(0);
      expect(aisle.coverUrl).toBe("");
    }
  });

  it("counts tracks per genre and picks a representative cover", () => {
    const aisles = buildAisleDirectory([
      track(1, "Salsa", "https://example.com/salsa1.jpg"),
      track(2, "Salsa", "https://example.com/salsa2.jpg"),
      track(3, "Cumbia", "https://example.com/cumbia1.jpg"),
    ]);

    const salsa = aisles.find((a) => a.value === "Salsa");
    const cumbia = aisles.find((a) => a.value === "Cumbia");
    const bolero = aisles.find((a) => a.value === "Bolero");

    expect(salsa?.count).toBe(2);
    expect(salsa?.coverUrl).toBe("https://example.com/salsa1.jpg");
    expect(cumbia?.count).toBe(1);
    expect(cumbia?.coverUrl).toBe("https://example.com/cumbia1.jpg");
    expect(bolero?.count).toBe(0);
  });

  it("skips tracks without a cover when choosing the representative cover", () => {
    const aisles = buildAisleDirectory([
      track(1, "Salsa", ""),
      track(2, "Salsa", "https://example.com/salsa2.jpg"),
    ]);

    const salsa = aisles.find((a) => a.value === "Salsa");
    expect(salsa?.count).toBe(2);
    expect(salsa?.coverUrl).toBe("https://example.com/salsa2.jpg");
  });
});

describe("genreLabel / findAisle", () => {
  it("returns the bilingual label for a known genre", () => {
    expect(genreLabel("Reggaeton", "es")).toBe("Reggaetón");
    expect(genreLabel("Reggaeton", "en")).toBe("Reggaeton");
  });

  it("falls back to the raw value for an unknown genre", () => {
    expect(genreLabel("Unknown Genre", "es")).toBe("Unknown Genre");
    expect(findAisle("Unknown Genre")).toBeUndefined();
  });
});

describe("normalizeGenre / Trap Latino merge", () => {
  it("folds Trap Latino into Reggaeton", () => {
    expect(normalizeGenre("Trap Latino")).toBe("Reggaeton");
  });

  it("leaves canonical genres unchanged", () => {
    expect(normalizeGenre("Salsa")).toBe("Salsa");
    expect(normalizeGenre("Reggaeton")).toBe("Reggaeton");
  });

  it("resolves a Trap Latino track to the Reggaeton aisle", () => {
    expect(findAisle("Trap Latino")?.value).toBe("Reggaeton");
    expect(genreLabel("Trap Latino", "es")).toBe("Reggaetón");
  });

  it("counts Trap Latino tracks under the Reggaeton aisle", () => {
    const aisles = buildAisleDirectory([
      track(1, "Reggaeton", ""),
      track(2, "Trap Latino", ""),
    ]);

    const reggaeton = aisles.find((a) => a.value === "Reggaeton");
    expect(reggaeton?.count).toBe(2);
    // There is no separate Trap Latino aisle.
    expect(aisles.find((a) => a.value === "Trap Latino")).toBeUndefined();
  });
});

describe("Sacra genre", () => {
  it("is a canonical aisle", () => {
    expect(GENRE_AISLES.some((a) => a.value === "Sacra")).toBe(true);
    expect(findAisle("Sacra")?.value).toBe("Sacra");
  });

  it("appears in the aisle directory even with no tracks", () => {
    const aisles = buildAisleDirectory([]);
    expect(aisles.find((a) => a.value === "Sacra")?.count).toBe(0);
  });
});

describe("buildInstrumentalGroups", () => {
  it("groups instrumental tracks by their existing genre", () => {
    const groups = buildInstrumentalGroups([
      track(1, "Salsa", "", { vocalType: "Instrumental" }),
      track(2, "Salsa", "", { vocalType: "Instrumental" }),
      track(3, "Cumbia", "", { vocalType: "Instrumental" }),
    ]);

    expect(groups.map((g) => g.genre)).toEqual(["Salsa", "Cumbia"]);
    expect(groups.find((g) => g.genre === "Salsa")?.tracks).toHaveLength(2);
    expect(groups.find((g) => g.genre === "Cumbia")?.tracks).toHaveLength(1);
  });

  it("excludes lyrical tracks", () => {
    const groups = buildInstrumentalGroups([
      track(1, "Salsa", "", { vocalType: "Lyrical" }),
      track(2, "Cumbia", "", { vocalType: "Instrumental" }),
    ]);

    expect(groups.map((g) => g.genre)).toEqual(["Cumbia"]);
  });

  it("excludes Sacra even when tagged Instrumental", () => {
    const groups = buildInstrumentalGroups([
      track(1, "Sacra", "", { vocalType: "Instrumental" }),
      track(2, "Salsa", "", { vocalType: "Instrumental" }),
    ]);

    expect(groups.map((g) => g.genre)).toEqual(["Salsa"]);
    expect(groups.some((g) => g.genre === "Sacra")).toBe(false);
  });

  it("folds Trap Latino instrumental tracks into the Reggaeton group", () => {
    const groups = buildInstrumentalGroups([
      track(1, "Trap Latino", "", { vocalType: "Instrumental" }),
    ]);

    expect(groups.map((g) => g.genre)).toEqual(["Reggaeton"]);
  });

  it("returns no groups when there are no instrumental tracks", () => {
    expect(buildInstrumentalGroups([track(1, "Salsa", "")])).toEqual([]);
  });
});
