import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useCheckoutReturn,
  useCreateCustomMusicOrder,
  useGetPaymentLinks,
  useIsStripeConfigured,
  useRecordSale,
  useSiteSettings,
} from "@/hooks/useQueries";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Music,
  Music2,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface FormData {
  projectType: string;
  genrePreference: string;
  styleDescription: string;
  customerEmail: string;
  budgetNotes: string;
}

const PROJECT_TYPES = [
  {
    value: "film",
    labelEs: "Película / TV",
    labelEn: "Film / TV",
    icon: "🎬",
  },
  {
    value: "commercial",
    labelEs: "Comercial",
    labelEn: "Commercial",
    icon: "📺",
  },
  {
    value: "promotion",
    labelEs: "Promoción",
    labelEn: "Promotion",
    icon: "📣",
  },
  {
    value: "personal",
    labelEs: "Personal",
    labelEn: "Personal",
    icon: "🎵",
  },
];

const GENRES = [
  "Salsa",
  "Reggaeton",
  "Cumbia",
  "Bachata",
  "Merengue",
  "Latin Pop",
  "Bossa Nova",
  "Tango",
  "Vallenato",
  "Otro / Other",
];

const FEATURES = [
  { icon: Clock, keyEs: "Entrega en 24 horas", keyEn: "Delivered in 24 hours" },
  {
    icon: Music,
    keyEs: "Composición completamente original",
    keyEn: "Fully original composition",
  },
  {
    icon: CheckCircle2,
    keyEs: "Licencia comercial incluida",
    keyEn: "Commercial license included",
  },
  {
    icon: Sparkles,
    keyEs: "Generada con IA de última generación",
    keyEn: "Crafted with cutting-edge AI",
  },
  {
    icon: Zap,
    keyEs: "Revisión incluida si se requiere",
    keyEn: "One revision included if needed",
  },
];

// Decorative floating notes positions
const NOTES = [
  { x: "8%", y: "12%", size: 28, delay: 0, color: "text-primary" },
  { x: "88%", y: "18%", size: 22, delay: 0.4, color: "text-accent" },
  { x: "5%", y: "55%", size: 20, delay: 0.8, color: "text-accent" },
  { x: "92%", y: "60%", size: 26, delay: 0.2, color: "text-primary" },
  { x: "50%", y: "6%", size: 18, delay: 0.6, color: "text-primary/60" },
  { x: "75%", y: "85%", size: 16, delay: 1.0, color: "text-accent/70" },
  { x: "18%", y: "88%", size: 22, delay: 0.3, color: "text-primary/70" },
];

