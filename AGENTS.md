# Project Guidance

## User Preferences

- Bilingual Spanish (default) and English interface
- Store anchored on genre aisles as browsable shelves
- Replace the 'Subida Masiva' tab; derive title and genre from the uploaded filename
- Trap Latino and Reggaeton merge into a single 'Reggaeton' name
- Sacra music is religious music and is not part of the Instrumental area
- Instrumental area groups songs by their existing genre
- Destacadas and New Arrivals checkmarks write the featured / new-arrival flags that the store shelves read
- Pasillo por País covers all Latin countries plus Puerto Rico and España

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- Store route state (genre/q/sort/page plus refinements country/vocal/mood/tempo/use/price) is owned by src/frontend/src/hooks/useStoreRoute.ts and synced to the URL; keep new store state there so aisle views stay refresh-safe.
- The store is a curated genre-aisle experience: StorePage renders a storefront (hero + new arrivals + featured + genre aisle directory) and drills into a genre-scoped aisle view; there is intentionally no flat all-catalog grid.
- Genre values in GENRE_AISLES (src/frontend/src/lib/genreAisles.ts) must match FilterPanel.FILTER_GENRES exactly; genre is a plain string in backend.d.ts.
- FilterPanel accepts a showGenre prop (default true); the in-aisle refinement drawer passes showGenre={false} so no dead genre control appears inside a genre-scoped aisle.
- Store content must use the store-safe-bottom utility to stay clear of the fixed global player bar.
- Test suites that set a custom testIdAttribute at module scope leak into other suites under Vitest singleFork; declare testIdAttribute per suite to stay order-independent.
- React Query invalidateQueries matches by key prefix, so ['tracks'] does not cover ['trackSummaries']; catalog mutations must invalidate both keys explicitly.
- buildInstrumentalGroups must skip Sacra explicitly since it iterates all GENRE_AISLES; Sacra is religious music excluded from the Instrumental area.
- listFeaturedTracks/listNewArrivalTracks return full Track[] (ExternalBlob covers) while listTracksPage returns TrackSummary[] with URL strings; resolve covers via getBlobUrl for Track and coverImageUrl for TrackSummary.
- Genre is a plain Text field; folding legacy 'Trap Latino' into 'Reggaeton' is a presentation concern handled by a normalizeGenre helper used by buildAisleDirectory, applyFilters, findAisle, and genreLabel.
- Instrumental songs are identified by vocalType === 'Instrumental' (from filterConstants.VOCAL_TYPES); the Instrumental area groups them by their existing genre via buildInstrumentalGroups.
- updateTrack requires a full TrackInput; build it from the existing Track and override only the toggled flag, leaving audioFile undefined so the backend keeps the current file.
- The admin genre-upload tab is 'Subir por Género' / 'Upload by Genre' and derives per-file title and genre from the filename, falling back to the selected target genre.
- The admin genre-upload file input accepts only audio/*, so the local preflight tester cannot exercise upload with its built-in image fixture; upload flows need an audio fixture to be runtime-verified.
