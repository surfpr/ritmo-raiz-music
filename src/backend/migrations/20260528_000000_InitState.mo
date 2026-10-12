import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  // OldActor is empty — this is the first migration
  type OldActor = {};

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

  let defaultLanding : LandingContent = {
    heroTitle = { es = "Ritmo Raíz Music"; en = "Ritmo Raíz Music" };
    heroSubtitle = { es = "Música Latina generada con IA"; en = "AI-Generated Latin Music" };
    servicesTitle = { es = "Nuestros Servicios"; en = "Our Services" };
    services = [];
    featuredTrackIds = [];
    newArrivalTrackIds = [];
    customMusicCtaTitle = { es = "Música a tu medida"; en = "Custom Music for You" };
    customMusicCtaBody = { es = "Creamos tu canción en 24 horas."; en = "We create your song in 24 hours." };
    logoImage = null;
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty<Principal, UserRole>();
      };
      tracks = Map.empty<Nat, Track>();
      trackState = { var nextTrackId = 1 };
      licenseTiers = Map.empty<Nat, LicenseTier>();
      tierState = { var nextTierId = 1 };
      orders = Map.empty<Nat, CustomMusicOrder>();
      orderState = { var nextOrderId = 1 };
      contentState = {
        var landing = defaultLanding;
        var siteSettings = { customMusicPriceUsd = 49900 }; // $499.00 default
      };
      var stripeConfiguration = null;
    };
  };
};
