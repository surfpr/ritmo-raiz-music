import CommonTypes "common";

module {
  /// Period selector for analytics queries
  public type AnalyticsPeriod = {
    #daily;
    #weekly;
    #monthly;
    #allTime;
  };

  /// Immutable record of one completed sale
  public type SaleRecord = {
    id : Nat;
    trackId : ?Nat;
    licenseTierId : ?Nat;
    isCustomMusic : Bool;
    amountCents : Nat;
    customerEmail : Text;
    trackTitle : Text;
    licenseTierName : Text;
    createdAt : CommonTypes.Timestamp;
  };

  /// Aggregated summary for a given period
  public type SalesSummary = {
    totalRevenueCents : Nat;
    unitsSold : Nat;
    avgOrderCents : Nat;
    trackSales : Nat;
    customMusicSales : Nat;
  };

  /// One entry in the top-tracks leaderboard
  public type TopTrack = {
    trackId : Nat;
    trackTitle : Text;
    unitsSold : Nat;
    totalRevenueCents : Nat;
  };

  /// Flat row for CSV export
  public type AnalyticsRow = {
    date : Text;
    trackTitle : Text;
    licenseTierName : Text;
    amountCents : Nat;
    customerEmail : Text;
    isCustomMusic : Bool;
  };
};
