import Map "mo:core/Map";

// Consolidation migration: upgrades 3-field LicenseTier (id, name, priceUsd)
// to 4-field (id, name, description, priceUsd) and seeds default tiers.
// OldActor matches 20260528_120000 NewActor (pure passthrough of InitState shape).
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
  // 3-field — matches 120000 NewActor (the deployed shape from InitState)
  type OldLicenseTier = {
    id : Nat;
    name : BilingualText;
    priceUsd : Nat;
  };
  // 4-field — matches current main.mo / types/tracks.mo
  type NewLicenseTier = {
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

  // OldActor = 120000 NewActor (3-field LicenseTier, Principal-keyed roles)
  type OldActor = {
    accessControlState : AccessControlState;
    tracks : Map.Map<Nat, Track>;
    trackState : { var nextTrackId : Nat };
    licenseTiers : Map.Map<Nat, OldLicenseTier>;
    tierState : { var nextTierId : Nat };
    orders : Map.Map<Nat, CustomMusicOrder>;
    orderState : { var nextOrderId : Nat };
    contentState : { var landing : LandingContent; var siteSettings : SiteSettings };
    var stripeConfiguration : ?StripeConfiguration;
  };

  // NewActor = 4-field LicenseTier — matches current main.mo actor state
  type NewActor = {
    accessControlState : AccessControlState;
    tracks : Map.Map<Nat, Track>;
    trackState : { var nextTrackId : Nat };
    licenseTiers : Map.Map<Nat, NewLicenseTier>;
    tierState : { var nextTierId : Nat };
    orders : Map.Map<Nat, CustomMusicOrder>;
    orderState : { var nextOrderId : Nat };
    contentState : { var landing : LandingContent; var siteSettings : SiteSettings };
    var stripeConfiguration : ?StripeConfiguration;
  };

  func descriptionForTier(tier : OldLicenseTier) : BilingualText {
    if (tier.id == 1) {
      {
        en = "For individual, non-commercial use only. Ideal for personal projects, school assignments, or private content that is not monetized. Does not include rights for public broadcast, advertising, or commercial distribution.";
        es = "Solo para uso individual y no comercial. Ideal para proyectos personales, tareas escolares o contenido privado no monetizado. No incluye derechos para transmisión pública, publicidad ni distribución comercial.";
      };
    } else if (tier.id == 2) {
      {
        en = "For businesses, content creators, and professionals using music in monetized or publicly distributed content — including YouTube videos, social media ads, podcasts, corporate presentations, and streaming content. Covers single-project commercial use.";
        es = "Para empresas, creadores de contenido y profesionales que usan música en contenido monetizado o distribuido públicamente: videos de YouTube, anuncios en redes sociales, podcasts, presentaciones corporativas y contenido en streaming. Cubre uso comercial de un solo proyecto.";
      };
    } else if (tier.id == 3) {
      {
        en = "Full broadcast and sync rights for large-scale commercial use — TV commercials, films, radio, call centers, national advertising campaigns, and unlimited distribution. Includes a downloadable PDF License Certificate for legal documentation. Best for agencies, production companies, and corporations.";
        es = "Derechos completos de broadcast y sincronización para uso comercial a gran escala: comerciales de TV, películas, radio, centros de llamadas, campañas publicitarias nacionales y distribución ilimitada. Incluye un Certificado de Licencia en PDF descargable. Ideal para agencias, productoras y corporaciones.";
      };
    } else {
      { en = ""; es = "" };
    };
  };

  public func migration(old : OldActor) : NewActor {
    let newTiers = old.licenseTiers.map<Nat, OldLicenseTier, NewLicenseTier>(
      func(_id, tier) {
        { tier with description = descriptionForTier(tier) };
      }
    );

    // Seed default tiers if the store starts with none
    let finalTierState = old.tierState;
    if (newTiers.size() == 0) {
      newTiers.add(1, {
        id = 1;
        name = { en = "Personal License"; es = "Licencia Personal" };
        description = {
          en = "For individual, non-commercial use only. Ideal for personal projects, school assignments, or private content that is not monetized. Does not include rights for public broadcast, advertising, or commercial distribution.";
          es = "Solo para uso individual y no comercial. Ideal para proyectos personales, tareas escolares o contenido privado no monetizado. No incluye derechos para transmisión pública, publicidad ni distribución comercial.";
        };
        priceUsd = 499;
      });
      newTiers.add(2, {
        id = 2;
        name = { en = "Commercial License"; es = "Licencia Comercial" };
        description = {
          en = "For businesses, content creators, and professionals using music in monetized or publicly distributed content — including YouTube videos, social media ads, podcasts, corporate presentations, and streaming content. Covers single-project commercial use.";
          es = "Para empresas, creadores de contenido y profesionales que usan música en contenido monetizado o distribuido públicamente: videos de YouTube, anuncios en redes sociales, podcasts, presentaciones corporativas y contenido en streaming. Cubre uso comercial de un solo proyecto.";
        };
        priceUsd = 2999;
      });
      newTiers.add(3, {
        id = 3;
        name = { en = "Enterprise / Broadcast License"; es = "Licencia Empresarial / Broadcast" };
        description = {
          en = "Full broadcast and sync rights for large-scale commercial use — TV commercials, films, radio, call centers, national advertising campaigns, and unlimited distribution. Includes a downloadable PDF License Certificate for legal documentation. Best for agencies, production companies, and corporations.";
          es = "Derechos completos de broadcast y sincronización para uso comercial a gran escala: comerciales de TV, películas, radio, centros de llamadas, campañas publicitarias nacionales y distribución ilimitada. Incluye un Certificado de Licencia en PDF descargable. Ideal para agencias, productoras y corporaciones.";
        };
        priceUsd = 9999;
      });
      finalTierState.nextTierId := 4;
    };

    {
      accessControlState = old.accessControlState;
      tracks = old.tracks;
      trackState = old.trackState;
      licenseTiers = newTiers;
      tierState = finalTierState;
      orders = old.orders;
      orderState = old.orderState;
      contentState = old.contentState;
      var stripeConfiguration = old.stripeConfiguration;
    };
  };
};
