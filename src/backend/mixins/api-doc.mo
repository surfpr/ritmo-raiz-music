/// Behavioral API documentation for the backend canister.
///
/// `getApiDoc` is a static, source-derived Markdown document describing the
/// public API surface: purpose, authentication, authorization, identity
/// derivation, units, encoding, lifecycle, polling, mutation retry safety,
/// errors, and non-obvious integration gotchas.
mixin () {
  /// Public query: return the backend's behavioral API documentation as Markdown.
  public query func getApiDoc() : async Text {
    "# Backend API — Music Licensing Store\n" #
    "\n" #
    "This canister backs a bilingual (ES/EN) music licensing storefront: it manages the\n" #
    "track catalogue, license tiers, custom-music orders, landing content and site\n" #
    "settings, sales analytics, coupons, and Stripe Checkout sessions. It also exposes\n" #
    "its persisted data to the Caffeine Data Intelligence agent through OQL.\n" #
    "\n" #
    "## Authentication and identity\n" #
    "\n" #
    "The app's frontend pins an Internet Identity derivation origin, published at\n" #
    "`/.well-known/ii-derivation-origin` when available. An agent that already holds the\n" #
    "user's Internet Identity authorization derives the correct per-app principal against\n" #
    "that origin, for example `icp identity link web <name> --app <host>`. Such a\n" #
    "delegation acts with the user's full authority in this app until it expires.\n" #
    "\n" #
    "Registration happens only when a caller signs in through the app's own frontend.\n" #
    "Before any role-guarded call (guarded queries included), a direct API caller must\n" #
    "call `_initializeAccessControl` once as a signed-in caller. The first initializer\n" #
    "becomes the **admin**; every subsequent caller becomes a regular **user**. A\n" #
    "principal that never signed in through the frontend is unregistered even when it\n" #
    "belongs to the app's owner, and a signed-in caller derived against a different\n" #
    "origin is a different principal than the one the frontend registered.\n" #
    "\n" #
    "An unregistered or anonymous caller on a guarded endpoint traps with a message of\n" #
    "the form `Unauthorized: Only admins can <action>` (for example\n" #
    "`Unauthorized: Only admins can add tracks`). Anonymous callers cannot register.\n" #
    "\n" #
    "## Units and encodings\n" #
    "\n" #
    "- **Prices are in US cents** (`priceUsd`, `amountCents`, `priceInCents`,\n" #
    "  `totalCents`, `discountCents`, `subtotalCents`). Divide by 100 for dollars.\n" #
    "  Coupon `amount` is either a percentage (0–100) for `#percentage` coupons or a\n" #
    "  fixed amount in cents for `#fixed` coupons.\n" #
    "- **Timestamps** (`createdAt`) are `Int` nanoseconds since the Unix epoch\n" #
    "  (`Time.now()`).\n" #
    "- **Identifiers** (`trackId`, `licenseTierId`, `orderId`, `couponId`, `saleId`)\n" #
    "  are `Nat` counters, assigned incrementally by the backend.\n" #
    "- **Optional values** are Candid options (`?Text`, `?Nat`). In OQL they are\n" #
    "  flattened to a sentinel (`\"\"` for text, `0` for numbers) so the schema type\n" #
    "  stays stable.\n" #
    "- **Variants** (`discountType`, `orderStatus`) are Candid variants; in OQL they\n" #
    "  are reported as their text tag (`percentage`/`fixed`, `pending`/`inProgress`/\n" #
    "  `completed`).\n" #
    "- **Bilingual text** is a record `{ es : Text; en : Text }`.\n" #
    "\n" #
    "## Public methods\n" #
    "\n" #
    "### Access control\n" #
    "\n" #
    "- `_initializeAccessControl() : async ()` — signed-in caller; first caller becomes\n" #
    "  admin, later callers become users. Required before any role-guarded call.\n" #
    "- `getCallerUserRole() : async UserRole` — query; returns the caller's role\n" #
    "  (`#admin`, `#user`, or `#guest`).\n" #
    "- `assignCallerUserRole(user : Principal, role : UserRole) : async ()` — admin only.\n" #
    "- `isCallerAdmin() : async Bool` — query.\n" #
    "\n" #
    "### Tracks\n" #
    "\n" #
    "- `listTracksPage(offset : Nat, limit : Nat) : async TrackSummaryPage` — public\n" #
    "  (update) call. Returns a page of lightweight `TrackSummary` items plus the total\n" #
    "  track count. Each `TrackSummary` carries direct object-storage URL strings\n" #
    "  (`coverImageUrl`, `audioSampleUrl`) instead of `ExternalBlob` blobs, so the\n" #
    "  generated bindgen wrapper does not download cover/audio bytes for every track on\n" #
    "  page load. `priceCents`/`licenseTierId` are derived from the lowest-priced\n" #
    "  license tier. This is the store grid's primary endpoint; page through all tracks\n" #
    "  with successive `(offset, limit)` pairs rather than calling `listTracks`.\n" #
    "- `listTracks() : async [Track]` — public query.\n" #
    "- `getTrack(id : Nat) : async ?Track` — public query.\n" #
    "- `listTracksByGenre(genre : Text) : async [Track]` — public query.\n" #
    "- `listTracksByCountry(country : Text) : async [Track]` — public query.\n" #
    "- `listFeaturedTracks() : async [Track]` — public query.\n" #
    "- `listNewArrivalTracks() : async [Track]` — public query.\n" #
    "- `filterTracks(genre, country, vocalType, mood, tempo, recommendedUse, priceRange\n" #
    "  : ?Text) : async [Track]` — public query. `priceRange` is accepted but ignored\n" #
    "  (price filtering is client-side).\n" #
    "- `addTrack(input : TrackInput) : async Track` — admin.\n" #
    "- `updateTrack(id : Nat, input : TrackInput) : async ?Track` — admin; `audioFile =\n" #
    "  null` keeps the existing audio.\n" #
    "- `deleteTrack(id : Nat) : async Bool` — admin.\n" #
    "- `bulkAddTracks(inputs : [TrackInput]) : async [Track]` — admin.\n" #
    "\n" #
    "### License tiers\n" #
    "\n" #
    "- `listLicenseTiers() : async [LicenseTier]` — public query.\n" #
    "- `upsertLicenseTier(tier : LicenseTier) : async LicenseTier` — admin; create or\n" #
    "  update by id.\n" #
    "- `deleteLicenseTier(id : Nat) : async Bool` — admin.\n" #
    "\n" #
    "### Custom music orders\n" #
    "\n" #
    "- `createCustomMusicOrder(input : CustomMusicOrderInput) : async CustomMusicOrder`\n" #
    "  — public.\n" #
    "- `listCustomMusicOrders() : async [CustomMusicOrder]` — admin.\n" #
    "- `updateCustomOrderStatus(id : Nat, status : OrderStatus) : async\n" #
    "  ?CustomMusicOrder` — admin.\n" #
    "\n" #
    "### Landing content & settings\n" #
    "\n" #
    "- `getLandingContent() : async LandingContent` — public query.\n" #
    "- `updateLandingContent(updated : LandingContent) : async ()` — admin.\n" #
    "- `getSiteSettings() : async SiteSettings` — public query.\n" #
    "- `updateSiteSettings(updated : SiteSettings) : async ()` — admin.\n" #
    "\n" #
    "### Analytics\n" #
    "\n" #
    "- `recordSale(trackId : ?Nat, licenseTierId : ?Nat, isCustomMusic : Bool,\n" #
    "  amountCents : Nat, customerEmail : Text, trackTitle : Text, licenseTierName :\n" #
    "  Text) : async ()` — public; records a completed sale.\n" #
    "- `getSalesSummary(period : AnalyticsPeriod) : async SalesSummary` — public query.\n" #
    "- `getTopTracks(limit : Nat) : async [TopTrack]` — public query.\n" #
    "- `getAnalyticsRows(period : AnalyticsPeriod) : async [AnalyticsRow]` — public query.\n" #
    "- `exportSalesCsv(period : AnalyticsPeriod) : async Text` — public query; CSV with\n" #
    "  header `Date,Track Title,License Tier,Amount (USD),Customer Email,Type`.\n" #
    "\n" #
    "### Coupons\n" #
    "\n" #
    "- `listCoupons() : async [Coupon]` — admin.\n" #
    "- `createCoupon(input : CouponInput) : async Coupon` — admin. The code is stored\n" #
    "  lower-cased; matching is case-insensitive.\n" #
    "- `updateCoupon(id : Nat, input : CouponInput) : async Coupon` — admin.\n" #
    "- `deleteCoupon(id : Nat) : async ()` — admin.\n" #
    "- `validateCoupon(code : Text) : async ?Coupon` — public query; returns the coupon\n" #
    "  only when it is active, otherwise `null`.\n" #
    "\n" #
    "### Checkout & Stripe\n" #
    "\n" #
    "- `checkout(request : CheckoutRequest) : async CheckoutResult` — public. Builds a\n" #
    "  Stripe Checkout Session server-side with one line item per cart entry, priced\n" #
    "  from the **current** admin-set license tier and custom-music prices, applying any\n" #
    "  coupon to the whole cart total. Returns `#ok` with the raw session JSON (the\n" #
    "  frontend parses the `url`) plus `subtotalCents`/`discountCents`/`totalCents`, or\n" #
    "  `#err` with `#emptyCart`, `#invalidCoupon`, `#inactiveCoupon`, `#unknownTrack`,\n" #
    "  `#unknownLicenseTier`, `#stripeNotConfigured`, or `#stripeError`.\n" #
    "- `recordCheckoutSale(trackId : ?Nat, licenseTierId : ?Nat, isCustomMusic : Bool,\n" #
    "  amountCents : Nat, customerEmail : Text, trackTitle : Text, licenseTierName :\n" #
    "  Text) : async ()` — public; records a completed sale after confirmed payment.\n" #
    "- `isStripeConfigured() : async Bool` — public query.\n" #
    "- `setStripeConfiguration(config : StripeConfiguration) : async ()` — admin; sets\n" #
    "  the store-wide Stripe secret key and allowed countries.\n" #
    "- `getStripeKeys() : async { publishableKey : Text; secretKey : Text }` — public\n" #
    "  query; returns the stored Stripe Publishable Key and Secret Key.\n" #
    "- `setStripeKeys(keys : { publishableKey : Text; secretKey : Text }) : async ()` —\n" #
    "  admin; saves the Stripe Publishable Key and Secret Key to stable vars so they\n" #
    "  survive canister upgrades.\n" #
    "- `getStripeSessionStatus(sessionId : Text) : async StripeSessionStatus` — public;\n" #
    "  checks a Checkout Session's status after payment return.\n" #
    "- `createCheckoutSession(items : [ShoppingItem], successUrl : Text, cancelUrl :\n" #
    "  Text) : async Text` — public; returns the raw Stripe session JSON.\n" #
    "- `transform(input : TransformationInput) : async TransformationOutput` — public\n" #
    "  query; HTTP outcall transformation required by the stripe extension.\n" #
    "- `transformOutcall(input : TransformationInput) : async TransformationOutput` —\n" #
    "  public query; same transformation used by the `checkout` orchestration.\n" #
    "\n" #
    "### Payment links\n" #
    "\n" #
    "- `getPaymentLinks() : async { personalLicenseLink; commercialLicenseLink;\n" #
    "  enterpriseLicenseLink; customMusicLink : Text }` — public query.\n" #
    "- `setPaymentLinks(personalLicenseLink, commercialLicenseLink, enterpriseLicenseLink,\n" #
    "  customMusicLink : Text) : async ()` — admin.\n" #
    "\n" #
    "### Sales\n" #
    "\n" #
    "- `recordSaleDirect(trackId : Text, trackTitle : Text, licenseType : Text,\n" #
    "  amountCents : Nat, currency : Text, buyerPrincipal : Text) : async Text` —\n" #
    "  public; records a completed sale and returns the new sale id as `Text`.\n" #
    "- `getAllPurchases() : async [SaleRecord]` — public query; all recorded purchases.\n" #
    "\n" #
    "### Object storage\n" #
    "\n" #
    "- `_immutableObjectStorageRefillCashier(refillInformation) : async …` — cashier only.\n" #
    "- `_immutableObjectStorageUpdateGatewayPrincipals() : async ()`.\n" #
    "- `_immutableObjectStorageBlobsAreLive(hashes : [Blob]) : async [Bool]` — query.\n" #
    "- `_immutableObjectStorageBlobsToDelete() : async [Blob]` — query; authorized only.\n" #
    "- `_immutableObjectStorageConfirmBlobDeletion(blobs : [Blob]) : async ()` —\n" #
    "  authorized only.\n" #
    "- `_immutableObjectStorageCreateCertificate(blobHash : Text) : async …`.\n" #
    "\n" #
    "### OQL (Data Intelligence)\n" #
    "\n" #
    "- `schema() : async …` and `execute(query : Text) : async …` — expose the persisted\n" #
    "  `track`, `licenseTier`, `order`, `sale`, `coupon`, `siteSettings`, and\n" #
    "  `landingContent` entities. All entities are `controllerOnly`: the Data Intelligence\n" #
    "  agent reads them as the controller, and end users never read them directly.\n" #
    "\n" #
    "### API documentation\n" #
    "\n" #
    "- `getApiDoc() : async Text` — this document.\n" #
    "\n" #
    "## Lifecycle and polling\n" #
    "\n" #
    "Checkout is a two-phase flow. First call `checkout` (or `createCheckoutSession`) to\n" #
    "obtain a Stripe Checkout Session; the returned JSON contains the `url` the frontend\n" #
    "redirects the buyer to. After Stripe confirms payment and the buyer returns, poll\n" #
    "`getStripeSessionStatus(sessionId)` until the session reports the terminal paid\n" #
    "state, then record the sale with `recordCheckoutSale` (or `recordSaleDirect`) and\n" #
    "clear the cart client-side. Polling is safe to repeat; status reads are idempotent\n" #
    "queries.\n" #
    "\n" #
    "## Mutation retry safety\n" #
    "\n" #
    "Most mutations are idempotent or safe to retry:\n" #
    "\n" #
    "- `upsertLicenseTier` and `updateCoupon`/`updateTrack` overwrite by id, so a retried\n" #
    "  call converges to the same state.\n" #
    "- `createCoupon` and `addTrack`/`bulkAddTracks` allocate a fresh id per call, so a\n" #
    "  retried create produces a duplicate row rather than corrupting an existing one.\n" #
    "- `recordSale`/`recordSaleDirect` append a new sale record per call; retrying after\n" #
    "  a timeout can double-count a sale. The frontend should record a sale exactly once\n" #
    "  per confirmed payment.\n" #
    "- `checkout` creates a new Stripe session each call and does not mutate persisted\n" #
    "  state, so it is safe to retry; each retry may produce a new session.\n" #
    "\n" #
    "## Errors, traps, and limits\n" #
    "\n" #
    "- Admin-guarded endpoints trap with `Unauthorized: Only admins can <action>` when\n" #
    "  the caller is not an admin (including unregistered and anonymous callers).\n" #
    "- Stripe endpoints trap with `Stripe needs to be first configured` when no Stripe\n" #
    "  configuration has been set.\n" #
    "- `checkout` returns structured `#err` variants (see above) rather than trapping for\n" #
    "  empty carts, invalid/inactive coupons, unknown tracks or tiers, and Stripe\n" #
    "  failures.\n" #
    "- Prices are `Nat` cents; percentage discounts are computed as\n" #
    "  `subtotal * amount / 100` and clamped to the subtotal, and fixed discounts are\n" #
    "  clamped to the subtotal, so totals never go negative.\n" #
    "\n" #
    "## Non-obvious integration gotchas\n" #
    "\n" #
    "- `listTracksPage` is declared as a plain `shared` (update) call, not a query,\n" #
    "  because it must obtain the canister's own principal to build direct\n" #
    "  object-storage URLs (`Prim.getSelfPrincipal<system>()` is only available in an\n" #
    "  update context). It is still read-only and safe to call repeatedly; it does not\n" #
    "  mutate state.\n" #
    "- The checkout orchestration returns the **raw Stripe session JSON** (the frontend\n" #
    "  parses the `url`), because `mo:core` has no JSON parser.\n" #
    "- Coupon codes are stored lower-cased and matched case-insensitively.\n" #
    "- A coupon applies to the **whole cart total**, not to individual line items.\n" #
    "- Admin price edits to license tiers and custom music immediately change checkout\n" #
    "  charges, because line items are priced from current state at `checkout` time.\n" #
    "- `filterTracks` ignores `priceRange`; price filtering is client-side.\n" #
    "- OQL entities are `controllerOnly`; the Data Intelligence agent reads them as the\n" #
    "  controller while end users never read them directly.\n"
  };
};