export default function CustomMusicPage() {
  const { t, lang } = useLanguage();
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const { data: paymentLinks } = useGetPaymentLinks();
  const { data: isStripeConfigured } = useIsStripeConfigured();
  const { addItem, openCart } = useCart();
  const { mutateAsync: createOrder, isPending: creatingOrder } =
    useCreateCustomMusicOrder();
  const recordSale = useRecordSale();
  useCheckoutReturn();

  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isSuccessReturn, setIsSuccessReturn] = useState(false);
  const [buyOpened, setBuyOpened] = useState(false);

  const priceInCents = settings ? Number(settings.customMusicPriceUsd) : 11999;
  const priceInDollars = priceInCents / 100;
  const isPending = creatingOrder;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { projectType: "", genrePreference: "", budgetNotes: "" },
  });

  const selectedType = watch("projectType");

  const onSubmit = async (data: FormData) => {
    try {
      // 1. Save the order to backend
      await createOrder({
        projectType: data.projectType,
        genrePreference: data.genrePreference,
        styleDescription: data.styleDescription,
        customerEmail: data.customerEmail,
      });
      setSubmittedEmail(data.customerEmail);
      setOrderConfirmed(true);

      // 2. Save order details to sessionStorage before redirecting
      sessionStorage.setItem(
        "custom_music_order",
        JSON.stringify({
          customerEmail: data.customerEmail,
          projectType: data.projectType,
          genrePreference: data.genrePreference,
          priceInCents,
        }),
      );

      // 3. Dynamic checkout configured: add custom music to the cart.
      if (isStripeConfigured) {
        addItem({
          kind: "customMusic",
          title: t("Música Custom — Ritmo Raíz", "Custom Music — Ritmo Raíz"),
          priceCents: priceInCents,
          quantity: 1,
        });
        openCart();
        return;
      }

      // Fallback: open the static Payment Link when dynamic checkout is off.
      const customMusicUrl = paymentLinks?.customMusicLink;
      if (customMusicUrl) {
        window.open(customMusicUrl, "_blank");
        setBuyOpened(true);
        setTimeout(() => setBuyOpened(false), 2000);
      } else {
        toast.error(
          t(
            "Link de pago no configurado. Contacta al administrador.",
            "Payment link not configured. Contact the admin.",
          ),
        );
      }
    } catch {
      setOrderConfirmed(false);
      toast.error(
        t("Error al procesar la solicitud", "Error processing your request"),
      );
    }
  };

  // Check for success param after Stripe redirect and record the sale
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount to check Stripe return
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const isSuccess =
      sp.get("payment_status") === "success" ||
      sp.get("success") === "1" ||
      sp.get("success") === "true";

    if (isSuccess) {
      setIsSuccessReturn(true);
      toast.success(
        t(
          "¡Pago completado! Gracias por tu pedido.",
          "Payment complete! Thank you for your order.",
        ),
      );

      // Recover order details from sessionStorage
      const savedOrder = sessionStorage.getItem("custom_music_order");
      let savedEmail = "";
      let savedPriceCents = priceInCents;
      if (savedOrder) {
        try {
          const parsed = JSON.parse(savedOrder) as {
            customerEmail: string;
            priceInCents: number;
          };
          savedEmail = parsed.customerEmail ?? "";
          savedPriceCents = parsed.priceInCents ?? priceInCents;
        } catch {
          // ignore parse errors
        }
        sessionStorage.removeItem("custom_music_order");
      }

      recordSale.mutate({
        trackId: null,
        licenseTierId: null,
        isCustomMusic: true,
        amountCents: BigInt(savedPriceCents),
        customerEmail: savedEmail,
        trackTitle: t(
          "Música Custom — Ritmo Raíz",
          "Custom Music — Ritmo Raíz",
        ),
        licenseTierName: t("Música Custom", "Custom Music"),
      });

      sp.delete("success");
      sp.delete("payment_status");
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${sp.toString() ? `?${sp.toString()}` : ""}`,
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[520px] bg-gradient-to-b from-primary/10 via-accent/5 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-card/60 to-transparent" />
        {/* Radial glow accents */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-40 right-1/4 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
      </div>

      {/* Floating musical notes */}
      {NOTES.map((note, i) => (
        <motion.div
          key={`note-${note.x}-${note.y}`}
          className={`absolute pointer-events-none ${note.color}`}
          style={{ left: note.x, top: note.y }}
          animate={{ y: [-8, 8, -8], rotate: [-5, 5, -5] }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Number.POSITIVE_INFINITY,
            delay: note.delay,
            ease: "easeInOut",
          }}
        >
          {i % 2 === 0 ? (
            <Music size={note.size} />
          ) : (
            <Music2 size={note.size} />
          )}
        </motion.div>
      ))}

      <div className="relative max-w-5xl mx-auto px-6 py-16">
        {/* Page Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          data-ocid="custom.header_section"
        >
          <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-1.5 mb-5">
            <Sparkles size={15} className="text-primary" />
            <span className="text-primary text-sm font-semibold tracking-wide uppercase">
              {t("IA · Música Original", "AI · Original Music")}
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            {t("Música", "Custom")}{" "}
            <span className="text-primary">{t("Custom", "Music")}</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t(
              "Composiciones únicas creadas con IA para tu proyecto. Entrega garantizada en 24 horas.",
              "Unique AI-crafted compositions for your project. Delivery guaranteed within 24 hours.",
            )}
          </p>

          {/* 24h delivery badge */}
          <div className="inline-flex items-center gap-2 mt-5 bg-accent/15 border border-accent/30 rounded-full px-5 py-2">
            <Clock size={16} className="text-accent" />
            <span className="text-accent font-bold text-sm">
              {t(
                "⚡ Entrega en 24 horas garantizada",
                "⚡ 24-hour delivery guaranteed",
              )}
            </span>
          </div>
        </motion.div>

        {/* Success return banner */}
        <AnimatePresence>
          {isSuccessReturn && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 bg-accent/15 border border-accent/40 rounded-2xl p-5 flex items-start gap-4"
              data-ocid="custom.success_state"
            >
              <CheckCircle2
                className="text-accent mt-0.5 flex-shrink-0"
                size={24}
              />
              <div>
                <p className="font-display font-bold text-foreground text-lg">
                  {t("¡Pedido recibido!", "Order received!")}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  {t(
                    "Tu composición custom está en proceso. Te contactaremos en 24 horas.",
                    "Your custom composition is in progress. We'll reach out within 24 hours.",
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order confirmed state (before Stripe redirect) */}
        <AnimatePresence>
          {orderConfirmed && !isSuccessReturn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 bg-primary/10 border border-primary/30 rounded-2xl p-5 flex items-start gap-4"
              data-ocid="custom.loading_state"
            >
              <Sparkles
                className="text-primary mt-0.5 flex-shrink-0"
                size={22}
              />
              <div>
                <p className="font-semibold text-foreground">
                  {t(
                    "Pedido guardado · Redirigiendo al pago...",
                    "Order saved · Redirecting to payment...",
                  )}
                </p>
                {submittedEmail && (
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {t(
                      `Confirmación para: ${submittedEmail}`,
                      `Confirmation for: ${submittedEmail}`,
                    )}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left: Price + Features */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="bg-card border border-border rounded-3xl p-7 sticky top-8">
              {/* Price */}
              <div className="pb-6 mb-6 border-b border-border">
                <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mb-2">
                  {t("Precio por composición", "Price per composition")}
                </p>
                {settingsLoading ? (
                  <Skeleton className="h-14 w-36" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-5xl font-bold text-primary">
                      ${priceInDollars.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground font-medium">
                      USD
                    </span>
                  </div>
                )}
                <Badge
                  variant="secondary"
                  className="mt-3 bg-accent/15 text-accent border-accent/30 gap-1"
                >
                  <Clock size={12} />
                  {t("Entrega 24 hrs", "24hr Delivery")}
                </Badge>
              </div>

              {/* Features list */}
              <div className="space-y-4">
                {FEATURES.map((feature, idx) => (
                  <motion.div
                    key={feature.keyEs}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <feature.icon className="text-primary" size={15} />
                    </div>
                    <span className="text-foreground text-sm leading-snug">
                      {t(feature.keyEs, feature.keyEn)}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Trust note */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className="text-primary fill-primary"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {t(
                    "Creado con IA profesional. Compositor revisa cada pieza antes de la entrega.",
                    "Created with professional AI. Composer reviews every piece before delivery.",
                  )}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-card border border-border rounded-3xl p-8">
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                {t("Cuéntanos tu proyecto", "Tell us about your project")}
              </h2>
              <p className="text-muted-foreground text-sm mb-7">
                {t(
                  "Completa el formulario y te enviamos tu composición en 24 hrs.",
                  "Fill the form and we'll send your composition within 24 hours.",
                )}
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
                data-ocid="custom.order_form"
              >
                {/* Project Type — Radio buttons */}
                <div>
                  <Label className="text-foreground font-semibold mb-3 block">
                    {t("Tipo de proyecto", "Project type")}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {PROJECT_TYPES.map((pt) => (
                      <label
                        key={pt.value}
                        className={`flex items-center gap-3 cursor-pointer rounded-xl border p-3.5 transition-all duration-200 ${
                          selectedType === pt.value
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-background hover:border-primary/50 text-muted-foreground"
                        }`}
                        data-ocid={`custom.project_type_${pt.value}`}
                      >
                        <input
                          type="radio"
                          value={pt.value}
                          {...register("projectType", { required: true })}
                          className="sr-only"
                          onChange={() => setValue("projectType", pt.value)}
                        />
                        <span className="text-xl">{pt.icon}</span>
                        <span className="text-sm font-medium leading-tight">
                          {lang === "es" ? pt.labelEs : pt.labelEn}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.projectType && (
                    <p
                      className="text-destructive text-xs mt-2"
                      data-ocid="custom.project_type.field_error"
                    >
                      {t(
                        "Selecciona un tipo de proyecto",
                        "Select a project type",
                      )}
                    </p>
                  )}
                </div>

                {/* Genre Preference */}
                <div>
                  <Label
                    htmlFor="genrePreference"
                    className="text-foreground font-semibold mb-1.5 block"
                  >
                    {t("Género musical", "Music genre")}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="genrePreference"
                    list="genre-suggestions"
                    {...register("genrePreference", { required: true })}
                    placeholder={t(
                      "Ej: Salsa, Reggaeton, Cumbia, Bachata...",
                      "E.g.: Salsa, Reggaeton, Cumbia, Bachata...",
                    )}
                    className="bg-background"
                    data-ocid="custom.genre_input"
                  />
                  <datalist id="genre-suggestions">
                    {GENRES.map((g) => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                  {errors.genrePreference && (
                    <p
                      className="text-destructive text-xs mt-1"
                      data-ocid="custom.genre.field_error"
                    >
                      {t("Campo requerido", "Required field")}
                    </p>
                  )}
                </div>

                {/* Style Description */}
                <div>
                  <Label
                    htmlFor="styleDescription"
                    className="text-foreground font-semibold mb-1.5 block"
                  >
                    {t("Descripción del estilo", "Style description")}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <textarea
                    id="styleDescription"
                    {...register("styleDescription", {
                      required: true,
                      minLength: 20,
                    })}
                    rows={4}
                    placeholder={t(
                      "Describe el ambiente, ritmo, instrumentos que imaginas, inspiraciones, uso final...",
                      "Describe the mood, rhythm, instruments you envision, inspirations, final use...",
                    )}
                    className="mt-0.5 w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors placeholder:text-muted-foreground"
                    data-ocid="custom.style_description_textarea"
                  />
                  {errors.styleDescription && (
                    <p
                      className="text-destructive text-xs mt-1"
                      data-ocid="custom.style_description.field_error"
                    >
                      {t("Mínimo 20 caracteres", "Minimum 20 characters")}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label
                    htmlFor="customerEmail"
                    className="text-foreground font-semibold mb-1.5 block"
                  >
                    {t("Tu email", "Your email")}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    {...register("customerEmail", {
                      required: true,
                      pattern: /^[^@]+@[^@]+\.[^@]+$/,
                    })}
                    placeholder="tu@email.com"
                    className="bg-background"
                    data-ocid="custom.email_input"
                  />
                  {errors.customerEmail && (
                    <p
                      className="text-destructive text-xs mt-1"
                      data-ocid="custom.email.field_error"
                    >
                      {t("Email válido requerido", "Valid email required")}
                    </p>
                  )}
                </div>

                {/* Budget Notes (optional) */}
                <div>
                  <Label
                    htmlFor="budgetNotes"
                    className="text-foreground font-semibold mb-1.5 block"
                  >
                    {t("Notas adicionales", "Additional notes")}{" "}
                    <span className="text-muted-foreground font-normal text-xs">
                      {t("(opcional)", "(optional)")}
                    </span>
                  </Label>
                  <Input
                    id="budgetNotes"
                    {...register("budgetNotes")}
                    placeholder={t(
                      "Presupuesto, plazo especial, referencias musicales...",
                      "Budget, special deadline, musical references...",
                    )}
                    className="bg-background"
                    data-ocid="custom.budget_notes_input"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold text-base rounded-xl py-6 transition-smooth gap-2"
                  disabled={isPending}
                  data-ocid="custom.submit_button"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                        className="inline-block"
                      >
                        ✦
                      </motion.span>
                      {t("Procesando...", "Processing...")}
                    </span>
                  ) : buyOpened ? (
                    <span className="flex items-center gap-2">
                      <ExternalLink size={18} />
                      {t("Abierto", "Opened")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t(
                        `Comprar Música Custom — ${priceInDollars.toFixed(2)} USD`,
                        `Buy Custom Music — ${priceInDollars.toFixed(2)} USD`,
                      )}
                      <ArrowRight size={20} />
                    </span>
                  )}
                </Button>

                <p className="text-muted-foreground text-xs text-center">
                  {t(
                    "Pago seguro vía Stripe. Recibirás tu música en 24 horas.",
                    "Secure payment via Stripe. You'll receive your music within 24 hours.",
                  )}
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
