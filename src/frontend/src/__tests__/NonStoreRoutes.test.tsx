import type { LandingContent, SaleRecord, SiteSettings } from "@/backend";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import CustomMusicPage from "@/pages/CustomMusicPage";
import DashboardPage from "@/pages/DashboardPage";
import LandingPage from "@/pages/LandingPage";
import PoliciesPage from "@/pages/PoliciesPage";
import { configure, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Smoke coverage for the routes outside the store. The store redesign must not
// break the landing page, custom music, dashboard, or policies pages.

configure({ testIdAttribute: "data-ocid" });

const landing: LandingContent = {
  customMusicCtaBody: { es: "Cuerpo", en: "Body" },
  newArrivalTrackIds: [],
  heroSubtitle: { es: "Subtítulo", en: "Subtitle" },
  customMusicCtaTitle: { es: "Título", en: "Title" },
  featuredTrackIds: [],
  heroTitle: { es: "Ritmo Raíz", en: "Ritmo Raíz" },
  services: [],
  servicesTitle: { es: "Servicios", en: "Services" },
};

const settings: SiteSettings = {
  customMusicPriceUsd: BigInt(19900),
};

const purchases: SaleRecord[] = [
  {
    id: BigInt(1),
    trackId: BigInt(1),
    licenseTierId: BigInt(1),
    isCustomMusic: false,
    amountCents: BigInt(499),
    customerEmail: "",
    trackTitle: "Salsa Nights",
    licenseTierName: "Personal",
    createdAt: BigInt(1_700_000_000_000_000_000),
  },
];

const login = vi.fn();

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => ({
    loginStatus: "anonymous",
    login,
    clear: vi.fn(),
  }),
  useActor: () => ({ actor: null, isFetching: false }),
}));

vi.mock("@/hooks/useQueries", () => ({
  useLandingContent: () => ({ data: landing }),
  useFeaturedTracks: () => ({ data: [], isLoading: false }),
  useNewArrivalTracks: () => ({ data: [], isLoading: false }),
  useSiteSettings: () => ({ data: settings, isLoading: false }),
  useGetPaymentLinks: () => ({
    data: {
      personalLicenseLink: "",
      commercialLicenseLink: "",
      enterpriseLicenseLink: "",
      customMusicLink: "",
    },
  }),
  useIsStripeConfigured: () => ({ data: false }),
  useCreateCustomMusicOrder: () => ({ mutate: vi.fn(), isPending: false }),
  useRecordSale: () => ({ mutate: vi.fn() }),
  useCheckoutReturn: () => undefined,
  useAllPurchases: () => ({ data: purchases, isLoading: false }),
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
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  login.mockReset();
  localStorage.clear();
});

function wrap(node: React.ReactNode) {
  return render(
    <LanguageProvider>
      <CartProvider>{node}</CartProvider>
    </LanguageProvider>,
  );
}

describe("non-store routes", () => {
  it("renders the landing page hero and CTAs", () => {
    wrap(<LandingPage />);

    expect(screen.getByTestId("landing.hero_section")).toBeInTheDocument();
    expect(screen.getByText("Ritmo Raíz Music")).toBeInTheDocument();
    expect(screen.getByTestId("landing.explore_button")).toHaveAttribute(
      "href",
      "/store",
    );
    expect(
      screen.getByTestId("landing.custom_music_cta_button"),
    ).toHaveAttribute("href", "/custom-music");
  });

  it("renders the policies page with its sections", () => {
    wrap(<PoliciesPage />);

    expect(screen.getByTestId("policies.page")).toBeInTheDocument();
    expect(screen.getByText("Políticas Legales")).toBeInTheDocument();
    expect(screen.getByTestId("policies.accordion")).toBeInTheDocument();
    expect(screen.getByTestId("policies.section.1")).toBeInTheDocument();
  });

  it("renders the dashboard login prompt when signed out", () => {
    wrap(<DashboardPage />);

    expect(screen.getByText("Mi Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard.login_button")).toBeInTheDocument();
  });

  it("renders the custom music order form", () => {
    wrap(<CustomMusicPage />);

    expect(screen.getByTestId("custom.header_section")).toBeInTheDocument();
    expect(screen.getByTestId("custom.order_form")).toBeInTheDocument();
    expect(screen.getByTestId("custom.submit_button")).toBeInTheDocument();
  });
});
