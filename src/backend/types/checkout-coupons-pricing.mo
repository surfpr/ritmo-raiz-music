import CommonTypes "common";
import TrackTypes "tracks";

module {
  public type CouponId = Nat;

  public type DiscountType = {
    #percentage;
    #fixed;
  };

  public type Coupon = {
    id : CouponId;
    code : Text;
    discountType : DiscountType;
    amount : Nat; // percentage (0-100) or fixed amount in cents
    isActive : Bool;
  };

  public type CouponInput = {
    code : Text;
    discountType : DiscountType;
    amount : Nat;
    isActive : Bool;
  };

  /// A single cart entry: either a track licensed under a tier, or custom music.
  public type CartItem = {
    #track : { trackId : CommonTypes.TrackId; licenseTierId : TrackTypes.LicenseTierId };
    #customMusic : {};
  };

  /// One Stripe line item, priced from the CURRENT admin-set prices.
  public type CheckoutLineItem = {
    productName : Text;
    productDescription : Text;
    priceInCents : Nat;
    quantity : Nat;
  };

  public type CheckoutError = {
    #emptyCart;
    #invalidCoupon;
    #inactiveCoupon;
    #unknownTrack : CommonTypes.TrackId;
    #unknownLicenseTier : TrackTypes.LicenseTierId;
    #stripeNotConfigured;
    #stripeError : Text;
  };

  public type CheckoutRequest = {
    items : [CartItem];
    couponCode : ?Text;
    successUrl : Text;
    cancelUrl : Text;
  };

  public type CheckoutResult = {
    #ok : {
      sessionJson : Text; // raw Stripe Checkout Session JSON; frontend parses "url"
      subtotalCents : Nat;
      discountCents : Nat;
      totalCents : Nat;
    };
    #err : CheckoutError;
  };

  /// Result of applying a coupon to a whole-cart subtotal.
  public type CouponApplication = {
    coupon : Coupon;
    subtotalCents : Nat;
    discountCents : Nat;
    totalCents : Nat;
  };
};
