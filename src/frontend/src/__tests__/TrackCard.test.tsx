import type { LicenseTier, Track } from "@/backend";
import { TrackCard } from "@/components/TrackCard";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useQueries", () => ({
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

beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
  vi.stubGlobal("requestAnimationFrame", vi.fn());
});

const track: Track = {
  id: BigInt(1),
  title: { en: "Salsa Nights", es: "Noches de Salsa" },
  country: "Colombia",
  genre: "Salsa",
  artist: "Ritmo Raíz",
  sampleStartSec: BigInt(0),
  sampleEndSec: BigInt(25),
  isNewArrival: true,
  isFeatured: true,
  createdAt: BigInt(0),
  audioFile: {
    directURL: "https://example.com/sample.mp3",
    getDirectURL: () => "https://example.com/sample.mp3",
  } as unknown as Track["audioFile"],
  coverImage: {
    directURL: "https://example.com/cover.jpg",
    getDirectURL: () => "https://example.com/cover.jpg",
  } as unknown as Track["coverImage"],
};

const licenses: LicenseTier[] = [
  {
    id: BigInt(1),
    name: { en: "Personal", es: "Personal" },
    description: { en: "For individual use.", es: "Para uso individual." },
    priceUsd: BigInt(499),
  },
  {
    id: BigInt(2),
    name: { en: "Commercial", es: "Comercial" },
    description: { en: "For businesses.", es: "Para empresas." },
    priceUsd: BigInt(2999),
  },
];

function renderCard() {
  return render(
    <LanguageProvider>
      <CartProvider>
        <TrackCard track={track} licenses={licenses} />
      </CartProvider>
    </LanguageProvider>,
  );
}

describe("TrackCard", () => {
  it("renders track title, artist, genre, and country", () => {
    renderCard();
    expect(screen.getByText("Noches de Salsa")).toBeInTheDocument();
    expect(screen.getByText("Ritmo Raíz")).toBeInTheDocument();
    expect(screen.getByText("Salsa")).toBeInTheDocument();
    expect(screen.getByText("Colombia")).toBeInTheDocument();
  });

  it("renders an audio player that loads the track sample on demand", async () => {
    const user = userEvent.setup();
    renderCard();

    // The player mounts with no src: the sample is not fetched until play.
    const audio = document.querySelector("audio");
    expect(audio?.getAttribute("src")).toBeNull();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();

    // Tapping play loads the track's sample URL on demand.
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(audio?.getAttribute("src")).toBe("https://example.com/sample.mp3");
  });

  it("renders a buy button per license with the formatted price", () => {
    renderCard();
    expect(screen.getByText("$4.99")).toBeInTheDocument();
    expect(screen.getByText("$29.99")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Agregar Personal/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Agregar Comercial/i }),
    ).toBeInTheDocument();
  });

  it("opens the payment link when a buy button is clicked", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderCard();

    await user.click(screen.getByRole("button", { name: /Agregar Personal/i }));

    expect(openSpy).toHaveBeenCalledWith(
      "https://buy.example/personal",
      "_blank",
    );
    openSpy.mockRestore();
  });
});
