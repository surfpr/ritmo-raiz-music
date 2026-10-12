import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import OrderTypes "../types/orders";
import CommonTypes "../types/common";
import OrdersLib "../lib/orders";

mixin (
  accessControlState : AccessControl.AccessControlState,
  orders : Map.Map<CommonTypes.OrderId, OrderTypes.CustomMusicOrder>,
  orderState : { var nextOrderId : CommonTypes.OrderId },
) {
  /// Public: submit a custom music order
  public shared func createCustomMusicOrder(input : OrderTypes.CustomMusicOrderInput) : async OrderTypes.CustomMusicOrder {
    OrdersLib.createOrder(orders, orderState, input);
  };

  /// Admin: list all custom music orders
  public shared ({ caller }) func listCustomMusicOrders() : async [OrderTypes.CustomMusicOrder] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can list orders");
    };
    OrdersLib.listOrders(orders);
  };

  /// Admin: update order status
  public shared ({ caller }) func updateCustomOrderStatus(id : CommonTypes.OrderId, status : OrderTypes.OrderStatus) : async ?OrderTypes.CustomMusicOrder {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    OrdersLib.updateOrderStatus(orders, id, status);
  };
};
