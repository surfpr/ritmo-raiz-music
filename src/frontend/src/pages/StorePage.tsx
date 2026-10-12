import { AisleHeader } from "@/components/AisleHeader";
import { AisleSortControl } from "@/components/AisleSortControl";
import { CountryDirectory } from "@/components/CountryDirectory";
import {
  EMPTY_FILTERS,
  FILTER_COUNTRIES,
  FilterPanel,
  type FilterState,
  MOODS,
  PRICE_RANGES,
  RECOMMENDED_USES,
  TEMPOS,
  VOCAL_TYPES,
  countActiveFilters,
} from "@/components/FilterPanel";
import { GenreAisleDirectory } from "@/components/GenreAisleDirectory";
import { InstrumentalArea } from "@/components/InstrumentalArea";
import { Pagination } from "@/components/Pagination";
import {
  type RefinementChip,
  RefinementChips,
} from "@/components/RefinementChips";
import { StoreSearchBar } from "@/components/StoreSearchBar";
import { StorefrontHero } from "@/components/StorefrontHero";
import { TrackCard } from "@/components/TrackCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { stopAllAudio } from "@/hooks/useAudioPrefetch";
import { applyFilters } from "@/hooks/useFilteredTracks";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useCheckoutReturn,
  useFeaturedTracks,
  useLicenseTiers,
  useNewArrivalTracks,
  useRecordSale,
  useTrackSummaries,
} from "@/hooks/useQueries";
import { useStorePagination } from "@/hooks/useStorePagination";
import { type AisleSort, useStoreRoute } from "@/hooks/useStoreRoute";
import {
  buildAisleDirectory,
  buildInstrumentalGroups,
  genreLabel,
} from "@/lib/genreAisles";
import {
  Disc3,
  Filter,
  Music,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/** Sorts an aisle's tracks according to the selected sort control. */
function sortTracks(
  tracks: ReturnType<typeof applyFilters>,
  sort: AisleSort,
): ReturnType<typeof applyFilters> {
  const sorted = [...tracks];
  switch (sort) {
    case "title":
      sorted.sort((a, b) => a.title.es.localeCompare(b.title.es, "es"));
      break;
    case "price-asc":
      sorted.sort((a, b) => Number(a.priceCents) - Number(b.priceCents));
      break;
    case "price-desc":
      sorted.sort((a, b) => Number(b.priceCents) - Number(a.priceCents));
      break;
    default:
      // "newest": the catalog arrives newest-first from the backend.
      break;
  }
  return sorted;
}

export default function StorePage() {
  const { t } = useLanguage();
  const { data: tracks, isLoading } = useTrackSummaries();
  const { data: licenses } = useLicenseTiers();
  const { data: featuredTracks, isLoading: featuredLoading } =
    useFeaturedTracks();
  const { data: newArrivalTracks, isLoading: newArrivalsLoading } =
    useNewArrivalTracks();
  const recordSale = useRecordSale();
  useCheckoutReturn();

  const {
    genre,
    search,
    sort,
    page,
    refinements,
    setGenre,
    setSearch,
    setSort,
    setPage,
    setRefinements,
    clearRefinements,
  } = useStoreRoute();

  const [mobileOpen, setMobileOpen] = useState(false);

  const catalog = tracks ?? [];
  const aisles = useMemo(() => buildAisleDirectory(catalog), [catalog]);
  const instrumentalGroups = useMemo(
    () => buildInstrumentalGroups(catalog),
    [catalog],
  );

  // Shelves read exactly the backend-flagged songs, never a client-side
  // top-6-by-price / first-6 derivation.
  const featured = featuredTracks ?? [];
  const newArrivals = newArrivalTracks ?? [];

  // Release any playing preview when leaving the store page.
  useEffect(() => {
    return () => stopAllAudio();
  }, []);

  // Handle Stripe Payment Link return: record sales automatically.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const paymentStatus = sp.get("payment_status");

    if (paymentStatus === "cancelled") {
      sp.delete("payment_status");
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${sp.toString() ? `?${sp.toString()}` : ""}`,
      );
      return;
    }

    if (
      paymentStatus === "success" ||
      sp.get("success") === "1" ||
      sp.get("success") === "true"
    ) {
      sp.delete("payment_status");
      sp.delete("success");

      const trackIdParam = sp.get("track_id");
      const licenseTypeParam = sp.get("license_type");
      const trackTitleParam = sp.get("track_title");
      const amountParam = sp.get("amount");

      const trackId = trackIdParam ? BigInt(trackIdParam) : null;
      const licenseTierId = licenseTypeParam ? BigInt(licenseTypeParam) : null;
      const trackTitle =
        trackTitleParam ?? t("Compra en tienda", "Store purchase");
      const amountCents = amountParam ? BigInt(amountParam) : BigInt(499);

      recordSale.mutate(
        {
          trackId,
          licenseTierId,
          isCustomMusic: false,
          amountCents,
          customerEmail: "",
          trackTitle,
          licenseTierName: licenseTypeParam ?? t("Licencia", "License"),
        },
        {
          onSuccess: () => {
            toast.success(
              t(
                "¡Compra registrada! Gracias por tu apoyo.",
                "Purchase recorded! Thank you for your support.",
              ),
            );
          },
          onError: () => {
            // Silently fail — sale recording is best-effort on return.
          },
        },
      );

      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${sp.toString() ? `?${sp.toString()}` : ""}`,
      );
    }
  }, [recordSale.mutate, t]);

  // ── Aisle view: filter the catalog to the selected genre, then refine ──────
  const aisleFilters = useMemo<FilterState>(
    () => ({ ...refinements, genre }),
    [refinements, genre],
  );
  const aisleTracks = useMemo(
    () => sortTracks(applyFilters(catalog, aisleFilters, search), sort),
    [catalog, aisleFilters, search, sort],
  );

  const {
    page: safePage,
    totalPages,
    start,
    end,
    goToPage,
  } = useStorePagination(aisleTracks.length, page, setPage);
  const pageItems = aisleTracks.slice(start, end);

  const activeRefinementCount = countActiveFilters(refinements);

  const getLabelForValue = useCallback(
    (key: keyof FilterState, value: string): string => {
      const find = (
        list: { value: string; es: string; en: string }[],
      ): string => {
        const opt = list.find((v) => v.value === value);
        return opt ? t(opt.es, opt.en) : value;
      };
      if (key === "vocalTypes") return find(VOCAL_TYPES);
      if (key === "moods") return find(MOODS);
      if (key === "tempos") return find(TEMPOS);
      if (key === "recommendedUses") return find(RECOMMENDED_USES);
      if (key === "priceRanges") return find(PRICE_RANGES);
      return value;
    },
    [t],
  );

  const refinementChips: RefinementChip[] = useMemo(() => {
    const chips: RefinementChip[] = [];
    if (refinements.country)
      chips.push({
        key: "country",
        value: refinements.country,
        label: refinements.country,
      });
    for (const v of refinements.vocalTypes)
      chips.push({
        key: "vocalTypes",
        value: v,
        label: getLabelForValue("vocalTypes", v),
      });
    for (const v of refinements.moods)
      chips.push({
        key: "moods",
        value: v,
        label: getLabelForValue("moods", v),
      });
    for (const v of refinements.tempos)
      chips.push({
        key: "tempos",
        value: v,
        label: getLabelForValue("tempos", v),
      });
    for (const v of refinements.recommendedUses)
      chips.push({
        key: "recommendedUses",
        value: v,
        label: getLabelForValue("recommendedUses", v),
      });
    for (const v of refinements.priceRanges)
      chips.push({
        key: "priceRanges",
        value: v,
        label: getLabelForValue("priceRanges", v),
      });
    return chips;
  }, [refinements, getLabelForValue]);

  const removeRefinement = useCallback(
    (chip: RefinementChip) => {
      if (chip.key === "country") {
        setRefinements({ ...refinements, country: "" });
        return;
      }
      const key = chip.key as
        | "vocalTypes"
        | "moods"
        | "tempos"
        | "recommendedUses"
        | "priceRanges";
      setRefinements({
        ...refinements,
        [key]: refinements[key].filter((v) => v !== chip.value),
      });
    },
    [refinements, setRefinements],
  );

  const handleSelectAisle = useCallback(
    (value: string) => {
      setGenre(value);
      setSearch("");
      setRefinements(EMPTY_FILTERS);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setGenre, setSearch, setRefinements],
  );

  const handleBackToStorefront = useCallback(() => {
    setGenre("");
    setRefinements(EMPTY_FILTERS);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setGenre, setRefinements]);

  const handleSelectCountry = useCallback(
    (country: string) => {
      setGenre("");
      setSearch("");
      setRefinements({ ...EMPTY_FILTERS, country });
      document
        .getElementById("storefront-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [setGenre, setSearch, setRefinements],
  );

  const handleHeroSearchSubmit = useCallback(() => {
    document
      .getElementById("storefront-results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handlePlayFeatured = useCallback(() => {
    // The persistent global player owns playback; scrolling to the featured
    // anchor lets the user start it from the card's own preview control.
    document
      .getElementById("featured")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const isAisleView = genre !== "";
  const isCountryBrowse = !isAisleView && refinements.country !== "";
  const isStorefrontSearch =
    !isAisleView && !isCountryBrowse && search.trim() !== "";

  // Storefront results: matching tracks across the whole catalog, shown only
  // while a search query or a country browse is active. This is a results
  // view, never a flat grid of the entire catalog.
  const storefrontResults = useMemo(
    () => applyFilters(catalog, refinements, search),
    [catalog, refinements, search],
  );

  return (
    <div className="min-h-screen bg-background store-safe-bottom">
      {isAisleView ? (
        <>
          <AisleHeader
            genre={genre}
            count={aisleTracks.length}
            onBackToStorefront={handleBackToStorefront}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* In-aisle search + sort + mobile filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
              <div className="flex-1 min-w-0">
                <StoreSearchBar
                  value={search}
                  onChange={setSearch}
                  placeholderEs={`Buscar en ${genreLabel(genre, "es")}…`}
                  placeholderEn={`Search in ${genreLabel(genre, "en")}…`}
                  ocid="aisle.search_input"
                />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <AisleSortControl value={sort} onChange={setSort} />
                <Button
                  type="button"
                  variant="outline"
                  className="lg:hidden relative flex items-center gap-2 border-border shrink-0"
                  onClick={() => setMobileOpen(true)}
                  data-ocid="aisle.mobile_filter_button"
                >
                  <SlidersHorizontal size={16} />
                  <span>{t("Refinar", "Refine")}</span>
                  {activeRefinementCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {activeRefinementCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            <RefinementChips
              chips={refinementChips}
              onRemove={removeRefinement}
              onClearAll={clearRefinements}
            />

            <div className="flex gap-6 items-start">
              {/* Desktop refinement drawer */}
              <aside
                className="hidden lg:block w-[280px] shrink-0 sticky top-6"
                data-ocid="aisle.filter_drawer"
              >
                <div className="filter-drawer overflow-hidden">
                  <div className="px-4 py-3 border-b border-drawer-border/60 flex items-center gap-2">
                    <Filter size={15} className="text-accent" />
                    <h2 className="text-sm font-bold text-foreground tracking-wide uppercase">
                      {t("Refinar", "Refine")}
                    </h2>
                  </div>
                  <div className="p-4">
                    <FilterPanel
                      filters={refinements}
                      onChange={setRefinements}
                      showGenre={false}
                    />
                  </div>
                </div>
              </aside>

              {/* Aisle shelf */}
              <div className="flex-1 min-w-0">
                {isLoading ? (
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                    data-ocid="aisle.tracks.loading_state"
                  >
                    {Array.from(
                      { length: 9 },
                      (_, i) => `aisle-track-skeleton-${i}`,
                    ).map((id) => (
                      <Skeleton key={id} className="h-80 rounded-2xl" />
                    ))}
                  </div>
                ) : pageItems.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {pageItems.map((track, i) => (
                        <motion.div
                          key={String(track.id)}
                          initial={{ opacity: 0, y: 18 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.35, delay: (i % 9) * 0.04 }}
                          data-ocid={`aisle.track.item.${i + 1}`}
                        >
                          <TrackCard track={track} licenses={licenses ?? []} />
                        </motion.div>
                      ))}
                    </div>
                    <Pagination
                      page={safePage}
                      totalPages={totalPages}
                      start={start}
                      end={end}
                      total={aisleTracks.length}
                      onPageChange={goToPage}
                    />
                  </>
                ) : (
                  <div className="empty-state" data-ocid="aisle.empty_state">
                    <Disc3 size={44} className="empty-state-icon" />
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {t(
                        "No hay canciones en este pasillo",
                        "No songs in this aisle",
                      )}
                    </h3>
                    <p className="text-muted-foreground max-w-sm">
                      {t(
                        "Prueba quitar refinamientos o busca en otro pasillo.",
                        "Try clearing refinements or browsing another aisle.",
                      )}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                      {activeRefinementCount > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={clearRefinements}
                          data-ocid="aisle.empty_clear_refinements_button"
                        >
                          {t("Limpiar refinamientos", "Clear refinements")}
                        </Button>
                      )}
                      <Button
                        type="button"
                        className="bg-gradient-primary text-primary-foreground border-0"
                        onClick={handleBackToStorefront}
                        data-ocid="aisle.empty_back_button"
                      >
                        {t("Volver a la tienda", "Back to storefront")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <StorefrontHero
            featured={featured}
            isLoading={isLoading}
            licenses={licenses ?? []}
            search={search}
            onSearchChange={setSearch}
            onSearchSubmit={handleHeroSearchSubmit}
            onBrowseAisles={() =>
              document
                .getElementById("aisles")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            onPlayFeatured={handlePlayFeatured}
          />

          {/* Storefront results — shown while a search query or country browse
              is active. Never a flat grid of the entire catalog. */}
          {(isStorefrontSearch || isCountryBrowse) && (
            <section
              id="storefront-results"
              className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 scroll-mt-20"
              data-ocid="storefront.search_results"
            >
              <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                <div>
                  <p className="store-eyebrow mb-2">
                    {isCountryBrowse
                      ? t("País", "Country")
                      : t("Resultados", "Results")}
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                    {isCountryBrowse
                      ? refinements.country
                      : t("Coincidencias", "Matches")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    clearRefinements();
                  }}
                  className="text-sm text-muted-foreground underline hover:text-foreground transition-smooth"
                  data-ocid="storefront.search_results.clear_button"
                >
                  {t("Volver a la tienda", "Back to storefront")}
                </button>
              </div>

              {isLoading ? (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  data-ocid="storefront.search_results.loading_state"
                >
                  {Array.from(
                    { length: 6 },
                    (_, i) => `storefront-result-skeleton-${i}`,
                  ).map((id) => (
                    <Skeleton key={id} className="h-80 rounded-2xl" />
                  ))}
                </div>
              ) : storefrontResults.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isCountryBrowse
                      ? t(
                          `${storefrontResults.length} canciones de ${refinements.country}`,
                          `${storefrontResults.length} songs from ${refinements.country}`,
                        )
                      : t(
                          `${storefrontResults.length} canciones para “${search}”`,
                          `${storefrontResults.length} songs for “${search}”`,
                        )}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {storefrontResults.map((track, i) => (
                      <motion.div
                        key={String(track.id)}
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: (i % 9) * 0.04 }}
                        data-ocid={`storefront.search_result.item.${i + 1}`}
                      >
                        <TrackCard track={track} licenses={licenses ?? []} />
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <div
                  className="empty-state"
                  data-ocid="storefront.search_results.empty_state"
                >
                  <Search size={44} className="empty-state-icon" />
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {isCountryBrowse
                      ? t(
                          "Sin canciones de este país",
                          "No songs from this country",
                        )
                      : t("Sin coincidencias", "No matches")}
                  </h3>
                  <p className="text-muted-foreground max-w-sm">
                    {t(
                      "Prueba con otro título o artista, o explora los pasillos.",
                      "Try another title or artist, or browse the aisles.",
                    )}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        clearRefinements();
                      }}
                      data-ocid="storefront.search_results.empty_clear_button"
                    >
                      {t("Limpiar búsqueda", "Clear search")}
                    </Button>
                    <Button
                      type="button"
                      className="bg-gradient-primary text-primary-foreground border-0"
                      onClick={() =>
                        document.getElementById("aisles")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        })
                      }
                      data-ocid="storefront.search_results.empty_browse_button"
                    >
                      {t("Ver pasillos", "Browse aisles")}
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* New arrivals shelf */}
          {!isStorefrontSearch && !isCountryBrowse && (
            <section
              id="new-arrivals"
              className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 scroll-mt-20"
              data-ocid="storefront.new_arrivals"
            >
              <div className="shelf">
                <div className="shelf-head">
                  <h2 className="shelf-title">
                    {t("Nuevos lanzamientos", "New arrivals")}
                  </h2>
                  <span className="aisle-count">
                    {t("RECIÉN LLEGADO", "JUST IN")}
                  </span>
                </div>
                {newArrivalsLoading ? (
                  <div className="shelf-rail">
                    {Array.from(
                      { length: 4 },
                      (_, i) => `new-arrival-skeleton-${i}`,
                    ).map((id) => (
                      <Skeleton key={id} className="h-72 w-56 rounded-2xl" />
                    ))}
                  </div>
                ) : newArrivals.length > 0 ? (
                  <div className="shelf-rail">
                    {newArrivals.map((track) => (
                      <div key={String(track.id)} className="w-56">
                        <TrackCard track={track} licenses={licenses ?? []} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-5 pb-5 text-sm text-muted-foreground">
                    {t(
                      "Pronto llegarán nuevas canciones.",
                      "New songs are on the way.",
                    )}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Featured shelf */}
          {!isStorefrontSearch && !isCountryBrowse && (
            <section
              id="featured"
              className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 scroll-mt-20"
              data-ocid="storefront.featured"
            >
              <div className="shelf">
                <div className="shelf-head">
                  <h2 className="shelf-title">{t("Destacadas", "Featured")}</h2>
                  <span className="aisle-count">{t("SELECCIÓN", "PICKS")}</span>
                </div>
                {featuredLoading ? (
                  <div className="shelf-rail">
                    {Array.from(
                      { length: 4 },
                      (_, i) => `featured-skeleton-${i}`,
                    ).map((id) => (
                      <Skeleton key={id} className="h-72 w-56 rounded-2xl" />
                    ))}
                  </div>
                ) : featured.length > 0 ? (
                  <div className="shelf-rail">
                    {featured.map((track) => (
                      <div key={String(track.id)} className="w-56">
                        <TrackCard track={track} licenses={licenses ?? []} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-5 pb-5 text-sm text-muted-foreground">
                    {t(
                      "Aún no hay canciones destacadas.",
                      "No featured tracks yet.",
                    )}
                  </p>
                )}
              </div>
            </section>
          )}

          {!isStorefrontSearch && !isCountryBrowse && (
            <GenreAisleDirectory
              aisles={aisles}
              isLoading={isLoading}
              onSelect={handleSelectAisle}
            />
          )}

          {!isStorefrontSearch && !isCountryBrowse && (
            <InstrumentalArea
              groups={instrumentalGroups}
              isLoading={isLoading}
              licenses={licenses ?? []}
              onSelectGenre={handleSelectAisle}
            />
          )}

          {!isStorefrontSearch && !isCountryBrowse && (
            <CountryDirectory
              countries={FILTER_COUNTRIES}
              isLoading={isLoading}
              onSelect={handleSelectCountry}
            />
          )}
        </>
      )}

      {/* Mobile refinement sheet (aisle view only) */}
      <AnimatePresence>
        {isAisleView && mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              data-ocid="aisle.mobile_filter_overlay"
            />
            <motion.div
              className="fixed top-0 left-0 h-full w-[300px] max-w-[90vw] bg-drawer-bg z-50 lg:hidden overflow-y-auto shadow-2xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              data-ocid="aisle.mobile_filter_sheet"
            >
              <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-drawer-bg z-10">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-accent" />
                  <span className="font-semibold text-foreground">
                    {t("Refinar", "Refine")}
                  </span>
                  {activeRefinementCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {activeRefinementCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="p-1 rounded-md hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen(false)}
                  aria-label={t("Cerrar", "Close")}
                  data-ocid="aisle.mobile_filter_close_button"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4">
                <FilterPanel
                  filters={refinements}
                  onChange={setRefinements}
                  showGenre={false}
                />
              </div>

              <div className="sticky bottom-0 bg-drawer-bg border-t border-border p-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 text-sm"
                  onClick={clearRefinements}
                  data-ocid="aisle.mobile_clear_refinements_button"
                >
                  {t("Limpiar", "Clear")}
                </Button>
                <Button
                  type="button"
                  className="flex-1 text-sm bg-gradient-primary text-primary-foreground border-0"
                  onClick={() => setMobileOpen(false)}
                  data-ocid="aisle.mobile_apply_refinements_button"
                >
                  {t(
                    `Ver ${aisleTracks.length} resultados`,
                    `View ${aisleTracks.length} results`,
                  )}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Storefront empty-catalog fallback */}
      {!isAisleView && !isLoading && catalog.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <div className="empty-state" data-ocid="storefront.empty_state">
            <Music size={44} className="empty-state-icon" />
            <h3 className="font-display text-xl font-bold text-foreground">
              {t("La tienda está vacía", "The store is empty")}
            </h3>
            <p className="text-muted-foreground">
              {t(
                "Vuelve pronto para descubrir nuevos pasillos.",
                "Check back soon to discover new aisles.",
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
