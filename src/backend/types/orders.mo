import CommonTypes "common";

module {
  public type OrderStatus = {
    #pending;
    #inProgress;
    #completed;
  };

  public type CustomMusicOrder = {
    id : CommonTypes.OrderId;
    customerEmail : Text;
    projectType : Text;
    genrePreference : Text;
    styleDescription : Text;
    status : OrderStatus;
    createdAt : CommonTypes.Timestamp;
  };

  public type CustomMusicOrderInput = {
    customerEmail : Text;
    projectType : Text;
    genrePreference : Text;
    styleDescription : Text;
  };
};
