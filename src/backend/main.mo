import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Runtime "mo:core/Runtime";

import TrackTypes "types/tracks";
import OrderTypes "types/orders";
import ContentTypes "types/content";
import CommonTypes "types/common";
import TracksMixin "mixins/tracks-api";
import LicensesMixin "mixins/licenses-api";
import OrdersMixin "mixins/orders-api";
import ContentMixin "mixins/content-api";
import AnalyticsTypes "types/analytics";
import AnalyticsMixin "mixins/analytics-api";
import List "mo:core/List";
import AnalyticsLib "lib/analytics";
import OQLMixin "mixins/oql-api";
import Stripe "mo:caffeineai-stripe/stripe";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import CheckoutTypes "types/checkout-coupons-pricing";
import CheckoutMixin "mixins/checkout-coupons-pricing-api";
import ApiDocMixin "mixins/api-doc";

actor {
  // --- Authorization ---
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState);

  // --- Object Storage ---
  include MixinObjectStorage();

  // --- Tracks ---
  let tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>;
  let trackState : { var nextTrackId : CommonTypes.TrackId };

  // --- License Tiers ---
  let licenseTiers : Map.Map<TrackTypes.LicenseTierId, TrackTypes.LicenseTier>;
  let tierState : { var nextTierId : TrackTypes.LicenseTierId };

  include TracksMixin(accessControlState, tracks, trackState, licenseTiers);
  include LicensesMixin(accessControlState, licenseTiers, tierState);

  // --- Custom Music Orders ---
  let orders : Map.Map<CommonTypes.OrderId, OrderTypes.CustomMusicOrder>;
  let orderState : { var nextOrderId : CommonTypes.OrderId };
  include OrdersMixin(accessControlState, orders, orderState);

  // --- Landing Content & Settings ---
  let contentState : { var landing : ContentTypes.LandingContent; var siteSettings : ContentTypes.SiteSettings };
  include ContentMixin(accessControlState, contentState);

  // --- Analytics ---
  let sales : List.List<AnalyticsTypes.SaleRecord>;
  let analyticsState : { var nextSaleId : Nat };
  include AnalyticsMixin(sales, analyticsState);

  // --- Checkout, Coupons & Pricing ---
  let coupons : Map.Map<CheckoutTypes.CouponId, CheckoutTypes.Coupon>;
  let couponState : { var nextCouponId : CheckoutTypes.CouponId };
  let stripeConfig : { var configuration : ?Stripe.StripeConfiguration };
  var stripePublishableKeyStable : Text;
  var stripeSecretKeyStable : Text;

  // --- OQL (Data Intelligence) ---
  include OQLMixin(tracks, licenseTiers, orders, sales, coupons, contentState);

  include CheckoutMixin(accessControlState, coupons, couponState, licenseTiers, tracks, contentState, sales, analyticsState, stripeConfig);

  // --- Behavioral API documentation ---
  include ApiDocMixin();

  // --- Stripe integration (declared directly to satisfy the caffeineai-stripe lint) ---
  /// Public query: whether a Stripe configuration has been set.
  public query func isStripeConfigured() : async Bool {
    stripeConfig.configuration != null;
  };

  /// Admin: set the store-wide Stripe configuration (one key for the whole store).
  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can configure Stripe");
    };
    stripeConfig.configuration := ?config;
  };

  /// Public query: return the stored Stripe Publishable Key and Secret Key.
  public query func getStripeKeys() : async { publishableKey : Text; secretKey : Text } {
    {
      publishableKey = stripePublishableKeyStable;
      secretKey = stripeSecretKeyStable;
    };
  };

  /// Admin: save the Stripe Publishable Key and Secret Key to stable vars.
  public shared ({ caller }) func setStripeKeys(keys : { publishableKey : Text; secretKey : Text }) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set Stripe keys");
    };
    stripePublishableKeyStable := keys.publishableKey;
    stripeSecretKeyStable := keys.secretKey;
  };

  /// Public: check the status of a Stripe Checkout Session after payment return.
  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    let config = stripeConfig.configuration ?? Runtime.trap("Stripe needs to be first configured");
    await Stripe.getSessionStatus(config, sessionId, transform);
  };

  /// Public: create a Stripe Checkout Session from pre-built ShoppingItems.
  /// Returns the raw Stripe JSON reply; the frontend parses the session URL.
  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    let config = stripeConfig.configuration ?? Runtime.trap("Stripe needs to be first configured");
    await Stripe.createCheckoutSession(config, caller, items, successUrl, cancelUrl, transform);
  };

  /// Public query: HTTP outcall transformation (required by the stripe extension).
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // --- Stripe Payment Links ---
  var paymentLinkPersonal : Text;
  var paymentLinkCommercial : Text;
  var paymentLinkEnterprise : Text;
  var paymentLinkCustomMusic : Text;

  /// Public query: return all 4 payment links.
  public query func getPaymentLinks() : async {
    personalLicenseLink : Text;
    commercialLicenseLink : Text;
    enterpriseLicenseLink : Text;
    customMusicLink : Text;
  } {
    {
      personalLicenseLink = paymentLinkPersonal;
      commercialLicenseLink = paymentLinkCommercial;
      enterpriseLicenseLink = paymentLinkEnterprise;
      customMusicLink = paymentLinkCustomMusic;
    };
  };

  /// Admin: save all 4 payment links to stable vars.
  public shared ({ caller }) func setPaymentLinks(
    personalLicenseLink : Text,
    commercialLicenseLink : Text,
    enterpriseLicenseLink : Text,
    customMusicLink : Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set payment links");
    };
    paymentLinkPersonal := personalLicenseLink;
    paymentLinkCommercial := commercialLicenseLink;
    paymentLinkEnterprise := enterpriseLicenseLink;
    paymentLinkCustomMusic := customMusicLink;
  };

  /// Record a completed sale from the frontend after Stripe confirms payment.
  /// trackId is the track's string ID, amount is in dollars (e.g. 29.99),
  /// currency is e.g. "usd", buyerPrincipal is the caller's principal text.
  /// Returns the new sale record's ID as Text.
  public shared ({ caller }) func recordSaleDirect(
    trackId : Text,
    trackTitle : Text,
    licenseType : Text,
    amountCents : Nat,
    currency : Text,
    buyerPrincipal : Text,
  ) : async Text {
    ignore currency;
    ignore buyerPrincipal;
    ignore trackId;
    let saleId = analyticsState.nextSaleId;
    AnalyticsLib.recordSale(
      sales,
      analyticsState,
      null,
      null,
      false,
      amountCents,
      caller.toText(),
      trackTitle,
      licenseType,
    );
    saleId.toText();
  };

  /// Returns all recorded purchases. Public query — no authentication required.
  public query func getAllPurchases() : async [AnalyticsTypes.SaleRecord] {
    sales.toArray();
  };
}
