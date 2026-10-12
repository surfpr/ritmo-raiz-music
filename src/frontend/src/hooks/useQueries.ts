import { type SaleRecord, createActor } from "@/backend";
import type {
  AnalyticsPeriod,
  CartItem,
  CheckoutRequest,
  CheckoutResult,
  Coupon,
  CouponInput,
  CustomMusicOrder,
  CustomMusicOrderInput,
  DiscountType,
  LandingContent,
  LicenseTier,
  LicenseTier as LicenseTierType,
  OrderId,
  OrderStatus,
  SalesSummary,
  SiteSettings,
  StripeConfiguration,
  StripeSessionStatus,
  TopTrack,
  Track,
  TrackInput,
  TrackSummary,
} from "@/backend";
import { useCartContext } from "@/contexts/CartContext";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useTracks() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Track[]>({
    queryKey: ["tracks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTracks();
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Fetches the full lightweight catalog of TrackSummary items via
 * listTracksPage. TrackSummary carries coverImageUrl and audioSampleUrl as
 * direct URL strings (NOT ExternalBlob objects), so this call downloads no
 * blob bytes — it is the fast path for the store grid. The large limit fetches
 * the whole catalog in one round-trip so filters can apply client-side.
 */
export function useTrackSummaries() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<TrackSummary[]>({
    queryKey: ["trackSummaries"],
    queryFn: async () => {
      if (!actor) return [];
      const page = await actor.listTracksPage(0n, 1000n);
      return page.items;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFeaturedTracks() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Track[]>({
    queryKey: ["tracks", "featured"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFeaturedTracks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useNewArrivalTracks() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Track[]>({
    queryKey: ["tracks", "newArrivals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listNewArrivalTracks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTracksByGenre(genre: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Track[]>({
    queryKey: ["tracks", "genre", genre],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTracksByGenre(genre);
    },
    enabled: !!actor && !isFetching && !!genre,
  });
}

export function useTracksByCountry(country: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Track[]>({
    queryKey: ["tracks", "country", country],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTracksByCountry(country);
    },
    enabled: !!actor && !isFetching && !!country,
  });
}

export function useLicenseTiers() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<LicenseTier[]>({
    queryKey: ["licenseTiers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listLicenseTiers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLandingContent() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<LandingContent>({
    queryKey: ["landingContent"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getLandingContent();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSiteSettings() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<SiteSettings>({
    queryKey: ["siteSettings"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getSiteSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCustomMusicOrders() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CustomMusicOrder[]>({
    queryKey: ["customMusicOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCustomMusicOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCustomMusicOrder() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CustomMusicOrderInput) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createCustomMusicOrder(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customMusicOrders"] }),
  });
}

export function useAddTrack() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TrackInput) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addTrack(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tracks"] }),
  });
}

export function useUpdateTrack() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: bigint; input: TrackInput }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateTrack(id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tracks"] }),
  });
}

export function useDeleteTrack() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteTrack(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tracks"] }),
  });
}

export function useUpsertLicenseTier() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tier: LicenseTierType) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.upsertLicenseTier(tier);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["licenseTiers"] }),
  });
}

export function useDeleteLicenseTier() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteLicenseTier(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["licenseTiers"] }),
  });
}

export function useUpdateLandingContent() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: LandingContent) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateLandingContent(content);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landingContent"] }),
  });
}

export function useUpdateSiteSettings() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: SiteSettings) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateSiteSettings(settings);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["siteSettings"] }),
  });
}

export function useUpdateCustomOrderStatus() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: { id: OrderId; status: OrderStatus }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateCustomOrderStatus(id, status);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customMusicOrders"] }),
  });
}

export interface PaymentLinks {
  personalLicenseLink: string;
  commercialLicenseLink: string;
  enterpriseLicenseLink: string;
  customMusicLink: string;
}

export function useGetPaymentLinks() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<PaymentLinks>({
    queryKey: ["paymentLinks"],
    queryFn: async () => {
      if (!actor)
        return {
          personalLicenseLink: "",
          commercialLicenseLink: "",
          enterpriseLicenseLink: "",
          customMusicLink: "",
        };
      return actor.getPaymentLinks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetPaymentLinks() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (links: PaymentLinks) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setPaymentLinks(
        links.personalLicenseLink,
        links.commercialLicenseLink,
        links.enterpriseLicenseLink,
        links.customMusicLink,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paymentLinks"] });
    },
  });
}

