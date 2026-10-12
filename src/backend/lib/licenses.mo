import Map "mo:core/Map";
import TrackTypes "../types/tracks";

module {
  // Default tiers seeded on first deploy
  let defaultTiers : [TrackTypes.LicenseTier] = [
    {
      id = 1;
      name = { en = "Personal License"; es = "Licencia Personal" };
      description = {
        en = "For individual, non-commercial use only. Ideal for personal projects, school assignments, or private content that is not monetized. Does not include rights for public broadcast, advertising, or commercial distribution.";
        es = "Solo para uso individual y no comercial. Ideal para proyectos personales, tareas escolares o contenido privado no monetizado. No incluye derechos para transmisión pública, publicidad ni distribución comercial.";
      };
      priceUsd = 499; // $4.99
    },
    {
      id = 2;
      name = { en = "Commercial License"; es = "Licencia Comercial" };
      description = {
        en = "For businesses, content creators, and professionals using music in monetized or publicly distributed content — including YouTube videos, social media ads, podcasts, corporate presentations, and streaming content. Covers single-project commercial use.";
        es = "Para empresas, creadores de contenido y profesionales que usan música en contenido monetizado o distribuido públicamente: videos de YouTube, anuncios en redes sociales, podcasts, presentaciones corporativas y contenido en streaming. Cubre uso comercial de un solo proyecto.";
      };
      priceUsd = 2999; // $29.99
    },
    {
      id = 3;
      name = { en = "Enterprise / Broadcast License"; es = "Licencia Empresarial / Broadcast" };
      description = {
        en = "Full broadcast and sync rights for large-scale commercial use — TV commercials, films, radio, call centers, national advertising campaigns, and unlimited distribution. Includes a downloadable PDF License Certificate for legal documentation. Best for agencies, production companies, and corporations.";
        es = "Derechos completos de broadcast y sincronización para uso comercial a gran escala: comerciales de TV, películas, radio, centros de llamadas, campañas publicitarias nacionales y distribución ilimitada. Incluye un Certificado de Licencia en PDF descargable. Ideal para agencias, productoras y corporaciones.";
      };
      priceUsd = 9999; // $99.99
    },
  ];

  /// Seed default license tiers if none exist yet.
  public func seedDefaultTiers(
    tiers : Map.Map<TrackTypes.LicenseTierId, TrackTypes.LicenseTier>,
    state : { var nextTierId : TrackTypes.LicenseTierId },
  ) {
    if (tiers.size() == 0) {
      for (tier in defaultTiers.vals()) {
        tiers.add(tier.id, tier);
      };
      state.nextTierId := 4; // next id after 3 seeded tiers
    };
  };

  public func listLicenseTiers(
    tiers : Map.Map<TrackTypes.LicenseTierId, TrackTypes.LicenseTier>
  ) : [TrackTypes.LicenseTier] {
    tiers.values().toArray();
  };

  public func upsertLicenseTier(
    tiers : Map.Map<TrackTypes.LicenseTierId, TrackTypes.LicenseTier>,
    state : { var nextTierId : TrackTypes.LicenseTierId },
    tier : TrackTypes.LicenseTier
  ) : TrackTypes.LicenseTier {
    // If id == 0, assign a new id; otherwise update in place
    let finalTier : TrackTypes.LicenseTier = if (tier.id == 0) {
      let newId = state.nextTierId;
      state.nextTierId += 1;
      { tier with id = newId };
    } else {
      tier;
    };
    tiers.add(finalTier.id, finalTier);
    finalTier;
  };

  public func deleteLicenseTier(
    tiers : Map.Map<TrackTypes.LicenseTierId, TrackTypes.LicenseTier>,
    id : TrackTypes.LicenseTierId
  ) : Bool {
    if (tiers.containsKey(id)) {
      tiers.remove(id);
      true;
    } else {
      false;
    };
  };
};
