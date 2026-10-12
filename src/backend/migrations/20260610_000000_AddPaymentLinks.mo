import Map "mo:core/Map";
import List "mo:core/List";

// Adds 4 payment link stable fields so Stripe Payment Links survive canister upgrades.
// OldActor = NewActor of 20260603_120000_AddStripeStableKeys.mo
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
    vocalType : ?Text;
    mood : ?Text;
    tempo : ?Text;
    recommendedUse : ?Text;
  };

  type LicenseTier = {
    id : Nat;
    name : BilingualText;
    description : BilingualText;
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
  type SaleRecord = {
    id : Nat;
    trackId : ?Nat;
    licenseTierId : ?Nat;
    isCustomMusic : Bool;
    amountCents : Nat;
    customerEmail : Text;
    trackTitle : Text;
    licenseTierName : Text;
    createdAt : Int;
  };

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
    sales : List.List<SaleRecord>;
    analyticsState : { var nextSaleId : Nat };
    var stripePublishableKeyStable : Text;
    var stripeSecretKeyStable : Text;
  };

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
    sales : List.List<SaleRecord>;
    analyticsState : { var nextSaleId : Nat };
    var stripePublishableKeyStable : Text;
    var stripeSecretKeyStable : Text;
    var paymentLinkPersonal : Text;
    var paymentLinkCommercial : Text;
    var paymentLinkEnterprise : Text;
    var paymentLinkCustomMusic : Text;
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
      sales = old.sales;
      analyticsState = old.analyticsState;
      var stripePublishableKeyStable = old.stripePublishableKeyStable;
      var stripeSecretKeyStable = old.stripeSecretKeyStable;
      var paymentLinkPersonal = "";
      var paymentLinkCommercial = "";
      var paymentLinkEnterprise = "";
      var paymentLinkCustomMusic = "";
    };
  };
};
