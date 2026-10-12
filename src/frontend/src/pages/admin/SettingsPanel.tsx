import { ExternalBlob } from "@/backend";
import type { LandingContent, SiteSettings } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useGetPaymentLinks,
  useGetStripeKeys,
  useLandingContent,
  useSetPaymentLinks,
  useSetStripeKeys,
  useSiteSettings,
  useUpdateLandingContent,
  useUpdateSiteSettings,
} from "@/hooks/useQueries";
import { CheckCircle2, CreditCard, Image, Link, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

async function blobFromFile(file: File): Promise<ExternalBlob> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return ExternalBlob.fromBytes(bytes);
}

export function SettingsPanel() {
  const { t } = useLanguage();
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const { data: landing, isLoading: landingLoading } = useLandingContent();
  const updateSettings = useUpdateSiteSettings();
  const updateLanding = useUpdateLandingContent();

  const [customPrice, setCustomPrice] = useState("");
  const [priceReady, setPriceReady] = useState(false);

  const [heroTitleEs, setHeroTitleEs] = useState("");
  const [heroTitleEn, setHeroTitleEn] = useState("");
  const [heroSubtitleEs, setHeroSubtitleEs] = useState("");
  const [heroSubtitleEn, setHeroSubtitleEn] = useState("");
  const [heroReady, setHeroReady] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoSaving, setLogoSaving] = useState(false);

  // Payment Links state
  const [plPersonal, setPlPersonal] = useState("");
  const [plCommercial, setPlCommercial] = useState("");
  const [plEnterprise, setPlEnterprise] = useState("");
  const [plCustomMusic, setPlCustomMusic] = useState("");
  const [plSaved, setPlSaved] = useState(false);

  // Stripe Keys state
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [keysSaved, setKeysSaved] = useState(false);

  const { data: paymentLinksData } = useGetPaymentLinks();
  useGetPaymentLinks();
  const setPaymentLinksMutation = useSetPaymentLinks();

  const { data: stripeKeysData } = useGetStripeKeys();
  const setStripeKeysMutation = useSetStripeKeys();

  // Load payment links from backend on mount / when data arrives
  useEffect(() => {
    if (paymentLinksData) {
      setPlPersonal(paymentLinksData.personalLicenseLink ?? "");
      setPlCommercial(paymentLinksData.commercialLicenseLink ?? "");
      setPlEnterprise(paymentLinksData.enterpriseLicenseLink ?? "");
      setPlCustomMusic(paymentLinksData.customMusicLink ?? "");
    }
  }, [paymentLinksData]);

  // Load Stripe keys from backend on mount / when data arrives
  useEffect(() => {
    if (stripeKeysData) {
      setPublishableKey(stripeKeysData.publishableKey ?? "");
      setSecretKey(stripeKeysData.secretKey ?? "");
    }
  }, [stripeKeysData]);

  const savePaymentLinks = async () => {
    try {
      await setPaymentLinksMutation.mutateAsync({
        personalLicenseLink: plPersonal,
        commercialLicenseLink: plCommercial,
        enterpriseLicenseLink: plEnterprise,
        customMusicLink: plCustomMusic,
      });
      setPlSaved(true);
      setTimeout(() => setPlSaved(false), 2000);
    } catch {
      toast.error(
        t("Error al guardar los links de pago", "Error saving payment links"),
      );
    }
  };

  const saveStripeKeys = async () => {
    try {
      await setStripeKeysMutation.mutateAsync({
        publishableKey,
        secretKey,
      });
      setKeysSaved(true);
      setTimeout(() => setKeysSaved(false), 2000);
    } catch {
      toast.error(
        t("Error al guardar las claves de Stripe", "Error saving Stripe keys"),
      );
    }
  };

  // Populate form from server data (once)
  if (settings && !priceReady) {
    setCustomPrice((Number(settings.customMusicPriceUsd) / 100).toFixed(2));
    setPriceReady(true);
  }
  if (landing && !heroReady) {
    setHeroTitleEs(landing.heroTitle.es);
    setHeroTitleEn(landing.heroTitle.en);
    setHeroSubtitleEs(landing.heroSubtitle.es);
    setHeroSubtitleEn(landing.heroSubtitle.en);
    setHeroReady(true);
  }

  const savePrice = async () => {
    if (!settings) return;
    try {
      const updated: SiteSettings = {
        ...settings,
        customMusicPriceUsd: BigInt(
          Math.round(Number.parseFloat(customPrice || "0") * 100),
        ),
      };
      await updateSettings.mutateAsync(updated);
      toast.success(t("Precio guardado", "Price saved"));
    } catch {
      toast.error(t("Error al guardar", "Error saving"));
    }
  };

  const saveHero = async () => {
    if (!landing) return;
    try {
      const updated: LandingContent = {
        ...landing,
        heroTitle: { es: heroTitleEs, en: heroTitleEn },
        heroSubtitle: { es: heroSubtitleEs, en: heroSubtitleEn },
      };
      await updateLanding.mutateAsync(updated);
      toast.success(t("Hero actualizado", "Hero updated"));
    } catch {
      toast.error(t("Error al guardar", "Error saving"));
    }
  };

  const saveLogo = async () => {
    if (!landing || !logoFile) return;
    setLogoSaving(true);
    try {
      const logoBlob = await blobFromFile(logoFile);
      const updated: LandingContent = { ...landing, logoImage: logoBlob };
      await updateLanding.mutateAsync(updated);
      toast.success(t("Logo actualizado", "Logo updated"));
      setLogoFile(null);
      setLogoPreview(null);
    } catch {
      toast.error(t("Error al guardar logo", "Error saving logo"));
    } finally {
      setLogoSaving(false);
    }
  };

  const handleLogoFile = (file: File) => {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  if (settingsLoading || landingLoading) {
    return (
      <div className="space-y-4" data-ocid="admin.settings.loading_state">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ocid="admin.settings_panel">
      {/* Custom Music Price */}
      <section className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">
          {t("Precio Música Custom", "Custom Music Price")}
        </h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Label>{t("Precio fijo (USD)", "Fixed price (USD)")}</Label>
            <Input
              type="number"
              min="0"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="199"
              data-ocid="admin.custom_price_input"
            />
          </div>
          <Button
            type="button"
            className="bg-primary text-primary-foreground gap-2"
            onClick={savePrice}
            disabled={updateSettings.isPending}
            data-ocid="admin.save_price_button"
          >
            <Save size={16} />
            {t("Guardar", "Save")}
          </Button>
        </div>
      </section>

      {/* Logo uploader */}
      <section className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">
          {t("Logo del sitio", "Site logo")}
        </h3>
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center border border-border overflow-hidden">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-full h-full object-contain"
              />
            ) : landing?.logoImage ? (
              <img
                src={landing.logoImage.getDirectURL()}
                alt="Current logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <Image size={32} className="text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleLogoFile(f);
              }}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-primary/15 file:text-primary cursor-pointer mb-3"
              data-ocid="admin.logo_upload"
            />
            <Button
              type="button"
              className="bg-primary text-primary-foreground gap-2"
              onClick={saveLogo}
              disabled={!logoFile || logoSaving}
              data-ocid="admin.save_logo_button"
            >
              <Save size={16} />
              {logoSaving
                ? t("Guardando...", "Saving...")
                : t("Guardar logo", "Save logo")}
            </Button>
          </div>
        </div>
      </section>

      {/* Hero text */}
      <section className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">
          {t("Texto del Hero", "Hero text")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t("Título ES", "Title ES")}</Label>
            <Input
              value={heroTitleEs}
              onChange={(e) => setHeroTitleEs(e.target.value)}
              placeholder="Ritmo Raíz Music"
              data-ocid="admin.hero_title_es_input"
            />
          </div>
          <div>
            <Label>{t("Título EN", "Title EN")}</Label>
            <Input
              value={heroTitleEn}
              onChange={(e) => setHeroTitleEn(e.target.value)}
              placeholder="Ritmo Raíz Music"
              data-ocid="admin.hero_title_en_input"
            />
          </div>
          <div>
            <Label>{t("Subtítulo ES", "Subtitle ES")}</Label>
            <Input
              value={heroSubtitleEs}
              onChange={(e) => setHeroSubtitleEs(e.target.value)}
              placeholder="Música latina con IA"
              data-ocid="admin.hero_subtitle_es_input"
            />
          </div>
          <div>
            <Label>{t("Subtítulo EN", "Subtitle EN")}</Label>
            <Input
              value={heroSubtitleEn}
              onChange={(e) => setHeroSubtitleEn(e.target.value)}
              placeholder="AI-powered Latin music"
              data-ocid="admin.hero_subtitle_en_input"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            type="button"
            className="bg-primary text-primary-foreground gap-2"
            onClick={saveHero}
            disabled={updateLanding.isPending}
            data-ocid="admin.save_hero_button"
          >
            <Save size={16} />
            {t("Guardar hero", "Save hero")}
          </Button>
        </div>
      </section>
      {/* Stripe Keys */}
      <section
        className="bg-card border border-border rounded-2xl p-5"
        data-ocid="admin.stripe_keys_section"
      >
        <div className="flex items-center gap-2 mb-2">
          <CreditCard size={20} className="text-primary" />
          <h3 className="font-semibold text-foreground">
            {t("Claves de Stripe", "Stripe Keys")}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {t(
            "Configura tus claves de API de Stripe. La clave publicable se usa en el frontend y la clave secreta en el backend para procesar pagos.",
            "Configure your Stripe API keys. The publishable key is used in the frontend and the secret key in the backend to process payments.",
          )}
        </p>
        <div className="space-y-3">
          <div>
            <Label>{t("Clave publicable", "Publishable Key")}</Label>
            <Input
              type="text"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              placeholder="pk_live_..."
              autoComplete="off"
              data-ocid="admin.stripe_publishable_key_input"
            />
          </div>
          <div>
            <Label>{t("Clave secreta", "Secret Key")}</Label>
            <Input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_live_..."
              autoComplete="off"
              data-ocid="admin.stripe_secret_key_input"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            type="button"
            className="bg-primary text-primary-foreground gap-2"
            onClick={saveStripeKeys}
            disabled={setStripeKeysMutation.isPending}
            data-ocid="admin.stripe_keys_save"
          >
            {keysSaved ? (
              <>
                <CheckCircle2 size={16} />
                {t("¡Guardado!", "Saved!")}
              </>
            ) : (
              <>
                <Save size={16} />
                {t("Guardar claves", "Save keys")}
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Payment Links */}
      <section
        className="bg-card border border-border rounded-2xl p-5"
        data-ocid="admin.payment_links_section"
      >
        <div className="flex items-center gap-2 mb-2">
          <Link size={20} className="text-primary" />
          <h3 className="font-semibold text-foreground">
            {t(
              "Payment Links / Links de Pago",
              "Payment Links / Links de Pago",
            )}
          </h3>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 mb-4">
          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
            {t("Importante:", "Important:")}
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            {t(
              "Configura la URL de retorno directamente en el Dashboard de Stripe para cada Payment Link. La URL que debes usar es:",
              "Configure the return URL directly in the Stripe Dashboard for each Payment Link. The URL to use is:",
            )}{" "}
            <code className="text-xs bg-amber-500/20 px-1.5 py-0.5 rounded">
              {`${window.location.origin}/store?payment_status=success`}
            </code>
          </p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {t(
            "Configura tus Stripe Payment Links para cada nivel de licencia. Créalos en tu Stripe Dashboard en la sección Payment Links.",
            "Configure your Stripe Payment Links for each license tier. Create them in your Stripe Dashboard under Payment Links.",
          )}
        </p>
        <div className="space-y-3">
          <div>
            <Label>
              {t(
                "Licencia Personal / Personal License ($4.99)",
                "Personal License / Licencia Personal ($4.99)",
              )}
            </Label>
            <Input
              type="url"
              value={plPersonal}
              onChange={(e) => setPlPersonal(e.target.value)}
              placeholder="https://buy.stripe.com/..."
              autoComplete="off"
              data-ocid="admin.payment_link_personal_input"
            />
          </div>
          <div>
            <Label>
              {t(
                "Licencia Comercial / Commercial License ($29.99)",
                "Commercial License / Licencia Comercial ($29.99)",
              )}
            </Label>
            <Input
              type="url"
              value={plCommercial}
              onChange={(e) => setPlCommercial(e.target.value)}
              placeholder="https://buy.stripe.com/..."
              autoComplete="off"
              data-ocid="admin.payment_link_commercial_input"
            />
          </div>
          <div>
            <Label>
              {t(
                "Licencia Enterprise / Enterprise License ($99.99)",
                "Enterprise License / Licencia Enterprise ($99.99)",
              )}
            </Label>
            <Input
              type="url"
              value={plEnterprise}
              onChange={(e) => setPlEnterprise(e.target.value)}
              placeholder="https://buy.stripe.com/..."
              autoComplete="off"
              data-ocid="admin.payment_link_enterprise_input"
            />
          </div>
          <div>
            <Label>
              {t(
                "Música Custom / Custom Music ($119.99)",
                "Custom Music / Música Custom ($119.99)",
              )}
            </Label>
            <Input
              type="url"
              value={plCustomMusic}
              onChange={(e) => setPlCustomMusic(e.target.value)}
              placeholder="https://buy.stripe.com/..."
              autoComplete="off"
              data-ocid="admin.payment_link_custom_music_input"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            type="button"
            className="bg-primary text-primary-foreground gap-2"
            onClick={savePaymentLinks}
            data-ocid="admin.payment_links_save_button"
          >
            {plSaved ? (
              <>
                <CheckCircle2 size={16} />
                {t("¡Guardado!", "Saved!")}
              </>
            ) : (
              <>
                <Save size={16} />
                {t("Guardar links", "Save links")}
              </>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}
