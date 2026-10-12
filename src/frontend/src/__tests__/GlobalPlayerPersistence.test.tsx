import type { TrackSummary } from "@/backend";
import { Layout } from "@/components/Layout";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The global player is mounted once inside Layout and must survive route
// navigation: the bar stays visible and playback continues when the page
// content changes. This renders Layout with one page, starts playback, then
// swaps the children (as a route change would) and asserts the bar is still
// mounted and still playing.

configure({ testIdAttribute: "data-ocid" });

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
  {
    id: BigInt(2),
    title: { en: "Cumbia Sunrise", es: "Amanecer Cumbia" },
    country: "Mexico",
    genre: "Cumbia",
    artist: "Ritmo Raíz",
    sampleStartSec: BigInt(0),
    sampleEndSec: BigInt(25),
    licenseTierId: BigInt(1),
    priceCents: BigInt(499),
    coverImageUrl: "https://example.com/cover2.jpg",
    audioSampleUrl: "https://example.com/sample2.mp3",
  },
];

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => ({
    loginStatus: "anonymous",
    login: vi.fn(),
    clear: vi.fn(),
  }),
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
  useLocation: () => ({ pathname: "/store" }),
}));

vi.mock("@/hooks/useQueries", () => ({
  useCheckout: () => ({ mutate: vi.fn(), isPending: false }),
  useValidateCoupon: () => ({ mutate: vi.fn(), isPending: false }),
  useTrackSummaries: () => ({ data: tracks, isLoading: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// The global player creates its <audio> element via `new Audio()` at module
// scope. Stub the constructor so playback state is observable.
class MockAudio {
  src = "";
  currentTime = 0;
  volume = 1;
  preload = "";
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  addEventListener() {}
  removeEventListener() {}
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("Audio", MockAudio);
});

function renderLayout(children: React.ReactNode) {
  return render(
    <LanguageProvider>
      <CartProvider>
        <Layout>{children}</Layout>
      </CartProvider>
    </LanguageProvider>,
  );
}

describe("global player persistence across navigation", () => {
  it("stays mounted and playing when the page content changes", async () => {
    const user = userEvent.setup();
    const { rerender } = renderLayout(<div>store page</div>);

    // The bar is present on the first page.
    expect(screen.getByTestId("global_player.bar")).toBeInTheDocument();

    // Start playback.
    await user.click(screen.getByTestId("global_player.play_pause_button"));
    expect(
      screen.getByTestId("global_player.play_pause_button"),
    ).toHaveAttribute("aria-label", "Pausar");

    // Navigate: swap the page content while Layout (and the player) stays
    // mounted, exactly as the router does when the route changes.
    rerender(
      <LanguageProvider>
        <CartProvider>
          <Layout>
            <div>dashboard page</div>
          </Layout>
        </CartProvider>
      </LanguageProvider>,
    );

    // The bar is still mounted and still playing after navigation.
    expect(screen.getByTestId("global_player.bar")).toBeInTheDocument();
    expect(
      screen.getByTestId("global_player.play_pause_button"),
    ).toHaveAttribute("aria-label", "Pausar");
    expect(screen.getByText("dashboard page")).toBeInTheDocument();
  });
});
