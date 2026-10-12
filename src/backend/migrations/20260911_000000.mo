import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";

// Adds stripePublishableKeyStable and stripeSecretKeyStable stable fields so the
// Stripe Publishable Key and Secret Key survive canister upgrades and the Admin
// can save and read them back.
// OldActor = NewActor of 20260908_000000.mo
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

  type DiscountType = { #percentage; #fixed };
  type Coupon = {
    id : Nat;
    code : Text;
    discountType : DiscountType;
    amount : Nat;
    isActive : Bool;
  };
  type StripeConfiguration = {
    secretKey : Text;
    allowedCountries : [Text];
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
    sales : List.List<SaleRecord>;
    analyticsState : { var nextSaleId : Nat };
    var paymentLinkPersonal : Text;
    var paymentLinkCommercial : Text;
    var paymentLinkEnterprise : Text;
    var paymentLinkCustomMusic : Text;
    coupons : Map.Map<Nat, Coupon>;
    couponState : { var nextCouponId : Nat };
    stripeConfig : { var configuration : ?StripeConfiguration };
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
    sales : List.List<SaleRecord>;
    analyticsState : { var nextSaleId : Nat };
    var paymentLinkPersonal : Text;
    var paymentLinkCommercial : Text;
    var paymentLinkEnterprise : Text;
    var paymentLinkCustomMusic : Text;
    coupons : Map.Map<Nat, Coupon>;
    couponState : { var nextCouponId : Nat };
    stripeConfig : { var configuration : ?StripeConfiguration };
    var stripePublishableKeyStable : Text;
    var stripeSecretKeyStable : Text;
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
      sales = old.sales;
      analyticsState = old.analyticsState;
      var paymentLinkPersonal = old.paymentLinkPersonal;
      var paymentLinkCommercial = old.paymentLinkCommercial;
      var paymentLinkEnterprise = old.paymentLinkEnterprise;
      var paymentLinkCustomMusic = old.paymentLinkCustomMusic;
      coupons = old.coupons;
      couponState = old.couponState;
      stripeConfig = old.stripeConfig;
      var stripePublishableKeyStable = "";
      var stripeSecretKeyStable = "";
    };
  };
}
