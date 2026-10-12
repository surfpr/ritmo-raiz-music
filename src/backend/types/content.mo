import CommonTypes "common";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type ServiceItem = {
    id : Nat;
    icon : Text; // emoji or icon name
    title : CommonTypes.BilingualText;
    description : CommonTypes.BilingualText;
  };

  public type LandingContent = {
    heroTitle : CommonTypes.BilingualText;
    heroSubtitle : CommonTypes.BilingualText;
    servicesTitle : CommonTypes.BilingualText;
    services : [ServiceItem];
    featuredTrackIds : [CommonTypes.TrackId];
    newArrivalTrackIds : [CommonTypes.TrackId];
    customMusicCtaTitle : CommonTypes.BilingualText;
    customMusicCtaBody : CommonTypes.BilingualText;
    logoImage : ?Storage.ExternalBlob;
  };

  public type SiteSettings = {
    customMusicPriceUsd : Nat; // in cents
  };
};
