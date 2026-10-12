import Map "mo:core/Map";
import List "mo:core/List";
import Result "mo:core/Result";
import Types "../types/checkout-coupons-pricing";
import TrackTypes "../types/tracks";
import CommonTypes "../types/common";

module {
  /// Safe subtraction that never traps: returns 0 when `b > a`.
  func safeSub(a : Nat, b : Nat) : Nat {
    if (b > a) { 0 } else { a - b };
  };

  /// Find a coupon by code (case-insensitive).
  public func findCoupon(
    coupons : Map.Map<Types.CouponId, Types.Coupon>,
    code : Text,
  ) : ?Types.Coupon {
    coupons.values().toArray().find(func c = c.code.toLower() == code.toLower());
  };

  /// Validate a coupon code against the stored coupons and compute the
  /// whole-cart discount for the given subtotal. Returns null when the code is
  /// unknown or the coupon is inactive.
  public func applyCoupon(
    coupons : Map.Map<Types.CouponId, Types.Coupon>,
    code : Text,
    subtotalCents : Nat,
  ) : ?Types.CouponApplication {
    switch (findCoupon(coupons, code)) {
      case (null) { null };
      case (?c) {
        if (not c.isActive) {
          null;
        } else {
          let discount = computeDiscount(c, subtotalCents);
          ?{
            coupon = c;
            subtotalCents;
            discountCents = discount;
            totalCents = safeSub(subtotalCents, discount);
          };
        };
      };
    };
  };

  /// Compute the discount amount in cents for a coupon against a subtotal.
  /// Percentage coupons discount subtotal * amount / 100 (clamped to the
  /// subtotal); fixed coupons discount min(amount, subtotal).
  public func computeDiscount(coupon : Types.Coupon, subtotalCents : Nat) : Nat {
    switch (coupon.discountType) {
      case (#percentage) {
        let raw = subtotalCents * coupon.amount / 100;
        if (raw > subtotalCents) { subtotalCents } else { raw };
      };
      case (#fixed) {
        if (coupon.amount < subtotalCents) { coupon.amount } else { subtotalCents };
      };
    };
  };

  /// Resolve each cart entry against the CURRENT admin-set license tier and
  /// custom music prices into Stripe line items, one per entry.
  public func buildLineItems(
    items : [Types.CartItem],
    licenseTiers : Map.Map<TrackTypes.LicenseTierId, TrackTypes.LicenseTier>,
    tracks : Map.Map<CommonTypes.TrackId, TrackTypes.Track>,
    customMusicPriceCents : Nat,
  ) : Result.Result<[Types.CheckoutLineItem], Types.CheckoutError> {
    let result = List.empty<Types.CheckoutLineItem>();
    for (item in items.values()) {
      switch (item) {
        case (#track entry) {
          switch (tracks.get(entry.trackId)) {
            case (null) { return #err(#unknownTrack(entry.trackId)) };
            case (?track) {
              switch (licenseTiers.get(entry.licenseTierId)) {
                case (null) { return #err(#unknownLicenseTier(entry.licenseTierId)) };
                case (?tier) {
                  result.add({
                    productName = track.title.en;
                    productDescription = tier.name.en;
                    priceInCents = tier.priceUsd;
                    quantity = 1;
                  });
                };
              };
            };
          };
        };
        case (#customMusic _) {
          result.add({
            productName = "Custom Music";
            productDescription = "Custom music production";
            priceInCents = customMusicPriceCents;
            quantity = 1;
          });
        };
      };
    };
    #ok(result.toArray());
  };

  /// Sum the line items and apply an optional coupon to produce the final
  /// subtotal, discount, and total.
  public func computeTotals(
    lineItems : [Types.CheckoutLineItem],
    coupon : ?Types.Coupon,
  ) : { subtotalCents : Nat; discountCents : Nat; totalCents : Nat } {
    var subtotal : Nat = 0;
    for (li in lineItems.values()) {
      subtotal += li.priceInCents * li.quantity;
    };
    switch (coupon) {
      case (null) { { subtotalCents = subtotal; discountCents = 0; totalCents = subtotal } };
      case (?c) {
        let discount = computeDiscount(c, subtotal);
        { subtotalCents = subtotal; discountCents = discount; totalCents = safeSub(subtotal, discount) };
      };
    };
  };
};
