import { CartSidebar } from "@/components/CartSidebar";
import { GlobalPlayerBar } from "@/components/GlobalPlayerBar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useLocation } from "@tanstack/react-router";
import { Globe, Music2, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";

const NAV_LINKS = [
  { to: "/", labelEs: "Inicio", labelEn: "Home" },
  { to: "/store", labelEs: "Tienda", labelEn: "Store" },
  { to: "/custom-music", labelEs: "Música Custom", labelEn: "Custom Music" },
  { to: "/dashboard", labelEs: "Dashboard", labelEn: "Dashboard" },
] as const;

const FOOTER_EXTRA_LINKS = [
  { to: "/policies", labelEs: "Políticas Legales", labelEn: "Legal Policies" },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  const { lang, toggle, t } = useLanguage();
  const { loginStatus, login } = useInternetIdentity();
  const { count, openCart } = useCart();
  const location = useLocation();

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <div className="flex flex-col min-h-screen pb-32 sm:pb-24">
      {/* Header */}
      <header
        className="bg-card border-b border-border sticky top-0 z-50 shadow-xs"
        data-ocid="layout.header"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            data-ocid="layout.logo_link"
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md group-hover:bg-primary/90 transition-smooth">
              <Music2 size={20} className="text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-foreground text-sm leading-none">
                Ritmo Raíz
              </div>
              <div className="text-muted-foreground text-xs">Music V2</div>
            </div>
          </Link>

          {/* Nav */}
          <nav
            className="hidden md:flex items-center gap-1"
            data-ocid="layout.nav"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-smooth",
                  isActive(link.to)
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
                data-ocid={`layout.nav.${link.to.replace("/", "") || "home"}_link`}
              >
                {t(link.labelEs, link.labelEn)}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggle}
              className="gap-1.5 text-sm font-medium"
              data-ocid="layout.language_toggle"
            >
              <Globe size={16} />
              <span>{lang.toUpperCase()}</span>
            </Button>

            {/* Admin sign in */}
            {loginStatus !== "success" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => login()}
                className="text-xs hidden sm:flex"
                data-ocid="layout.sign_in_button"
              >
                Admin
              </Button>
            )}
            {loginStatus === "success" && (
              <Link to="/admin" data-ocid="layout.admin_link">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs hidden sm:flex"
                >
                  Admin Panel
                </Button>
              </Link>
            )}

            {/* Cart button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={openCart}
              className="relative gap-1.5"
              aria-label={t("Abrir carrito", "Open cart")}
              data-ocid="layout.cart_button"
            >
              <ShoppingBag size={18} />
              {count > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold h-[18px] min-w-[18px] px-1 rounded-full flex items-center justify-center"
                  data-ocid="layout.cart_count"
                >
                  {count}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer
        className="bg-card border-t border-border py-10 px-6"
        data-ocid="layout.footer"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Music2 size={16} className="text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-foreground">
                  Ritmo Raíz Music V2
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(
                  "La primera tienda de música latina generada con IA.",
                  "The first AI-generated Latin music store.",
                )}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">
                {t("Páginas", "Pages")}
              </h4>
              <div className="space-y-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-smooth"
                    data-ocid={`layout.footer.${link.to.replace("/", "") || "home"}_link`}
                  >
                    {t(link.labelEs, link.labelEn)}
                  </Link>
                ))}
                {FOOTER_EXTRA_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-smooth"
                    data-ocid={`layout.footer.${link.to.replace("/", "")}_link`}
                  >
                    {t(link.labelEs, link.labelEn)}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">
                {t("Administrar", "Admin")}
              </h4>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-smooth text-left"
                onClick={() =>
                  loginStatus !== "success" ? login() : undefined
                }
                data-ocid="layout.footer.admin_link"
              >
                {loginStatus === "success" ? (
                  <Link to="/admin">Admin Panel →</Link>
                ) : (
                  <span>{t("Acceder al panel", "Sign in to admin")} →</span>
                )}
              </button>
            </div>
          </div>
          {/* AI disclaimer */}
          <div className="border-t border-border pt-5 pb-3">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {t(
                "Toda la música es generada por IA y se vende bajo licencia de uso, no de copyright.",
                "All music is AI-generated and sold under a use license, not copyright.",
              )}
            </p>
          </div>
          <div className="border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* ICP badge */}
            <a
              href="https://internetcomputer.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[oklch(0.35_0.12_280)] hover:bg-[oklch(0.40_0.14_280)] border border-[oklch(0.50_0.18_280)] text-[oklch(0.92_0.08_280)] text-xs font-semibold px-3 py-1.5 rounded-full transition-colors duration-200"
              data-ocid="layout.footer.icp_badge"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="16" cy="16" r="16" fill="oklch(0.55 0.22 280)" />
                <ellipse
                  cx="16"
                  cy="16"
                  rx="12"
                  ry="5.5"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                />
                <circle cx="16" cy="16" r="3" fill="white" />
              </svg>
              Hosted on the Internet Computer
            </a>
            <p className="text-xs text-muted-foreground">
              Built with love using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Floating cart button */}
      <button
        type="button"
        onClick={openCart}
        className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-smooth flex items-center justify-center"
        aria-label={t("Abrir carrito", "Open cart")}
        data-ocid="layout.floating_cart_button"
      >
        <ShoppingBag size={22} />
        {count > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-card"
            data-ocid="layout.floating_cart_count"
          >
            {count}
          </span>
        )}
      </button>

      {/* Cart drawer */}
      <CartSidebar />

      {/* Global player bar */}
      <GlobalPlayerBar />
    </div>
  );
}
