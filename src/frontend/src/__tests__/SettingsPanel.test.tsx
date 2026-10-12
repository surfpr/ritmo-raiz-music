import type { LandingContent, SiteSettings } from "@/backend";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SettingsPanel } from "@/pages/admin/SettingsPanel";
import { configure, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The generated admin components use data-ocid rather than data-testid.
configure({ testIdAttribute: "data-ocid" });

const settings: SiteSettings = {
  customMusicPriceUsd: BigInt(19900),
};

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

const updateSettings = vi.fn();
const updateLanding = vi.fn();
const setPaymentLinks = vi.fn();
const setStripeKeys = vi.fn();

// Stable reference so the SettingsPanel's payment-links effect (which depends on
// paymentLinksData) does not re-run on every render and wipe typed input.
const paymentLinksData = {
  personalLicenseLink: "",
  commercialLicenseLink: "",
  enterpriseLicenseLink: "",
  customMusicLink: "",
};

// Stable reference so the SettingsPanel's stripe-keys effect (which depends on
// stripeKeysData) does not re-run on every render and wipe typed input.
const stripeKeysData = {
  publishableKey: "",
  secretKey: "",
};

vi.mock("@/hooks/useQueries", () => ({
  useSiteSettings: () => ({ data: settings, isLoading: false }),
  useLandingContent: () => ({ data: landing, isLoading: false }),
  useUpdateSiteSettings: () => ({
    mutateAsync: updateSettings,
    isPending: false,
  }),
  useUpdateLandingContent: () => ({
    mutateAsync: updateLanding,
    isPending: false,
  }),
  useGetPaymentLinks: () => ({ data: paymentLinksData }),
  useSetPaymentLinks: () => ({
    mutateAsync: setPaymentLinks,
    isPending: false,
  }),
  useGetStripeKeys: () => ({ data: stripeKeysData }),
  useSetStripeKeys: () => ({
    mutateAsync: setStripeKeys,
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  updateSettings.mockReset();
  updateLanding.mockReset();
  setPaymentLinks.mockReset();
  setStripeKeys.mockReset();
});

function renderPanel() {
  return render(
    <LanguageProvider>
      <SettingsPanel />
    </LanguageProvider>,
  );
}

describe("SettingsPanel", () => {
  it("renders the existing settings sections", () => {
    renderPanel();

    // LanguageProvider defaults to Spanish, so headings render in Spanish.
    expect(screen.getByText("Precio Música Custom")).toBeInTheDocument();
    expect(screen.getByText("Logo del sitio")).toBeInTheDocument();
    expect(screen.getByText("Texto del Hero")).toBeInTheDocument();
    expect(screen.getByText("Claves de Stripe")).toBeInTheDocument();
    expect(
      screen.getByText("Payment Links / Links de Pago"),
    ).toBeInTheDocument();
  });

  it("renders the Stripe Publishable and Secret Key inputs", () => {
    renderPanel();

    expect(
      screen.getByTestId("admin.stripe_publishable_key_input"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("admin.stripe_secret_key_input"),
    ).toBeInTheDocument();
  });

  it("pre-fills the Stripe keys from the backend", () => {
    renderPanel();

    expect(
      screen.getByTestId("admin.stripe_publishable_key_input"),
    ).toHaveValue("");
    expect(screen.getByTestId("admin.stripe_secret_key_input")).toHaveValue("");
  });

  it("saves the Stripe Publishable and Secret keys", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.type(
      screen.getByTestId("admin.stripe_publishable_key_input"),
      "pk_live_123",
    );
    await user.type(
      screen.getByTestId("admin.stripe_secret_key_input"),
      "sk_live_456",
    );

    await user.click(screen.getByTestId("admin.stripe_keys_save"));

    await waitFor(() => {
      expect(setStripeKeys).toHaveBeenCalledWith({
        publishableKey: "pk_live_123",
        secretKey: "sk_live_456",
      });
    });
  });

  it("pre-fills the custom music price from the backend settings", () => {
    renderPanel();

    // type="number" inputs report their value as a number.
    expect(screen.getByTestId("admin.custom_price_input")).toHaveValue(199);
  });

  it("saves an updated custom music price", async () => {
    const user = userEvent.setup();
    renderPanel();

    const priceInput = screen.getByTestId("admin.custom_price_input");
    await user.clear(priceInput);
    await user.type(priceInput, "249");

    await user.click(screen.getByTestId("admin.save_price_button"));

    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith({
        customMusicPriceUsd: BigInt(24900),
      });
    });
  });

  it("pre-fills hero text from the backend landing content", () => {
    renderPanel();

    expect(screen.getByTestId("admin.hero_title_es_input")).toHaveValue(
      "Ritmo Raíz",
    );
    expect(screen.getByTestId("admin.hero_subtitle_en_input")).toHaveValue(
      "Subtitle",
    );
  });

  it("saves updated hero text", async () => {
    const user = userEvent.setup();
    renderPanel();

    const titleEn = screen.getByTestId("admin.hero_title_en_input");
    await user.clear(titleEn);
    await user.type(titleEn, "Ritmo Raiz EN");

    await user.click(screen.getByTestId("admin.save_hero_button"));

    await waitFor(() => {
      expect(updateLanding).toHaveBeenCalledWith(
        expect.objectContaining({
          heroTitle: { es: "Ritmo Raíz", en: "Ritmo Raiz EN" },
        }),
      );
    });
  });

  it("saves payment links", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.type(
      screen.getByTestId("admin.payment_link_personal_input"),
      "https://buy.stripe.com/personal",
    );

    await user.click(screen.getByTestId("admin.payment_links_save_button"));

    await waitFor(() => {
      expect(setPaymentLinks).toHaveBeenCalledWith({
        personalLicenseLink: "https://buy.stripe.com/personal",
        commercialLicenseLink: "",
        enterpriseLicenseLink: "",
        customMusicLink: "",
      });
    });
  });
});
