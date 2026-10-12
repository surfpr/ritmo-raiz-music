import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type Timestamp = Int;
  public type TrackId = Nat;
  public type OrderId = Nat;

  public type Language = { #es; #en };

  public type BilingualText = {
    es : Text;
    en : Text;
  };

  public type ImageBlob = Storage.ExternalBlob;
  public type AudioBlob = Storage.ExternalBlob;
};
