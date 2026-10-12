import { Layout } from "@/components/Layout";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The generated Layout uses data-ocid rather than data-testid.
configure({ testIdAttribute: "data-ocid" });

// The global music player will be rendered inside Layout. These tests pin the
// current Layout behavior that must survive that change: header/nav/footer
// render, the language toggle, the cart button opening the cart sidebar, and
// children rendering without a blank screen.

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => ({
    loginStatus: "anonymous",
    login: vi.fn(),
    clear: vi.fn(),
  }),
}));

// Layout uses @tanstack/react-router's Link and useLocation. Render Link as a
// plain anchor so the nav/footer links are observable without a router.
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
  useLocation: () => ({ pathname: "/store" }),
}));

vi.mock("@/hooks/useQueries", () => ({
  useCheckout: () => ({ mutate: vi.fn(), isPending: false }),
  useValidateCoupon: () => ({ mutate: vi.fn(), isPending: false }),
  // The global player bar renders inside Layout and fetches the store catalog
  // via useTrackSummaries. Provide an empty catalog so the bar renders its
  // paused placeholder state without a backend.
  useTrackSummaries: () => ({ data: [], isLoading: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  localStorage.clear();
});

function renderLayout(children: React.ReactNode = <div>page content</div>) {
  return render(
    <LanguageProvider>
      <CartProvider>
        <Layout>{children}</Layout>
      </CartProvider>
    </LanguageProvider>,
  );
}

describe("Layout", () => {
  it("renders the header, nav links, and footer without a blank screen", () => {
    renderLayout();

    // Header logo and brand. The player bar's paused placeholder also shows
    // "Ritmo Raíz" as its title, so assert at least one occurrence.
    expect(screen.getAllByText("Ritmo Raíz").length).toBeGreaterThan(0);

    // Nav links render (Spanish default). Nav and footer both render these
    // labels, so assert at least one of each.
    expect(screen.getAllByText("Inicio").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tienda").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Música Custom").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);

    // Footer renders.
    expect(screen.getByText("Páginas")).toBeInTheDocument();
    expect(screen.getByText("Administrar")).toBeInTheDocument();

    // Children render.
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("toggles the language between Spanish and English", async () => {
    const user = userEvent.setup();
    renderLayout();

    // Defaults to Spanish.
    expect(screen.getAllByText("Tienda").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inicio").length).toBeGreaterThan(0);

    await user.click(screen.getByTestId("layout.language_toggle"));

    // Switches to English.
    expect(screen.getAllByText("Store").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
  });

  it("opens the cart sidebar when the cart button is clicked", async () => {
    const user = userEvent.setup();
    renderLayout();

    // Cart sidebar is closed initially.
    expect(screen.queryByText("Tu Carrito")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("layout.cart_button"));

    // Cart sidebar opens with its title.
    expect(screen.getByText("Tu Carrito")).toBeInTheDocument();
  });

  it("renders the floating cart button", () => {
    renderLayout();
    expect(
      screen.getByTestId("layout.floating_cart_button"),
    ).toBeInTheDocument();
  });

  it("shows the admin sign-in button when not signed in", () => {
    renderLayout();
    expect(screen.getByTestId("layout.sign_in_button")).toBeInTheDocument();
  });
});
