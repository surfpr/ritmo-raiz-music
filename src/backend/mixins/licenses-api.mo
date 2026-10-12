import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import TrackTypes "../types/tracks";
import LicensesLib "../lib/licenses";

mixin (
  accessControlState : AccessControl.AccessControlState,
  licenseTiers : Map.Map<TrackTypes.LicenseTierId, TrackTypes.LicenseTier>,
  tierState : { var nextTierId : TrackTypes.LicenseTierId },
) {
  // Seed defaults on first include (no-op if tiers already exist)
  LicensesLib.seedDefaultTiers(licenseTiers, tierState);

  /// Public: list all license tiers
  public query func listLicenseTiers() : async [TrackTypes.LicenseTier] {
    LicensesLib.listLicenseTiers(licenseTiers);
  };

  /// Admin: upsert a license tier (create or update by id)
  public shared ({ caller }) func upsertLicenseTier(tier : TrackTypes.LicenseTier) : async TrackTypes.LicenseTier {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can manage license tiers");
    };
    LicensesLib.upsertLicenseTier(licenseTiers, tierState, tier);
  };

  /// Admin: delete a license tier
  public shared ({ caller }) func deleteLicenseTier(id : TrackTypes.LicenseTierId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete license tiers");
    };
    LicensesLib.deleteLicenseTier(licenseTiers, id);
  };
};
