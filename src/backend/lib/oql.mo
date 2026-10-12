import OQL "mo:caffeineai-oql";
import OrderTypes "../types/orders";
import CheckoutTypes "../types/checkout-coupons-pricing";

module {
  /// Convert an optional Text to a single OQL.Value, using "" as the
  /// sentinel for null so the reported schema type stays stable.
  public func optText(v : ?Text) : OQL.Value {
    switch (v) {
      case (?t) { #text(t) };
      case null { #text("") };
    };
  };

  /// Convert an optional Nat to a single OQL.Value, using 0 as the
  /// sentinel for null so the reported schema type stays stable.
  public func optNat(v : ?Nat) : OQL.Value {
    switch (v) {
      case (?n) { #nat(n) };
      case null { #nat(0) };
    };
  };

  /// Convert an order status variant to its text tag.
  public func orderStatus(s : OrderTypes.OrderStatus) : OQL.Value {
    #text(
      switch (s) {
        case (#pending) "pending";
        case (#inProgress) "inProgress";
        case (#completed) "completed";
      }
    );
  };

  /// Convert a coupon discount type variant to its text tag.
  public func couponDiscountType(d : CheckoutTypes.DiscountType) : OQL.Value {
    #text(
      switch (d) {
        case (#percentage) "percentage";
        case (#fixed) "fixed";
      }
    );
  };
};
