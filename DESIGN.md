# Design Brief — Ritmo Raiz Store: La Bodega

## Direction
La Bodega — a curated Latin record-store front-of-house that replaces the flat grid with a storefront plus genre "aisles" rendered as vinyl crates. Extends the existing dark terracotta/gold OKLCH system additively; nothing outside the store changes.

## Tone
Warm, tactile, crate-digger editorial: near-black shelves lit by a terracotta hero wash and gold accents, with mono catalogue labels that read like record-sleeve spines.

## Differentiation
The **crate spine** — a 6px genre-colored vertical tab on the left edge of every aisle card and shelf header — plus a per-genre spine palette, so browsing feels like flipping through physical crates, not scrolling a grid.

## Color Palette (existing preserved + additive store tokens)
| Token                  | OKLCH        | Role                                  |
| ---------------------- | ------------ | ------------------------------------- |
| background             | 0.14 0.02 50 | Dark charcoal base                    |
| foreground             | 0.92 0.01 60 | Off-white text                        |
| card                   | 0.18 0.018 50| Elevated surfaces                     |
| primary                | 0.65 0.25 20 | Terracotta CTA / active               |
| accent                 | 0.72 0.22 55 | Gold focus / eyebrow / chip border    |
| muted-foreground       | 0.55 0.01 50 | Counts, breadcrumb, meta              |
| store-hero             | 0.2 0.05 30  | Storefront hero band base             |
| aisle-surface          | 0.19 0.022 48| Aisle card surface                    |
| aisle-surface-hover    | 0.23 0.028 46| Aisle card hover lift                 |
| aisle-border           | 0.3 0.03 48  | Card / shelf borders                  |
| aisle-art              | 0.26 0.03 46 | Cover-art tile placeholder            |
| shelf-bg               | 0.17 0.02 50 | Shelf lane surface                    |
| drawer-bg              | 0.17 0.02 50 | Filter drawer surface                 |
| chip-bg                | 0.24 0.04 30 | Active-refinement chip fill           |
| genre-1..6             | see index.css| Per-genre crate spine hues            |

## Typography (existing — UNCHANGED)
- Display: Bricolage Grotesque — hero title, aisle name, shelf title (700, tight tracking)
- Body: Plus Jakarta Sans — descriptions, labels, chips (400–600)
- Mono: Geist Mono — track counts, breadcrumb, eyebrow (tabular-nums, wide tracking)
- Scale: hero `text-4xl md:text-6xl`, shelf title `text-xl md:text-2xl`, aisle name `text-lg`, label `text-xs uppercase tracking-widest`, body `text-sm md:text-base`

## Elevation & Depth
Layered depth: hero band uses a terracotta radial glow + sheen; aisle cards sit on `shadow-aisle`, lifting to `shadow-aisle-hover` on hover; shelves are flat bordered lanes; drawer floats over content. No glow — warm shadow only.

## Structural Zones
| Zone              | Background        | Border   | Notes                                          |
| ----------------- | ----------------- | -------- | ---------------------------------------------- |
| Header (existing) | card              | border-b | Unchanged                                      |
| Hero band         | store-hero + glow | border-b | Storefront front door, featured track anchor   |
| New arrivals      | shelf-bg          | border   | Horizontal scroll lane, mono count            |
| Aisle directory   | background        | —        | Responsive grid of aisle cards (2/3/4 cols)    |
| Aisle header      | aisle-header-bg   | border-b | Breadcrumb + genre name + track count          |
| Aisle content     | background        | —        | Filter drawer + track shelf, paginated         |
| Player bar        | player-glass      | border-t | Fixed bottom, z-50, always above store content |

## Spacing & Rhythm
Page container max-w 1400px, px-4 md:px-8. Hero py-16 md:py-24. Section gaps `space-y-12 md:space-y-16`. Shelf lanes gap-4, cards gap-4/6. Store root uses `store-safe-bottom` so the fixed player bar never obscures content. Micro: chips gap-2, breadcrumb gap-2.

## Component Patterns
- Aisle card: rounded-xl, 6px genre spine, square cover-art tile with bottom scrim, name + mono count; hover lifts 4px and golds the border
- Shelf row: bordered rounded lane, display title + mono count, horizontal snap scroll, thin custom scrollbar
- Refinement chip: pill, chip-bg fill, gold-tinted border, removable × that scales + reddens on hover
- Filter drawer: desktop sticky side panel / mobile slide-in (`drawer-in-right`), never exposes a full-grid view
- Sort control: compact mono-labelled select (newest, title A-Z, price low-high, price high-low)
- Empty state: dashed-border panel, muted icon, copy + CTA back to storefront / other aisles

## Motion
- Entrance: aisle cards `aisle-rise` staggered; shelf items `shelf-glide`; spine `spine-grow`
- Hover: card lift 4px + border-gold, chip × scale 1.15, breadcrumb gold, transition-smooth
- Decorative: player eq-bounce preserved; no motion added outside the store

## Constraints
- Store redesign ONLY — header, footer, cart, checkout, Stripe return, player unchanged
- Extend existing tokens additively; never replace base tokens or fonts
- No full-grid fallback — the flat grid is fully replaced by storefront + aisles
- Dark theme only; bilingual ES (default) / EN labels via t(es, en)
- Persistent fixed-bottom player bar must always remain visible and unobstructed
- Do NOT build mood/occasion shelves or a recently-viewed rail

## Signature Detail
The genre-colored crate spine running down the left edge of every aisle card and shelf header — a tactile record-crate cue that turns genre browsing into an act of flipping through sleeves.
