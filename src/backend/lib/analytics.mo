import Debug "mo:core/Debug";
import List "mo:core/List";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Map "mo:core/Map";
import AnalyticsTypes "../types/analytics";
import CommonTypes "../types/common";
import Iter "mo:core/Iter";
import Array "mo:core/Array";

module {
  public type SaleRecord    = AnalyticsTypes.SaleRecord;
  public type AnalyticsPeriod = AnalyticsTypes.AnalyticsPeriod;
  public type SalesSummary  = AnalyticsTypes.SalesSummary;
  public type TopTrack      = AnalyticsTypes.TopTrack;
  public type AnalyticsRow  = AnalyticsTypes.AnalyticsRow;

  // ---------------------------------------------------------------------------
  // Period boundary helpers
  // ---------------------------------------------------------------------------

  /// Returns the earliest timestamp (nanoseconds) included in `period`.
  /// #allTime returns 0 so every record matches.
  func periodStart(period : AnalyticsPeriod) : Int {
    let now : Int = Time.now();
    switch (period) {
      case (#daily)   { now - 86_400_000_000_000 };
      case (#weekly)  { now - 7 * 86_400_000_000_000 };
      case (#monthly) { now - 30 * 86_400_000_000_000 };
      case (#allTime) { 0 };
    };
  };

  /// Converts nanosecond timestamp to a YYYY-MM-DD text string (UTC).
  func timestampToDate(ts : Int) : Text {
    let secs : Int = ts / 1_000_000_000;
    let days : Int = secs / 86_400;
    // Zeller-based date calculation (proleptic Gregorian)
    let z : Int = days + 719468;
    let era : Int = (if (z >= 0) z else z - 146096) / 146097;
    let doe : Int = z - era * 146097;
    let yoe : Int = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y : Int = yoe + era * 400;
    let doy : Int = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp : Int = (5 * doy + 2) / 153;
    let d : Int = doy - (153 * mp + 2) / 5 + 1;
    let m : Int = mp + (if (mp < 10) 3 else -9);
    let yr : Int = y + (if (m <= 2) 1 else 0);
    func pad(n : Int) : Text {
      if (n < 10) { "0" # n.toText() } else { n.toText() };
    };
    yr.toText() # "-" # pad(m) # "-" # pad(d);
  };

  // ---------------------------------------------------------------------------
  // State helpers
  // ---------------------------------------------------------------------------

  /// Append a new SaleRecord to the list and advance nextSaleId.
  public func recordSale(
    sales : List.List<SaleRecord>,
    state : { var nextSaleId : Nat },
    trackId : ?Nat,
    licenseTierId : ?Nat,
    isCustomMusic : Bool,
    amountCents : Nat,
    customerEmail : Text,
    trackTitle : Text,
    licenseTierName : Text,
  ) : () {
    let record : SaleRecord = {
      id            = state.nextSaleId;
      trackId;
      licenseTierId;
      isCustomMusic;
      amountCents;
      customerEmail;
      trackTitle;
      licenseTierName;
      createdAt     = Time.now();
    };
    sales.add(record);
    state.nextSaleId += 1;
  };

  // ---------------------------------------------------------------------------
  // Query helpers
  // ---------------------------------------------------------------------------

  /// Build a filtered array of sales within the given period.
  func salesInPeriod(sales : List.List<SaleRecord>, period : AnalyticsPeriod) : [SaleRecord] {
    let cutoff = periodStart(period);
    let filtered = sales.filter(func(s : SaleRecord) : Bool { s.createdAt >= cutoff });
    filtered.toArray();
  };

  public func getSalesSummary(
    sales : List.List<SaleRecord>,
    period : AnalyticsPeriod,
  ) : SalesSummary {
    let subset = salesInPeriod(sales, period);
    var totalRevenueCents : Nat = 0;
    var trackSales : Nat = 0;
    var customMusicSales : Nat = 0;
    for (s in subset.vals()) {
      totalRevenueCents += s.amountCents;
      if (s.isCustomMusic) { customMusicSales += 1 } else { trackSales += 1 };
    };
    let unitsSold = subset.size();
    let avgOrderCents : Nat = if (unitsSold == 0) 0 else totalRevenueCents / unitsSold;
    { totalRevenueCents; unitsSold; avgOrderCents; trackSales; customMusicSales };
  };

  public func getTopTracks(
    sales : List.List<SaleRecord>,
    limit : Nat,
  ) : [TopTrack] {
    // Aggregate per trackId
    let agg = Map.empty<Nat, { var unitsSold : Nat; var totalRevenueCents : Nat; trackTitle : Text }>();
    for (s in sales.toArray().vals()) {
      switch (s.trackId) {
        case (null) {};
        case (?tid) {
          switch (agg.get(tid)) {
            case (null) {
              agg.add(tid, { var unitsSold = 1; var totalRevenueCents = s.amountCents; trackTitle = s.trackTitle });
            };
            case (?entry) {
              entry.unitsSold += 1;
              entry.totalRevenueCents += s.amountCents;
            };
          };
        };
      };
    };
    // Convert to array and sort descending by unitsSold
    let arr : [TopTrack] = agg.entries().map(
        func((tid, e) : (Nat, { var unitsSold : Nat; var totalRevenueCents : Nat; trackTitle : Text })) : TopTrack {
          { trackId = tid; trackTitle = e.trackTitle; unitsSold = e.unitsSold; totalRevenueCents = e.totalRevenueCents };
        }
      ).toArray();
    let sorted = arr.sort(func(a, b) { Nat.compare(b.unitsSold, a.unitsSold) });
    if (sorted.size() <= limit) {
      sorted;
    } else {
      Array.tabulate(limit, func i { sorted[i] });
    };
  };

  public func getAnalyticsRows(
    sales : List.List<SaleRecord>,
    period : AnalyticsPeriod,
  ) : [AnalyticsRow] {
    let subset = salesInPeriod(sales, period);
    subset.map(
      func(s) {
        {
          date            = timestampToDate(s.createdAt);
          trackTitle      = s.trackTitle;
          licenseTierName = s.licenseTierName;
          amountCents     = s.amountCents;
          customerEmail   = s.customerEmail;
          isCustomMusic   = s.isCustomMusic;
        };
      }
    );
  };
};
