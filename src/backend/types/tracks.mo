import CommonTypes "common";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type Genre = Text;
  public type Country = Text;

  public type LicenseTierId = Nat;

  public type LicenseTier = {
    id : LicenseTierId;
    name : CommonTypes.BilingualText;
    description : CommonTypes.BilingualText;
    priceUsd : Nat; // in cents
  };

  public type Track = {
    id : CommonTypes.TrackId;
    title : CommonTypes.BilingualText;
    artist : Text;
    genre : Genre;
    country : Country;
    coverImage : Storage.ExternalBlob;
    audioFile : Storage.ExternalBlob;
    sampleStartSec : Nat; // sample clip start in seconds
    sampleEndSec : Nat;   // sample clip end in seconds (start + 25)
    isFeatured : Bool;
    isNewArrival : Bool;
    createdAt : CommonTypes.Timestamp;
    vocalType : ?Text;       // "Lyrical" | "Instrumental"
    mood : ?Text;            // "Energetic" | "Romantic" | "Festive" | "Melancholic" | "Relaxing" | "Motivational" | "Dramatic" | "Upbeat" | "Nostalgic"
    tempo : ?Text;           // "Slow" | "Moderate" | "Fast"
    recommendedUse : ?Text;  // "Advertising" | "Film & TV" | "Social Media" | "On-Hold Music" | "Podcast" | "Event" | "Gaming"
  };

  public type TrackInput = {
    title : CommonTypes.BilingualText;
    artist : Text;
    genre : Genre;
    country : Country;
    coverImage : Storage.ExternalBlob;
    audioFile : ?Storage.ExternalBlob; // null = keep existing
    sampleStartSec : Nat;
    sampleEndSec : Nat;
    isFeatured : Bool;
    isNewArrival : Bool;
    vocalType : ?Text;       // "Lyrical" | "Instrumental"
    mood : ?Text;            // "Energetic" | "Romantic" | "Festive" | "Melancholic" | "Relaxing" | "Motivational" | "Dramatic" | "Upbeat" | "Nostalgic"
    tempo : ?Text;           // "Slow" | "Moderate" | "Fast"
    recommendedUse : ?Text;  // "Advertising" | "Film & TV" | "Social Media" | "On-Hold Music" | "Podcast" | "Event" | "Gaming"
  };

  /// Lightweight store-grid view of a track. Carries direct object-storage URL
  /// strings (NOT ExternalBlob blobs) so the generated bindgen wrapper does not
  /// download cover/audio bytes for every track on page load. Derived from the
  /// full Track at query time; never persisted.
  public type TrackSummary = {
    id : CommonTypes.TrackId;
    title : CommonTypes.BilingualText;
    artist : Text;
    genre : Genre;
    country : Country;
    mood : ?Text;
    tempo : ?Text;
    vocalType : ?Text;
    recommendedUse : ?Text;
    priceCents : Nat;
    licenseTierId : LicenseTierId;
    coverImageUrl : Text;
    audioSampleUrl : Text;
    sampleStartSec : Nat;
    sampleEndSec : Nat;
  };

  /// A page of TrackSummary items plus the total number of tracks, so the
  /// frontend can page through all tracks without loading them all at once.
  public type TrackSummaryPage = {
    items : [TrackSummary];
    total : Nat;
  };
};
