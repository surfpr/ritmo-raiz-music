import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Stripe "mo:caffeineai-stripe/stripe";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Types "../types/checkout-coupons-pricing";
import TrackTypes "../types/tracks";
import ContentTypes "../types/content";
import AnalyticsTypes "../types/analytics";
import CommonTypes "../types/common";
import CheckoutLib "../lib/checkout-coupons-pricing";
import AnalyticsLib "../lib/analytics";

mixin (
  accessControlState : AccessControl.AccessControlState,
  coupons : Map.Map<Types.CouponId, Types.Coupon>,
  couponState : { var nextCouponId : Types.CouponId },
  licenseTiers : Map.Map<TrackTypes.LicenseTierId, TrackTypes.LicenseTier>,
  tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>,
  contentState : { var landing : ContentTypes.LandingContent; var siteSettings : ContentTypes.SiteSettings },
  sales : List.List<AnalyticsTypes.SaleRecord>,
  analyticsState : { var nextSaleId : Nat },
  stripeConfig : { var configuration : ?Stripe.StripeConfiguration },
) {
  // ---------------------------------------------------------------------------
  // Coupon CRUD (admin-guarded)
  // ---------------------------------------------------------------------------

  /// Admin: list all coupons.
  public query func listCoupons() : async [Types.Coupon] {
    coupons.values().toArray();
  };

  /// Admin: create a coupon.
  public shared ({ caller }) func createCoupon(input : Types.CouponInput) : async Types.Coupon {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can create coupons");
    };
    let id = couponState.nextCouponId;
    couponState.nextCouponId += 1;
    let coupon : Types.Coupon = {
      id;
      code = input.code.toLower();
      discountType = input.discountType;
      amount = input.amount;
      isActive = input.isActive;
    };
    coupons.add(id, coupon);
    coupon;
  };

  /// Admin: update a coupon.
  public shared ({ caller }) func updateCoupon(id : Types.CouponId, input : Types.CouponInput) : async Types.Coupon {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update coupons");
    };
    let coupon : Types.Coupon = {
      id;
      code = input.code.toLower();
      discountType = input.discountType;
      amount = input.amount;
      isActive = input.isActive;
    };
    coupons.add(id, coupon);
    coupon;
  };

  /// Admin: delete a coupon.
  public shared ({ caller }) func deleteCoupon(id : Types.CouponId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete coupons");
    };
    coupons.remove(id);
  };

  // ---------------------------------------------------------------------------
  // Public coupon validation
  // ---------------------------------------------------------------------------

  /// Public: validate a coupon code and return it when active.
  public query func validateCoupon(code : Text) : async ?Types.Coupon {
    switch (CheckoutLib.findCoupon(coupons, code)) {
      case (?c) { if (c.isActive) { ?c } else { null } };
      case null { null };
    };
  };

  // ---------------------------------------------------------------------------
  // Stripe helpers. The public Stripe API surface (isStripeConfigured,
  // setStripeConfiguration, getStripeSessionStatus, createCheckoutSession,
  // transform) is declared directly in main.mo because the caffeineai-stripe
  // lint requires those functions as direct actor declarations.
  // ---------------------------------------------------------------------------

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    stripeConfig.configuration ?? Runtime.trap("Stripe needs to be first configured");
  };

  public query func transformOutcall(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  /// Distribute a whole-cart discount across line items proportionally by
  /// price, rounding to whole cents and adjusting the last item so the sum of
  /// the discounted prices equals exactly the discounted total. Stripe has no
  /// per-line discount, so the discount is baked into the line item prices.
  func applyDiscountToLineItems(
    lineItems : [Types.CheckoutLineItem],
    discountCents : Nat,
    subtotalCents : Nat,
  ) : [Types.CheckoutLineItem] {
    if (discountCents == 0 or subtotalCents == 0) {
      return lineItems;
    };
    let n = lineItems.size();
    if (n == 0) { return lineItems };
    let discounted : [Types.CheckoutLineItem] = Array.tabulate(n, func i {
      let li = lineItems[i];
      let share = li.priceInCents * discountCents / subtotalCents;
      let discountedPrice = if (share > li.priceInCents) { 0 } else { li.priceInCents - share };
      { li with priceInCents = discountedPrice };
    });
    var sum : Nat = 0;
    for (li in discounted.values()) { sum += li.priceInCents };
    let targetTotal = if (subtotalCents > discountCents) { subtotalCents - discountCents } else { 0 };
    if (sum == targetTotal) { return discounted };
    let last = discounted[n - 1];
    let diff = if (sum > targetTotal) { sum - targetTotal } else { targetTotal - sum };
    let adjustedPrice = if (sum > targetTotal) {
      if (diff > last.priceInCents) { 0 } else { last.priceInCents - diff };
    } else {
      last.priceInCents + diff;
    };
    let adjustedLast = { last with priceInCents = adjustedPrice };
    discounted.mapEntries(func (li, i) {
      if (i == n - 1) { adjustedLast } else { li };
    });
  };
  // ---------------------------------------------------------------------------
  // Checkout orchestration
  // ---------------------------------------------------------------------------
  /// Public: build a Checkout Session from cart line items (track + license
  /// tier, or custom music), priced from the CURRENT admin-set prices, applying
  /// any coupon to the whole cart total. Returns the session JSON plus the
  /// subtotal/discount/total.
  public shared ({ caller }) func checkout(request : Types.CheckoutRequest) : async Types.CheckoutResult {
    if (request.items.size() == 0) {
      return #err(#emptyCart);
    };
    switch (CheckoutLib.buildLineItems(request.items, licenseTiers, tracks, contentState.siteSettings.customMusicPriceUsd)) {
      case (#err e) { return #err(e) };
      case (#ok lineItems) {
        // Resolve the coupon (if any) and distinguish invalid vs inactive.
        var coupon : ?Types.Coupon = null;
        switch (request.couponCode) {
          case (null) {};
          case (?code) {
            switch (CheckoutLib.findCoupon(coupons, code)) {
              case (null) { return #err(#invalidCoupon) };
              case (?c) {
                if (not c.isActive) { return #err(#inactiveCoupon) };
                coupon := ?c;
              };
            };
          };
        };
        let totals = CheckoutLib.computeTotals(lineItems, coupon);
        // Stripe.ShoppingItem has no discount field and createCheckoutSession
        // has no discount parameter, so bake the whole-cart discount into the
        // line item prices actually charged. The returned totalCents equals the
        // sum of these discounted prices.
        let discountedItems = applyDiscountToLineItems(lineItems, totals.discountCents, totals.subtotalCents);
        let shoppingItems : [Stripe.ShoppingItem] = discountedItems.map(func li = {
          currency = "usd";
          productName = li.productName;
          productDescription = li.productDescription;
          priceInCents = li.priceInCents;
          quantity = li.quantity;
        });
        let sessionJson = await Stripe.createCheckoutSession(getStripeConfiguration(), caller, shoppingItems, request.successUrl, request.cancelUrl, transformOutcall);
        #ok({
          sessionJson;
          subtotalCents = totals.subtotalCents;
          discountCents = totals.discountCents;
          totalCents = totals.totalCents;
        });
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Sale recording on payment return
  // ---------------------------------------------------------------------------

  /// Public: record a completed sale after confirmed payment. The frontend
  /// clears the cart after a successful payment return.
  public shared ({ caller }) func recordCheckoutSale(
    trackId : ?CommonTypes.TrackId,
    licenseTierId : ?TrackTypes.LicenseTierId,
    isCustomMusic : Bool,
    amountCents : Nat,
    customerEmail : Text,
    trackTitle : Text,
    licenseTierName : Text,
  ) : async () {
    AnalyticsLib.recordSale(sales, analyticsState, trackId, licenseTierId, isCustomMusic, amountCents, customerEmail, trackTitle, licenseTierName);
  };
};
