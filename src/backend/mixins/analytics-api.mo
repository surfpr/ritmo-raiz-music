import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import AnalyticsTypes "../types/analytics";
import AnalyticsLib "../lib/analytics";

mixin (
  sales : List.List<AnalyticsLib.SaleRecord>,
  analyticsState : { var nextSaleId : Nat },
) {
  /// Record a completed sale (called internally after Stripe confirmation)
  public shared func recordSale(
    trackId : ?Nat,
    licenseTierId : ?Nat,
    isCustomMusic : Bool,
    amountCents : Nat,
    customerEmail : Text,
    trackTitle : Text,
    licenseTierName : Text,
  ) : async () {
    AnalyticsLib.recordSale(
      sales,
      analyticsState,
      trackId,
      licenseTierId,
      isCustomMusic,
      amountCents,
      customerEmail,
      trackTitle,
      licenseTierName,
    );
  };

  /// Query aggregated sales summary for the given period
  public query func getSalesSummary(period : AnalyticsTypes.AnalyticsPeriod) : async AnalyticsTypes.SalesSummary {
    AnalyticsLib.getSalesSummary(sales, period);
  };

  /// Query top N tracks by units sold (across all time)
  public query func getTopTracks(limit : Nat) : async [AnalyticsTypes.TopTrack] {
    AnalyticsLib.getTopTracks(sales, limit);
  };

  /// Query flat rows for CSV export, filtered by period
  public query func getAnalyticsRows(period : AnalyticsTypes.AnalyticsPeriod) : async [AnalyticsTypes.AnalyticsRow] {
    AnalyticsLib.getAnalyticsRows(sales, period);
  };

  /// Export sales data as CSV text
  public query func exportSalesCsv(period : AnalyticsTypes.AnalyticsPeriod) : async Text {
    let rows = AnalyticsLib.getAnalyticsRows(sales, period);
    let header = "Date,Track Title,License Tier,Amount (USD),Customer Email,Type";
    let lines = List.empty<Text>();
    lines.add(header);
    for (row in rows.vals()) {
      let dollars = row.amountCents / 100;
      let cents = row.amountCents % 100;
      let centsText = if (cents < 10) { "0" # cents.toText() } else { cents.toText() };
      let amount = dollars.toText() # "." # centsText;
      let rowType = if (row.isCustomMusic) { "Custom Music" } else { "Track License" };
      let line =
        row.date # "," #
        "\"" # row.trackTitle # "\"" # "," #
        "\"" # row.licenseTierName # "\"" # "," #
        amount # "," #
        row.customerEmail # "," #
        rowType;
      lines.add(line);
    };
    lines.values().join("\n");
  };
};
