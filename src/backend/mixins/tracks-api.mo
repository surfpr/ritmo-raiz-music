import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import TrackTypes "../types/tracks";
import CommonTypes "../types/common";
import TracksLib "../lib/tracks";
import List "mo:core/List";
import Prim "mo:prim";

mixin (
  accessControlState : AccessControl.AccessControlState,
  tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>,
  trackState : { var nextTrackId : CommonTypes.TrackId },
  licenseTiers : Map.Map<TrackTypes.LicenseTierId, TrackTypes.LicenseTier>,
) {
  /// Public: return a page of lightweight TrackSummary items plus the total
  /// count, so the store grid can page through all tracks without downloading
  /// cover/audio blob bytes for every track on page load.
  public shared func listTracksPage(offset : Nat, limit : Nat) : async TrackTypes.TrackSummaryPage {
    TracksLib.listTracksPage(tracks, licenseTiers, offset, limit, Prim.getSelfPrincipal<system>().toText());
  };

  /// Public: list all tracks
  public query func listTracks() : async [TrackTypes.Track] {
    TracksLib.listTracks(tracks);
  };

  /// Public: get single track
  public query func getTrack(id : CommonTypes.TrackId) : async ?TrackTypes.Track {
    TracksLib.getTrack(tracks, id);
  };

  /// Public: list tracks by genre
  public query func listTracksByGenre(genre : Text) : async [TrackTypes.Track] {
    TracksLib.listByGenre(tracks, genre);
  };

  /// Public: list tracks by country
  public query func listTracksByCountry(country : Text) : async [TrackTypes.Track] {
    TracksLib.listByCountry(tracks, country);
  };

  /// Public: list featured tracks
  public query func listFeaturedTracks() : async [TrackTypes.Track] {
    TracksLib.listFeatured(tracks);
  };

  /// Public: list new arrivals
  public query func listNewArrivalTracks() : async [TrackTypes.Track] {
    TracksLib.listNewArrivals(tracks);
  };

  /// Public: filter tracks by optional AND-logic criteria
  /// priceRange is accepted but ignored (price filtering is client-side)
  public query func filterTracks(
    genre : ?Text,
    country : ?Text,
    vocalType : ?Text,
    mood : ?Text,
    tempo : ?Text,
    recommendedUse : ?Text,
    priceRange : ?Text,
  ) : async [TrackTypes.Track] {
    TracksLib.filterTracks(tracks, genre, country, vocalType, mood, tempo, recommendedUse, priceRange);
  };

  /// Admin: add a single track
  public shared ({ caller }) func addTrack(input : TrackTypes.TrackInput) : async TrackTypes.Track {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add tracks");
    };
    TracksLib.addTrack(tracks, trackState, input);
  };

  /// Admin: update an existing track; audioFile = null keeps existing audio
  public shared ({ caller }) func updateTrack(id : CommonTypes.TrackId, input : TrackTypes.TrackInput) : async ?TrackTypes.Track {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update tracks");
    };
    TracksLib.updateTrack(tracks, id, input);
  };

  /// Admin: delete a track
  public shared ({ caller }) func deleteTrack(id : CommonTypes.TrackId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete tracks");
    };
    TracksLib.deleteTrack(tracks, id);
  };

  /// Admin: bulk add tracks
  public shared ({ caller }) func bulkAddTracks(inputs : [TrackTypes.TrackInput]) : async [TrackTypes.Track] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can bulk add tracks");
    };
    var results = List.empty<TrackTypes.Track>();
    for (input in inputs.values()) {
      let track = TracksLib.addTrack(tracks, trackState, input);
      results.add(track);
    };
    results.toArray();
  };
};
