import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import ContentTypes "../types/content";
import CommonTypes "../types/common";
import ContentLib "../lib/content";

mixin (
  accessControlState : AccessControl.AccessControlState,
  contentState : { var landing : ContentTypes.LandingContent; var siteSettings : ContentTypes.SiteSettings },
) {
  /// Public: get landing page content
  public query func getLandingContent() : async ContentTypes.LandingContent {
    ContentLib.getLandingContent(contentState);
  };

  /// Admin: update landing page content
  public shared ({ caller }) func updateLandingContent(updated : ContentTypes.LandingContent) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update landing content");
    };
    ContentLib.updateLandingContent(contentState, updated);
  };

  /// Public: get site settings (e.g. custom music price)
  public query func getSiteSettings() : async ContentTypes.SiteSettings {
    ContentLib.getSiteSettings(contentState);
  };

  /// Admin: update site settings
  public shared ({ caller }) func updateSiteSettings(updated : ContentTypes.SiteSettings) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update site settings");
    };
    ContentLib.updateSiteSettings(contentState, updated);
  };
};
