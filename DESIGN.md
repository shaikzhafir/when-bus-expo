# Design

Visual system for When Bus. Tokens live in `app/theme.ts`; shared styles in `app/styles.ts`. React Native StyleSheet does not parse `oklch()`, so colours are authored in OKLCH (kept in comments) and committed as hex.

## Theme

Light, warm, high-contrast. Scene: a commuter glancing at the next-bus number on a sunny open-air platform, phone at arm's length. That forces a light surface, near-black ink, and large tabular numerals over any dark or low-contrast option.

## Color

Strategy: **Restrained**. Tinted warm neutrals plus one committed accent. Colour carries meaning, never decoration.

### Surfaces (warm, never pure white)
- `bg` `#FAF7F2` — app background, oklch(97.5% 0.006 75)
- `surface` `#FFFDFA` — cards
- `surfaceSunk` `#F1ECE3` — chips, wells, icon buttons
- `hairline` `#E6DFD4` — 1px full borders (never side-stripes)

### Ink (warm near-black)
- `ink` `#241F1A` — primary text and the hero numbers
- `inkMuted` `#6F665B` — secondary text
- `inkFaint` `#9A9085` — tertiary / stale

### Accent — one colour, vermilion
- `accent` `#E0481F` — primary buttons, active favourite star, pull-to-refresh
- `accentText` / `accentPressed` `#B83A18` — accent-coloured text on light surfaces (AA at small sizes)
- `accentTint` `#FBE6DD` — soft wash; never a stripe
- `onAccent` `#FFFDFA` — text on accent fills (bold, ≥18px)

### Semantic (the ONE place hue encodes data; always paired with text)
- Bus load: `loadSeats` `#2F8F57` (green), `loadStanding` `#B5810F` (amber), `loadLimited` `#B23A2E` (red). Rendered as a dot beside a text label, so never colour-only.
- Freshness dot: green (live <45s), amber (recent), faint (stale >90s), always beside a relative timestamp.

## Typography

System font. Hierarchy by scale + weight, not colour. Numerals use `fontVariant: ['tabular-nums']` for a steady departure-board read.

| Token | Size | Use |
|---|---|---|
| `hero` | 44 / 800 | Next-arrival minutes — the answer, the largest thing on screen |
| `title` | 24 / 800 | Top bar title |
| `lg` | 18 / 700 | Stop names, route badge |
| `body` | 15 | Default text, button labels |
| `label` | 13 / 700 uppercase | Section headings, freshness line |
| `caption` | 11 | Operator, load labels |

Route number is a strong bold label inside a sunk badge; the arrival minutes outrank it in size. Answer first.

## Spacing & Radius

- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 (`space.xs`–`xxl`). Layout uses `gap`, no arbitrary margins.
- Radius: `sm` 8 (chips, badges), `md` 12 (cards, buttons), `pill` 999 (icon buttons, dots).

## Components

- **TopBar** — in-app header (native header is disabled). Title + optional back + optional right action. Replaces the old oversized "← Home" button and the hidden Material header.
- **FreshnessLine** — coloured dot + "Updated 12s ago". Honest data age on every data screen.
- **BusCard** — route badge + wheelchair icon + operator on the left, hero minutes on the right; follow-up arrivals as chips with load dots.
- **NearbyStopCard** — stop name + walk distance (icon) + favourite star; grouped by spacing, not nested cards.
- **iconButton** — 44×44 circular sunk touch target. Meets the 44pt minimum.

Elevation is restrained: hairline borders over heavy drop shadows. No card-on-card nesting.

## Motion

Pull-to-refresh and 30s auto-refresh keep timings live. Tinted with `accent`. Respect `prefers-reduced-motion`; motion is never required to read state.

## Iconography

`@expo/vector-icons` (Ionicons + MaterialIcons). No emoji in UI. Star, walk, locate, refresh, chevrons, settings, accessible, bus, cloud-offline.

## Bans honoured

No side-stripe borders, no gradient text, no glassmorphism, no Material blue, no emoji-as-UI, no pure `#000`/`#fff`.