// Detect which payment link type to use from the license name
export function detectLicenseType(
  licenseName: string,
): "personal" | "commercial" | "enterprise" {
  const n = licenseName.toLowerCase();
  if (n.includes("enterprise") || n.includes("broadcast")) return "enterprise";
  if (n.includes("commercial")) return "commercial";
  return "personal";
}
export function useBulkAddTracks() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inputs: TrackInput[]) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.bulkAddTracks(inputs);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tracks"] });
      qc.invalidateQueries({ queryKey: ["trackSummaries"] });
    },
  });
}

export function useSalesSummary(period: AnalyticsPeriod) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<SalesSummary>({
    queryKey: ["salesSummary", period],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getSalesSummary(period);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTopTracks(limit = 10) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<TopTrack[]>({
    queryKey: ["topTracks", limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopTracks(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllPurchases() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<SaleRecord[]>({
    queryKey: ["allPurchases"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPurchases();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordSale() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (params: {
      trackId: bigint | null;
      licenseTierId: bigint | null;
      isCustomMusic: boolean;
      amountCents: bigint;
      customerEmail: string;
      trackTitle: string;
      licenseTierName: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.recordSale(
        params.trackId,
        params.licenseTierId,
        params.isCustomMusic,
        params.amountCents,
        params.customerEmail,
        params.trackTitle,
        params.licenseTierName,
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Dynamic checkout + coupons
// ---------------------------------------------------------------------------

export function useCheckout() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (request: CheckoutRequest): Promise<CheckoutResult> => {
      if (!actor) throw new Error("Actor not ready");
      return actor.checkout(request);
    },
  });
}

export function useListCoupons() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Coupon[]>({
    queryKey: ["coupons"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCoupons();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCoupon() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CouponInput) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createCoupon(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useUpdateCoupon() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: bigint; input: CouponInput }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateCoupon(id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useDeleteCoupon() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteCoupon(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useValidateCoupon() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (code: string): Promise<Coupon | null> => {
      if (!actor) throw new Error("Actor not ready");
      return actor.validateCoupon(code);
    },
  });
}

export interface StripeKeys {
  publishableKey: string;
  secretKey: string;
}

export function useGetStripeKeys() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<StripeKeys>({
    queryKey: ["stripeKeys"],
    queryFn: async () => {
      if (!actor) return { publishableKey: "", secretKey: "" };
      return actor.getStripeKeys();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeKeys() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (keys: StripeKeys) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.setStripeKeys(keys);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stripeKeys"] });
    },
  });
}

export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<boolean>({
    queryKey: ["stripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stripeConfigured"] }),
  });
}

export function useGetStripeSessionStatus() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (sessionId: string): Promise<StripeSessionStatus> => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getStripeSessionStatus(sessionId);
    },
  });
}

export function useRecordCheckoutSale() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (params: {
      trackId: bigint | null;
      licenseTierId: bigint | null;
      isCustomMusic: boolean;
      amountCents: bigint;
      customerEmail: string;
      trackTitle: string;
      licenseTierName: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.recordCheckoutSale(
        params.trackId,
        params.licenseTierId,
        params.isCustomMusic,
        params.amountCents,
        params.customerEmail,
        params.trackTitle,
        params.licenseTierName,
      );
    },
  });
}

/**
 * Handle the Stripe Checkout return: verify the session, record the sale, and
 * clear the cart. Call once on mount from the pages that can receive the
 * redirect (store and custom music).
 */
export function useCheckoutReturn() {
  const { clearCart, items, totalCents } = useCartContext();
  const getStatus = useGetStripeSessionStatus();
  const recordCheckoutSale = useRecordCheckoutSale();

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount to check Stripe return
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const sessionId = sp.get("session_id");
    const payment = sp.get("payment");

    if (payment !== "success" || !sessionId) return;

    getStatus.mutate(sessionId, {
      onSuccess: (status) => {
        if (status.__kind__ === "completed") {
          const first = items[0];
          const isCustom = first?.kind === "customMusic";
          recordCheckoutSale.mutate({
            trackId: first?.kind === "track" ? first.trackId : null,
            licenseTierId: first?.kind === "track" ? first.licenseTierId : null,
            isCustomMusic: isCustom,
            amountCents: BigInt(totalCents),
            customerEmail: "",
            trackTitle: isCustom
              ? "Custom Music — Ritmo Raíz"
              : (first?.title ?? "Ritmo Raíz purchase"),
            licenseTierName: isCustom
              ? "Custom Music"
              : (first?.licenseName ?? "License"),
          });
          clearCart();
        }
      },
    });

    // Clean up the URL params.
    sp.delete("payment");
    sp.delete("session_id");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${sp.toString() ? `?${sp.toString()}` : ""}`,
    );
  }, []);
}
