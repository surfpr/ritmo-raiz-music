import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: _SERVICE;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  const fixture = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BACKEND_WASM });
  actor = fixture.actor;
  // The PocketIC actor's default identity is anonymous, which
  // _initializeAccessControl ignores (it returns early for anonymous callers),
  // so no admin would ever be assigned and addTrack would trap. Set a real
  // identity first so the caller becomes the admin; addTrack is admin-only.
  (fixture.actor as Actor<_SERVICE>).setIdentity(createIdentity("backend-lane-admin"));
  await actor._initializeAccessControl();
});

afterAll(async () => {
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  await expect(actor.listTracks()).resolves.toEqual([]);
});

it("round-trips a track through the real canister", async () => {
  const track = await actor.addTrack({
    recommendedUse: [],
    tempo: [],
    title: { en: "Salsa Nights", es: "Noches de Salsa" },
    country: "Colombia",
    sampleEndSec: 25n,
    mood: [],
    vocalType: [],
    isNewArrival: true,
    audioFile: [new Uint8Array([1, 2, 3])],
    coverImage: new Uint8Array(),
    isFeatured: true,
    genre: "Salsa",
    sampleStartSec: 0n,
    artist: "Ritmo Raíz",
  });
  expect(await actor.listTracks()).toContainEqual(
    expect.objectContaining({ id: track.id, title: { en: "Salsa Nights", es: "Noches de Salsa" } }),
  );
});

it("pages through lightweight track summaries without trapping", async () => {
  // The store grid reads pages of TrackSummary items (no blob bytes) plus the
  // total count. Add a track, then read a page that includes it.
  const track = await actor.addTrack({
    recommendedUse: [],
    tempo: [],
    title: { en: "Bachata Azul", es: "Bachata Azul" },
    country: "Dominican Republic",
    sampleEndSec: 25n,
    mood: [],
    vocalType: [],
    isNewArrival: false,
    audioFile: [new Uint8Array([4, 5, 6])],
    coverImage: new Uint8Array(),
    isFeatured: false,
    genre: "Bachata",
    sampleStartSec: 0n,
    artist: "Ritmo Raíz",
  });

  const page = await actor.listTracksPage(0n, 24n);
  expect(page.total).toBeGreaterThan(0n);
  expect(page.items).toContainEqual(
    expect.objectContaining({ id: track.id, title: { en: "Bachata Azul", es: "Bachata Azul" } }),
  );
});

it("round-trips featured / new-arrival flags through the real canister", async () => {
  // The store's Destacadas and New Arrivals shelves read exactly the songs the
  // backend flags, so the flag write path and the two list queries must agree.
  const featured = await actor.addTrack({
    recommendedUse: [],
    tempo: [],
    title: { en: "Featured One", es: "Destacada Uno" },
    country: "Colombia",
    sampleEndSec: 25n,
    mood: [],
    vocalType: [],
    isNewArrival: false,
    audioFile: [new Uint8Array([7, 8, 9])],
    coverImage: new Uint8Array(),
    isFeatured: true,
    genre: "Salsa",
    sampleStartSec: 0n,
    artist: "Ritmo Raíz",
  });
  const arrival = await actor.addTrack({
    recommendedUse: [],
    tempo: [],
    title: { en: "Arrival One", es: "Novedad Uno" },
    country: "Mexico",
    sampleEndSec: 25n,
    mood: [],
    vocalType: [],
    isNewArrival: true,
    audioFile: [new Uint8Array([10, 11, 12])],
    coverImage: new Uint8Array(),
    isFeatured: false,
    genre: "Cumbia",
    sampleStartSec: 0n,
    artist: "Ritmo Raíz",
  });

  const featuredList = await actor.listFeaturedTracks();
  expect(featuredList.map((t) => t.id)).toContain(featured.id);
  expect(featuredList.map((t) => t.id)).not.toContain(arrival.id);

  const arrivalList = await actor.listNewArrivalTracks();
  expect(arrivalList.map((t) => t.id)).toContain(arrival.id);
  expect(arrivalList.map((t) => t.id)).not.toContain(featured.id);
});

it("bulk-adds tracks through the real canister", async () => {
  const added = await actor.bulkAddTracks([
    {
      recommendedUse: [],
      tempo: [],
      title: { en: "Bulk One", es: "Lote Uno" },
      country: "Colombia",
      sampleEndSec: 25n,
      mood: [],
      vocalType: [],
      isNewArrival: true,
      audioFile: [new Uint8Array([13, 14, 15])],
      coverImage: new Uint8Array(),
      isFeatured: false,
      genre: "Reggaeton",
      sampleStartSec: 0n,
      artist: "Ritmo Raíz",
    },
    {
      recommendedUse: [],
      tempo: [],
      title: { en: "Bulk Two", es: "Lote Dos" },
      country: "Colombia",
      sampleEndSec: 25n,
      mood: [],
      vocalType: [],
      isNewArrival: true,
      audioFile: [new Uint8Array([16, 17, 18])],
      coverImage: new Uint8Array(),
      isFeatured: false,
      genre: "Reggaeton",
      sampleStartSec: 0n,
      artist: "Ritmo Raíz",
    },
  ]);

  expect(added).toHaveLength(2);
  const all = await actor.listTracks();
  for (const track of added) {
    expect(all.map((t) => t.id)).toContain(track.id);
  }
});

it("round-trips Stripe keys through the real canister", async () => {
  // Empty-state read: no keys have been set yet.
  expect(await actor.getStripeKeys()).toEqual({
    publishableKey: "",
    secretKey: "",
  });

  // The lane actor is an admin, so setStripeKeys is permitted.
  await expect(
    actor.setStripeKeys({ publishableKey: "pk_live_123", secretKey: "sk_live_456" }),
  ).resolves.toBeNull();

  expect(await actor.getStripeKeys()).toEqual({
    publishableKey: "pk_live_123",
    secretKey: "sk_live_456",
  });
});
