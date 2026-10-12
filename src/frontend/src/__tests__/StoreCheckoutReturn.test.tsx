import type { LicenseTier, TrackSummary } from "@/backend";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import StorePage from "@/pages/StorePage";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The store page handles the Stripe Payment Link return inline: on
// `payment_status=success` it records a sale from the URL params and strips the
// params from the address bar; on `payment_status=cancelled` it only strips the
// params. This behavior must survive the store redesign.

const tracks: TrackSummary[] = [
  {
    id: BigInt(1),
    title: { en: "Salsa Nights", es: "Noches de Salsa" },
    country: "Colombia",
    genre: "Salsa",
    artist: "Ritmo Raíz",
    sampleStartSec: BigInt(0),
    sampleEndSec: BigInt(25),
    licenseTierId: BigInt(1),
    priceCents: BigInt(499),
    coverImageUrl: "https://example.com/cover1.jpg",
    audioSampleUrl: "https://example.com/sample1.mp3",
  },
];

const licenses: LicenseTier[] = [
  {
    id: BigInt(1),
    name: { en: "Personal", es: "Personal" },
    description: { en: "For individual use.", es: "Para uso individual." },
    priceUsd: BigInt(499),
  },
];

const recordSale = vi.fn();

vi.mock("@/hooks/useQueries", () => ({
  useTrackSummaries: () => ({ data: tracks, isLoading: false }),
  useLicenseTiers: () => ({ data: licenses }),
  useFeaturedTracks: () => ({ data: [], isLoading: false }),
  useNewArrivalTracks: () => ({ data: [], isLoading: false }),
  useRecordSale: () => ({ mutate: recordSale }),
  useCheckoutReturn: () => undefined,
  useGetPaymentLinks: () => ({
    data: {
      personalLicenseLink: "https://buy.example/personal",
      commercialLicenseLink: "https://buy.example/commercial",
      enterpriseLicenseLink: "https://buy.example/enterprise",
      customMusicLink: "",
    },
  }),
  useIsStripeConfigured: () => ({ data: false }),
}));

vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      exit,
      whileInView,
      viewport,
      transition,
      ...props
    }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  recordSale.mockReset();
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
  vi.stubGlobal("requestAnimationFrame", vi.fn());
});

function renderStore() {
  return render(
    <LanguageProvider>
      <CartProvider>
        <StorePage />
      </CartProvider>
    </LanguageProvider>,
  );
}

describe("StorePage Stripe return", () => {
  it("records a sale from the URL params on a successful payment return", async () => {
    window.history.replaceState(
      null,
      "",
      "/store?payment_status=success&track_id=1&license_type=1&track_title=Salsa%20Nights&amount=499",
    );

    renderStore();

    await waitFor(() => {
      expect(recordSale).toHaveBeenCalledWith(
        expect.objectContaining({
          trackId: BigInt(1),
          licenseTierId: BigInt(1),
          isCustomMusic: false,
          amountCents: BigInt(499),
          trackTitle: "Salsa Nights",
        }),
        expect.anything(),
      );
    });

    // The payment_status marker is stripped from the address bar so a refresh
    // does not record the sale twice.
    expect(window.location.search).not.toContain("payment_status");
  });

  it("does not record a sale on a cancelled payment return", async () => {
    window.history.replaceState(
      null,
      "",
      "/store?payment_status=cancelled&track_id=1",
    );

    renderStore();

    await waitFor(() => {
      expect(window.location.search).not.toContain("payment_status");
    });
    expect(recordSale).not.toHaveBeenCalled();
  });

  it("does not record a sale on a plain store visit", async () => {
    window.history.replaceState(null, "", "/store");

    renderStore();

    expect(recordSale).not.toHaveBeenCalled();
  });
});
