import Map "mo:core/Map";
import OrderTypes "../types/orders";
import CommonTypes "../types/common";
import Time "mo:core/Time";

module {
  public func listOrders(
    orders : Map.Map<CommonTypes.OrderId, OrderTypes.CustomMusicOrder>
  ) : [OrderTypes.CustomMusicOrder] {
    orders.values().toArray();
  };

  public func getOrder(
    orders : Map.Map<CommonTypes.OrderId, OrderTypes.CustomMusicOrder>,
    id : CommonTypes.OrderId
  ) : ?OrderTypes.CustomMusicOrder {
    orders.get(id);
  };

  public func createOrder(
    orders : Map.Map<CommonTypes.OrderId, OrderTypes.CustomMusicOrder>,
    state : { var nextOrderId : CommonTypes.OrderId },
    input : OrderTypes.CustomMusicOrderInput
  ) : OrderTypes.CustomMusicOrder {
    let id = state.nextOrderId;
    state.nextOrderId += 1;
    let order : OrderTypes.CustomMusicOrder = {
      id;
      customerEmail = input.customerEmail;
      projectType = input.projectType;
      genrePreference = input.genrePreference;
      styleDescription = input.styleDescription;
      status = #pending;
      createdAt = Time.now();
    };
    orders.add(id, order);
    order;
  };

  public func updateOrderStatus(
    orders : Map.Map<CommonTypes.OrderId, OrderTypes.CustomMusicOrder>,
    id : CommonTypes.OrderId,
    status : OrderTypes.OrderStatus
  ) : ?OrderTypes.CustomMusicOrder {
    switch (orders.get(id)) {
      case null { null };
      case (?order) {
        let updated = { order with status };
        orders.add(id, updated);
        ?updated;
      };
    };
  };
};
