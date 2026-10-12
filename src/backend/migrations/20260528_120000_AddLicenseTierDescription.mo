import Map "mo:core/Map";

// Pure identity passthrough — LicenseTier description upgrade is handled
// entirely by 20260528_130000_FixAccessControlKeyType.mo which is the single
// consolidation migration. This file exists only to preserve chain ordering.
module {
  type BilingualText = { es : Text; en : Text };
  type ServiceItem = { id : Nat; icon : Text; title : BilingualText; description : BilingualText };
  type LandingContent = {
    heroTitle : BilingualText;
    heroSubtitle : BilingualText;
    servicesTitle : BilingualText;
    services : [ServiceItem];
    featuredTrackIds : [Nat];
    newArrivalTrackIds : [Nat];
    customMusicCtaTitle : BilingualText;
    customMusicCtaBody : BilingualText;
    logoImage : ?Blob;
  };
  type SiteSettings = { customMusicPriceUsd : Nat };
  type Track = {
    id : Nat;
    title : BilingualText;
    artist : Text;
    genre : Text;
    country : Text;
    coverImage : Blob;
    audioFile : Blob;
    sampleStartSec : Nat;
    sampleEndSec : Nat;
    isFeatured : Bool;
    isNewArrival : Bool;
    createdAt : Int;
  };
  // 3-field LicenseTier — matches InitState.NewActor (deployed snapshot)
  type LicenseTier = {
    id : Nat;
    name : BilingualText;
    priceUsd : Nat;
  };
  type OrderStatus = { #pending; #inProgress; #completed };
  type CustomMusicOrder = {
    id : Nat;
    customerEmail : Text;
    projectType : Text;
    genrePreference : Text;
    styleDescription : Text;
    status : OrderStatus;
    createdAt : Int;
  };
  type UserRole = { #admin; #user; #guest };
  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };
  type StripeConfiguration = {
    secretKey : Text;
    allowedCountries : [Text];
  };

  // OldActor = InitState.NewActor (3-field LicenseTier, Principal-keyed roles)
  type OldActor = {
    accessControlState : AccessControlState;
    tracks : Map.Map<Nat, Track>;
    trackState : { var nextTrackId : Nat };
    licenseTiers : Map.Map<Nat, LicenseTier>;
    tierState : { var nextTierId : Nat };
    orders : Map.Map<Nat, CustomMusicOrder>;
    orderState : { var nextOrderId : Nat };
    contentState : { var landing : LandingContent; var siteSettings : SiteSettings };
    var stripeConfiguration : ?StripeConfiguration;
  };

  // NewActor is identical — pure passthrough
  type NewActor = {
    accessControlState : AccessControlState;
    tracks : Map.Map<Nat, Track>;
    trackState : { var nextTrackId : Nat };
    licenseTiers : Map.Map<Nat, LicenseTier>;
    tierState : { var nextTierId : Nat };
    orders : Map.Map<Nat, CustomMusicOrder>;
    orderState : { var nextOrderId : Nat };
    contentState : { var landing : LandingContent; var siteSettings : SiteSettings };
    var stripeConfiguration : ?StripeConfiguration;
  };

  public func migration(old : OldActor) : NewActor {
    {
      accessControlState = old.accessControlState;
      tracks = old.tracks;
      trackState = old.trackState;
      licenseTiers = old.licenseTiers;
      tierState = old.tierState;
      orders = old.orders;
      orderState = old.orderState;
      contentState = old.contentState;
      var stripeConfiguration = old.stripeConfiguration;
    };
  };
};
