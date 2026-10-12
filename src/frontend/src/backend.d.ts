import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface AnalyticsRow {
    trackTitle: string;
    date: string;
    amountCents: bigint;
    licenseTierName: string;
    isCustomMusic: boolean;
    customerEmail: string;
}
export interface BilingualText {
    en: string;
    es: string;
}
export type CartItem = {
    __kind__: "track";
    track: {
        licenseTierId: LicenseTierId;
        trackId: TrackId;
    };
} | {
    __kind__: "customMusic";
    customMusic: {
    };
};
export interface Cell {
    value: Value;
    name: string;
}
export type CheckoutError = {
    __kind__: "stripeError";
    stripeError: string;
} | {
    __kind__: "unknownTrack";
    unknownTrack: TrackId;
} | {
    __kind__: "stripeNotConfigured";
    stripeNotConfigured: null;
} | {
    __kind__: "unknownLicenseTier";
    unknownLicenseTier: LicenseTierId;
} | {
    __kind__: "invalidCoupon";
    invalidCoupon: null;
} | {
    __kind__: "inactiveCoupon";
    inactiveCoupon: null;
} | {
    __kind__: "emptyCart";
    emptyCart: null;
};
export interface CheckoutRequest {
    couponCode?: string;
    cancelUrl: string;
    items: Array<CartItem>;
    successUrl: string;
}
export type CheckoutResult = {
    __kind__: "ok";
    ok: {
        subtotalCents: bigint;
        discountCents: bigint;
        sessionJson: string;
        totalCents: bigint;
    };
} | {
    __kind__: "err";
    err: CheckoutError;
};
export type Country = string;
export interface Coupon {
    id: CouponId;
    code: string;
    discountType: DiscountType;
    isActive: boolean;
    amount: bigint;
}
export type CouponId = bigint;
export interface CouponInput {
    code: string;
    discountType: DiscountType;
    isActive: boolean;
    amount: bigint;
}
export interface CustomMusicOrder {
    id: OrderId;
    status: OrderStatus;
    projectType: string;
    genrePreference: string;
    createdAt: Timestamp;
    styleDescription: string;
    customerEmail: string;
}
export interface CustomMusicOrderInput {
    projectType: string;
    genrePreference: string;
    styleDescription: string;
    customerEmail: string;
}
export type Genre = string;
export interface HttpHeader {
    value: string;
    name: string;
}
export interface HttpRequestResult {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface LandingContent {
    customMusicCtaBody: BilingualText;
    logoImage?: ExternalBlob;
    newArrivalTrackIds: Array<TrackId>;
    heroSubtitle: BilingualText;
    customMusicCtaTitle: BilingualText;
    featuredTrackIds: Array<TrackId>;
    heroTitle: BilingualText;
    services: Array<ServiceItem>;
    servicesTitle: BilingualText;
}
export interface LicenseTier {
    id: LicenseTierId;
    name: BilingualText;
    description: BilingualText;
    priceUsd: bigint;
}
export type LicenseTierId = bigint;
export type OrderId = bigint;
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface SaleRecord {
    id: bigint;
    licenseTierId?: bigint;
    trackTitle: string;
    createdAt: Timestamp;
    amountCents: bigint;
    trackId?: bigint;
    licenseTierName: string;
    isCustomMusic: boolean;
    customerEmail: string;
}
export interface SalesSummary {
    avgOrderCents: bigint;
    customMusicSales: bigint;
    trackSales: bigint;
    unitsSold: bigint;
    totalRevenueCents: bigint;
}
export interface ServiceItem {
    id: bigint;
    title: BilingualText;
    icon: string;
    description: BilingualText;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface SiteSettings {
    customMusicPriceUsd: bigint;
}
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export type Timestamp = bigint;
export interface TopTrack {
    trackTitle: string;
    trackId: bigint;
    unitsSold: bigint;
    totalRevenueCents: bigint;
}
export interface Track {
    id: TrackId;
    recommendedUse?: string;
    tempo?: string;
    title: BilingualText;
    country: Country;
    sampleEndSec: bigint;
    mood?: string;
    createdAt: Timestamp;
    vocalType?: string;
    isNewArrival: boolean;
    audioFile: ExternalBlob;
    coverImage: ExternalBlob;
    isFeatured: boolean;
    genre: Genre;
    sampleStartSec: bigint;
    artist: string;
}
export type TrackId = bigint;
export interface TrackInput {
    recommendedUse?: string;
    tempo?: string;
    title: BilingualText;
    country: Country;
    sampleEndSec: bigint;
    mood?: string;
    vocalType?: string;
    isNewArrival: boolean;
    audioFile?: ExternalBlob;
    coverImage: ExternalBlob;
    isFeatured: boolean;
    genre: Genre;
    sampleStartSec: bigint;
    artist: string;
}
export interface TrackSummary {
    id: TrackId;
    recommendedUse?: string;
    coverImageUrl: string;
    tempo?: string;
    title: BilingualText;
    country: Country;
    licenseTierId: LicenseTierId;
    sampleEndSec: bigint;
    mood?: string;
    vocalType?: string;
    audioSampleUrl: string;
    genre: Genre;
    sampleStartSec: bigint;
    artist: string;
    priceCents: bigint;
}
export interface TrackSummaryPage {
    total: bigint;
    items: Array<TrackSummary>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: HttpRequestResult;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum AnalyticsPeriod {
    allTime = "allTime",
    monthly = "monthly",
    daily = "daily",
    weekly = "weekly"
}
export enum DiscountType {
    fixed = "fixed",
    percentage = "percentage"
}
export enum OrderStatus {
    pending = "pending",
    completed = "completed",
    inProgress = "inProgress"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Admin: add a single track
     */
    addTrack(input: TrackInput): Promise<Track>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Admin: bulk add tracks
     */
    bulkAddTracks(inputs: Array<TrackInput>): Promise<Array<Track>>;
    /**
     * / Public: build a Checkout Session from cart line items (track + license
     * / tier, or custom music), priced from the CURRENT admin-set prices, applying
     * / any coupon to the whole cart total. Returns the session JSON plus the
     * / subtotal/discount/total.
     */
    checkout(request: CheckoutRequest): Promise<CheckoutResult>;
    /**
     * / Public: create a Stripe Checkout Session from pre-built ShoppingItems.
     * / Returns the raw Stripe JSON reply; the frontend parses the session URL.
     */
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    /**
     * / Admin: create a coupon.
     */
    createCoupon(input: CouponInput): Promise<Coupon>;
    /**
     * / Public: submit a custom music order
     */
    createCustomMusicOrder(input: CustomMusicOrderInput): Promise<CustomMusicOrder>;
    /**
     * / Admin: delete a coupon.
     */
    deleteCoupon(id: CouponId): Promise<void>;
    /**
     * / Admin: delete a license tier
     */
    deleteLicenseTier(id: LicenseTierId): Promise<boolean>;
    /**
     * / Admin: delete a track
     */
    deleteTrack(id: TrackId): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Export sales data as CSV text
     */
    exportSalesCsv(period: AnalyticsPeriod): Promise<string>;
    /**
     * / Public: filter tracks by optional AND-logic criteria
     * / priceRange is accepted but ignored (price filtering is client-side)
     */
    filterTracks(genre: string | null, country: string | null, vocalType: string | null, mood: string | null, tempo: string | null, recommendedUse: string | null, priceRange: string | null): Promise<Array<Track>>;
    /**
     * / Returns all recorded purchases. Public query — no authentication required.
     */
    getAllPurchases(): Promise<Array<SaleRecord>>;
    /**
     * / Query flat rows for CSV export, filtered by period
     */
    getAnalyticsRows(period: AnalyticsPeriod): Promise<Array<AnalyticsRow>>;
    /**
     * / Public query: return the backend's behavioral API documentation as Markdown.
     */
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Public: get landing page content
     */
    getLandingContent(): Promise<LandingContent>;
    /**
     * / Public query: return all 4 payment links.
     */
    getPaymentLinks(): Promise<{
        commercialLicenseLink: string;
        personalLicenseLink: string;
        enterpriseLicenseLink: string;
        customMusicLink: string;
    }>;
    /**
     * / Query aggregated sales summary for the given period
     */
    getSalesSummary(period: AnalyticsPeriod): Promise<SalesSummary>;
    /**
     * / Public: get site settings (e.g. custom music price)
     */
    getSiteSettings(): Promise<SiteSettings>;
    /**
     * / Public query: return the stored Stripe Publishable Key and Secret Key.
     */
    getStripeKeys(): Promise<{
        secretKey: string;
        publishableKey: string;
    }>;
    /**
     * / Public: check the status of a Stripe Checkout Session after payment return.
     */
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    /**
     * / Query top N tracks by units sold (across all time)
     */
    getTopTracks(limit: bigint): Promise<Array<TopTrack>>;
    /**
     * / Public: get single track
     */
    getTrack(id: TrackId): Promise<Track | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Public query: whether a Stripe configuration has been set.
     */
    isStripeConfigured(): Promise<boolean>;
    /**
     * / Admin: list all coupons.
     */
    listCoupons(): Promise<Array<Coupon>>;
    /**
     * / Admin: list all custom music orders
     */
    listCustomMusicOrders(): Promise<Array<CustomMusicOrder>>;
    /**
     * / Public: list featured tracks
     */
    listFeaturedTracks(): Promise<Array<Track>>;
    /**
     * / Public: list all license tiers
     */
    listLicenseTiers(): Promise<Array<LicenseTier>>;
    /**
     * / Public: list new arrivals
     */
    listNewArrivalTracks(): Promise<Array<Track>>;
    /**
     * / Public: list all tracks
     */
    listTracks(): Promise<Array<Track>>;
    /**
     * / Public: list tracks by country
     */
    listTracksByCountry(country: string): Promise<Array<Track>>;
    /**
     * / Public: list tracks by genre
     */
    listTracksByGenre(genre: string): Promise<Array<Track>>;
    /**
     * / Public: return a page of lightweight TrackSummary items plus the total
     * / count, so the store grid can page through all tracks without downloading
     * / cover/audio blob bytes for every track on page load.
     */
    listTracksPage(offset: bigint, limit: bigint): Promise<TrackSummaryPage>;
    /**
     * / Public: record a completed sale after confirmed payment. The frontend
     * / clears the cart after a successful payment return.
     */
    recordCheckoutSale(trackId: TrackId | null, licenseTierId: LicenseTierId | null, isCustomMusic: boolean, amountCents: bigint, customerEmail: string, trackTitle: string, licenseTierName: string): Promise<void>;
    /**
     * / Record a completed sale (called internally after Stripe confirmation)
     */
    recordSale(trackId: bigint | null, licenseTierId: bigint | null, isCustomMusic: boolean, amountCents: bigint, customerEmail: string, trackTitle: string, licenseTierName: string): Promise<void>;
    /**
     * / Record a completed sale from the frontend after Stripe confirms payment.
     * / trackId is the track's string ID, amount is in dollars (e.g. 29.99),
     * / currency is e.g. "usd", buyerPrincipal is the caller's principal text.
     * / Returns the new sale record's ID as Text.
     */
    recordSaleDirect(trackId: string, trackTitle: string, licenseType: string, amountCents: bigint, currency: string, buyerPrincipal: string): Promise<string>;
    schema(): Promise<string>;
    /**
     * / Admin: save all 4 payment links to stable vars.
     */
    setPaymentLinks(personalLicenseLink: string, commercialLicenseLink: string, enterpriseLicenseLink: string, customMusicLink: string): Promise<void>;
    /**
     * / Admin: set the store-wide Stripe configuration (one key for the whole store).
     */
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    /**
     * / Admin: save the Stripe Publishable Key and Secret Key to stable vars.
     */
    setStripeKeys(keys: {
        secretKey: string;
        publishableKey: string;
    }): Promise<void>;
    /**
     * / Public query: HTTP outcall transformation (required by the stripe extension).
     */
    transform(input: TransformationInput): Promise<TransformationOutput>;
    transformOutcall(input: TransformationInput): Promise<TransformationOutput>;
    /**
     * / Admin: update a coupon.
     */
    updateCoupon(id: CouponId, input: CouponInput): Promise<Coupon>;
    /**
     * / Admin: update order status
     */
    updateCustomOrderStatus(id: OrderId, status: OrderStatus): Promise<CustomMusicOrder | null>;
    /**
     * / Admin: update landing page content
     */
    updateLandingContent(updated: LandingContent): Promise<void>;
    /**
     * / Admin: update site settings
     */
    updateSiteSettings(updated: SiteSettings): Promise<void>;
    /**
     * / Admin: update an existing track; audioFile = null keeps existing audio
     */
    updateTrack(id: TrackId, input: TrackInput): Promise<Track | null>;
    /**
     * / Admin: upsert a license tier (create or update by id)
     */
    upsertLicenseTier(tier: LicenseTier): Promise<LicenseTier>;
    /**
     * / Public: validate a coupon code and return it when active.
     */
    validateCoupon(code: string): Promise<Coupon | null>;
}
