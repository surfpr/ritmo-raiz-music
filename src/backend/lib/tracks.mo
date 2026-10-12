import Map "mo:core/Map";
import TrackTypes "../types/tracks";
import CommonTypes "../types/common";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Prim "mo:prim";

module {
  // Object-storage gateway config matching the frontend's default config
  // (see @caffeineai/core-infrastructure config.js defaults).
  let STORAGE_GATEWAY_URL = "https://blob.caffeine.ai";
  let PROJECT_ID = "0000000-0000-0000-0000-00000000000";
  let BLOB_SENTINEL = "!caf!";

  /// Derive a direct object-storage URL string from an ExternalBlob. The blob
  /// bytes are the UTF-8 text "!caf!" + content-hash; the direct URL is
  /// {gateway}/v1/blob/?blob_hash={hash}&owner_id={canister}&project_id={project}.
  func blobToUrl(blob : Blob, ownerId : Text) : Text {
    let text = switch (blob.decodeUtf8()) {
      case (?t) { t };
      case null { "" };
    };
    let hash = switch (text.stripStart(#text BLOB_SENTINEL)) {
      case (?h) { h };
      case null { text };
    };
    STORAGE_GATEWAY_URL
      # "/v1/blob/?blob_hash="
      # hash.replace(#char ':', "%3A")
      # "&owner_id="
      # ownerId
      # "&project_id="
      # PROJECT_ID;
  };

  /// Pick the default license tier (lowest price) for a track's summary price.
  func defaultTier(tiers : Map.Map<TrackTypes.LicenseTierId, TrackTypes.LicenseTier>) : (Nat, TrackTypes.LicenseTierId) {
    var bestPrice : Nat = 0;
    var bestId : TrackTypes.LicenseTierId = 0;
    var first = true;
    for ((id, tier) in tiers.entries()) {
      if (first or tier.priceUsd < bestPrice) {
        bestPrice := tier.priceUsd;
        bestId := id;
        first := false;
      };
    };
    (bestPrice, bestId);
  };

  func toSummary(t : TrackTypes.Track, priceCents : Nat, licenseTierId : TrackTypes.LicenseTierId, ownerId : Text) : TrackTypes.TrackSummary {
    {
      id = t.id;
      title = t.title;
      artist = t.artist;
      genre = t.genre;
      country = t.country;
      mood = t.mood;
      tempo = t.tempo;
      vocalType = t.vocalType;
      recommendedUse = t.recommendedUse;
      priceCents;
      licenseTierId;
      coverImageUrl = blobToUrl(t.coverImage, ownerId);
      audioSampleUrl = blobToUrl(t.audioFile, ownerId);
      sampleStartSec = t.sampleStartSec;
      sampleEndSec = t.sampleEndSec;
    };
  };

  public func listTracksPage(
    tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>,
    licenseTiers : Map.Map<TrackTypes.LicenseTierId, TrackTypes.LicenseTier>,
    offset : Nat,
    limit : Nat,
    ownerId : Text,
  ) : TrackTypes.TrackSummaryPage {
    let (priceCents, licenseTierId) = defaultTier(licenseTiers);
    let all = tracks.values().toArray();
    let total = all.size();
    let from = offset;
    let to = Nat.min(offset + limit, total);
    let items = if (from >= total) {
      [];
    } else {
      all.sliceToArray(from.toInt(), to.toInt()).map(func t = toSummary(t, priceCents, licenseTierId, ownerId));
    };
    {
      items;
      total;
    };
  };

  public func listTracks(
    tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>
  ) : [TrackTypes.Track] {
    tracks.values().toArray();
  };

  public func getTrack(
    tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>,
    id : CommonTypes.TrackId
  ) : ?TrackTypes.Track {
    tracks.get(id);
  };

  public func addTrack(
    tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>,
    state : { var nextTrackId : CommonTypes.TrackId },
    input : TrackTypes.TrackInput
  ) : TrackTypes.Track {
    let id = state.nextTrackId;
    state.nextTrackId += 1;
    let audioFile = switch (input.audioFile) {
      case (?af) { af };
      case null { Runtime.trap("audioFile required for new track") };
    };
    // Enforce 25-second sample window
    let sampleEnd = input.sampleStartSec + 25;
    let track : TrackTypes.Track = {
      id;
      title = input.title;
      artist = input.artist;
      genre = input.genre;
      country = input.country;
      coverImage = input.coverImage;
      audioFile;
      sampleStartSec = input.sampleStartSec;
      sampleEndSec = sampleEnd;
      isFeatured = input.isFeatured;
      isNewArrival = input.isNewArrival;
      createdAt = Time.now();
      vocalType = input.vocalType;
      mood = input.mood;
      tempo = input.tempo;
      recommendedUse = input.recommendedUse;
    };
    tracks.add(id, track);
    track;
  };

  public func updateTrack(
    tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>,
    id : CommonTypes.TrackId,
    input : TrackTypes.TrackInput
  ) : ?TrackTypes.Track {
    switch (tracks.get(id)) {
      case null { null };
      case (?existing) {
        // Preserve existing audio if no new file provided
        let audioFile = switch (input.audioFile) {
          case (?af) { af };
          case null { existing.audioFile };
        };
        // Enforce 25-second sample window
        let sampleEnd = input.sampleStartSec + 25;
        let updated : TrackTypes.Track = {
          existing with
          title = input.title;
          artist = input.artist;
          genre = input.genre;
          country = input.country;
          coverImage = input.coverImage;
          audioFile;
          sampleStartSec = input.sampleStartSec;
          sampleEndSec = sampleEnd;
          isFeatured = input.isFeatured;
          isNewArrival = input.isNewArrival;
          vocalType = input.vocalType;
          mood = input.mood;
          tempo = input.tempo;
          recommendedUse = input.recommendedUse;
        };
        tracks.add(id, updated);
        ?updated;
      };
    };
  };

  public func deleteTrack(
    tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>,
    id : CommonTypes.TrackId
  ) : Bool {
    if (tracks.containsKey(id)) {
      tracks.remove(id);
      true;
    } else {
      false;
    };
  };

  public func filterTracks(
    tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>,
    genre : ?Text,
    country : ?Text,
    vocalType : ?Text,
    mood : ?Text,
    tempo : ?Text,
    recommendedUse : ?Text,
    _priceRange : ?Text, // reserved for frontend filtering; ignored here
  ) : [TrackTypes.Track] {
    tracks.values().filter(func(t) {
      (switch genre { case null true; case (?g) t.genre == g }) and
      (switch country { case null true; case (?c) t.country == c }) and
      (switch vocalType { case null true; case (?vt) t.vocalType == ?vt }) and
      (switch mood { case null true; case (?m) t.mood == ?m }) and
      (switch tempo { case null true; case (?tm) t.tempo == ?tm }) and
      (switch recommendedUse { case null true; case (?ru) t.recommendedUse == ?ru });
    }).toArray();
  };

  public func listByGenre(
    tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>,
    genre : Text
  ) : [TrackTypes.Track] {
    tracks.values().filter(func(t) { t.genre == genre }).toArray();
  };

  public func listByCountry(
    tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>,
    country : Text
  ) : [TrackTypes.Track] {
    tracks.values().filter(func(t) { t.country == country }).toArray();
  };

  public func listFeatured(
    tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>
  ) : [TrackTypes.Track] {
    tracks.values().filter(func(t) { t.isFeatured }).toArray();
  };

  public func listNewArrivals(
    tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>
  ) : [TrackTypes.Track] {
    tracks.values().filter(func(t) { t.isNewArrival }).toArray();
  };
};
