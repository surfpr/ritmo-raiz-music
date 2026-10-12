import ContentTypes "../types/content";

module {
  public func getLandingContent(
    content : { var landing : ContentTypes.LandingContent }
  ) : ContentTypes.LandingContent {
    content.landing;
  };

  public func updateLandingContent(
    content : { var landing : ContentTypes.LandingContent },
    updated : ContentTypes.LandingContent
  ) : () {
    content.landing := updated;
  };

  public func getSiteSettings(
    settings : { var siteSettings : ContentTypes.SiteSettings }
  ) : ContentTypes.SiteSettings {
    settings.siteSettings;
  };

  public func updateSiteSettings(
    settings : { var siteSettings : ContentTypes.SiteSettings },
    updated : ContentTypes.SiteSettings
  ) : () {
    settings.siteSettings := updated;
  };
};
