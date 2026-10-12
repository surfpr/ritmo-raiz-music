import Map "mo:core/Map";
import List "mo:core/List";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import ListEntity "mo:caffeineai-oql/ListEntity";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import BoolValue "mo:caffeineai-oql/BoolValue";

import CommonTypes "../types/common";
import TrackTypes "../types/tracks";
import OrderTypes "../types/orders";
import AnalyticsTypes "../types/analytics";
import CheckoutTypes "../types/checkout-coupons-pricing";
import ContentTypes "../types/content";
import OQLLib "../lib/oql";

/// Exposes the persisted, queryable actor collections through the OQL
/// (Data Intelligence) `Expose` mixin. Every entity is `.controllerOnly()`
/// — private app data that the Data Intelligence agent reads as the
/// controller while end users never read it directly. Each entity seeds
/// schema discovery with `.sample(...)` so the schema materialises even
/// when the backing collection is empty.
mixin (
  tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>,
  licenseTiers : Map.Map<TrackTypes.LicenseTierId, TrackTypes.LicenseTier>,
  orders : Map.Map<CommonTypes.OrderId, OrderTypes.CustomMusicOrder>,
  sales : List.List<AnalyticsTypes.SaleRecord>,
  coupons : Map.Map<CheckoutTypes.CouponId, CheckoutTypes.Coupon>,
  contentState : { var landing : ContentTypes.LandingContent; var siteSettings : ContentTypes.SiteSettings },
) {
  /// Identity `_toRow` for payloads that already return an `OQL.Value` directly
  /// (e.g. `OQLLib.optText`, `OQLLib.orderStatus`, `OQLLib.optNat`).
  func _toRow(v : OQL.Value) : OQL.Value = v;

  include Expose({
    entities = [
      tracks.toEntityManual("track", "Track", "id")
        .sample({
          id = 0;
          title = { es = ""; en = "" };
          artist = "";
          genre = "";
          country = "";
          coverImage = Array.toBlob([]);
          audioFile = Array.toBlob([]);
          sampleStartSec = 0;
          sampleEndSec = 0;
          isFeatured = false;
          isNewArrival = false;
          createdAt = 0;
          vocalType = null;
          mood = null;
          tempo = null;
          recommendedUse = null;
        })
        .payload("id", func t = t.id)
        .payload("titleEs", func t = t.title.es)
        .payload("titleEn", func t = t.title.en)
        .payload("artist", func t = t.artist)
        .payload("genre", func t = t.genre)
        .payload("country", func t = t.country)
        .payload("sampleStartSec", func t = t.sampleStartSec)
        .payload("sampleEndSec", func t = t.sampleEndSec)
        .payload("isFeatured", func t = t.isFeatured)
        .payload("isNewArrival", func t = t.isNewArrival)
        .payload("createdAt", func t = t.createdAt)
        .payload("vocalType", func t = OQLLib.optText(t.vocalType))
        .payload("mood", func t = OQLLib.optText(t.mood))
        .payload("tempo", func t = OQLLib.optText(t.tempo))
        .payload("recommendedUse", func t = OQLLib.optText(t.recommendedUse))
        .controllerOnly()
        .build(),
      licenseTiers.toEntityManual("licenseTier", "LicenseTier", "id")
        .sample({
          id = 0;
          name = { es = ""; en = "" };
          description = { es = ""; en = "" };
          priceUsd = 0;
        })
        .payload("id", func t = t.id)
        .payload("nameEs", func t = t.name.es)
        .payload("nameEn", func t = t.name.en)
        .payload("descriptionEs", func t = t.description.es)
        .payload("descriptionEn", func t = t.description.en)
        .payload("priceUsd", func t = t.priceUsd)
        .controllerOnly()
        .build(),
      orders.toEntityManual("order", "CustomMusicOrder", "id")
        .sample({
          id = 0;
          customerEmail = "";
          projectType = "";
          genrePreference = "";
          styleDescription = "";
          status = #pending;
          createdAt = 0;
        })
        .payload("id", func o = o.id)
        .payload("customerEmail", func o = o.customerEmail)
        .payload("projectType", func o = o.projectType)
        .payload("genrePreference", func o = o.genrePreference)
        .payload("styleDescription", func o = o.styleDescription)
        .payload("status", func o = OQLLib.orderStatus(o.status))
        .payload("createdAt", func o = o.createdAt)
        .controllerOnly()
        .build(),
      OQL.Entity.manual<AnalyticsTypes.SaleRecord>(
        "sale",
        func () = sales.values(),
        "SaleRecord",
        "id",
      )
        .sample({
          id = 0;
          trackId = null;
          licenseTierId = null;
          isCustomMusic = false;
          amountCents = 0;
          customerEmail = "";
          trackTitle = "";
          licenseTierName = "";
          createdAt = 0;
        })
        .payload("id", func s = s.id)
        .payload("trackId", func s = OQLLib.optNat(s.trackId))
        .payload("licenseTierId", func s = OQLLib.optNat(s.licenseTierId))
        .payload("isCustomMusic", func s = s.isCustomMusic)
        .payload("amountCents", func s = s.amountCents)
        .payload("customerEmail", func s = s.customerEmail)
        .payload("trackTitle", func s = s.trackTitle)
        .payload("licenseTierName", func s = s.licenseTierName)
        .payload("createdAt", func s = s.createdAt)
        .controllerOnly()
        .build(),
      coupons.toEntityManual("coupon", "Coupon", "id")
        .sample({
          id = 0;
          code = "";
          discountType = #percentage;
          amount = 0;
          isActive = false;
        })
        .payload("id", func c = c.id)
        .payload("code", func c = c.code)
        .payload("discountType", func c = OQLLib.couponDiscountType(c.discountType))
        .payload("amount", func c = c.amount)
        .payload("isActive", func c = c.isActive)
        .controllerOnly()
        .build(),
      OQL.Entity.manual<ContentTypes.SiteSettings>(
        "siteSettings",
        func () = [contentState.siteSettings].values(),
        "SiteSettings",
        "id",
      )
        .sample({ customMusicPriceUsd = 0 })
        .payload("id", func _s = 0)
        .payload("customMusicPriceUsd", func s = s.customMusicPriceUsd)
        .controllerOnly()
        .build(),
      OQL.Entity.manual<ContentTypes.LandingContent>(
        "landingContent",
        func () = [contentState.landing].values(),
        "LandingContent",
        "id",
      )
        .sample({
          heroTitle = { es = ""; en = "" };
          heroSubtitle = { es = ""; en = "" };
          servicesTitle = { es = ""; en = "" };
          services = [];
          featuredTrackIds = [];
          newArrivalTrackIds = [];
          customMusicCtaTitle = { es = ""; en = "" };
          customMusicCtaBody = { es = ""; en = "" };
          logoImage = null;
        })
        .payload("id", func _c = 0)
        .payload("heroTitleEs", func c = c.heroTitle.es)
        .payload("heroTitleEn", func c = c.heroTitle.en)
        .payload("heroSubtitleEs", func c = c.heroSubtitle.es)
        .payload("heroSubtitleEn", func c = c.heroSubtitle.en)
        .payload("servicesTitleEs", func c = c.servicesTitle.es)
        .payload("servicesTitleEn", func c = c.servicesTitle.en)
        .payload("customMusicCtaTitleEs", func c = c.customMusicCtaTitle.es)
        .payload("customMusicCtaTitleEn", func c = c.customMusicCtaTitle.en)
        .payload("customMusicCtaBodyEs", func c = c.customMusicCtaBody.es)
        .payload("customMusicCtaBodyEn", func c = c.customMusicCtaBody.en)
        .payload("servicesCount", func c = c.services.size())
        .payload("featuredTrackCount", func c = c.featuredTrackIds.size())
        .payload("newArrivalTrackCount", func c = c.newArrivalTrackIds.size())
        .payload("hasLogo", func c = c.logoImage != null)
        .controllerOnly()
        .build(),
    ];
  });
};
