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

System font. Hierarchy by scale + weight, not colour. Numerals use `fontVariant: ['tabular-nums']` for a steady departure-board read. Each `type` token bundles size + line-height (4px-grid) so multi-line text always has room; floors are biased up for sunlight (body never below 16).

| Token | Size / LH | Weight role | Use |
|---|---|---|---|
| `hero` | 44 / 48 | 800, tracking -1.5 | Next-arrival minutes — the answer, the largest thing on screen |
| `title` | 24 / 30 | 800, tracking -0.5 | Top bar title, "Arriving" hero variant |
| `lg` | 18 / 24 | 700 | Stop names, route badge, modal title, primary button |
| `body` | 16 / 22 | 400 text, 600 controls, 700 timings | Default text, buttons, chips, state messages |
| `label` | 14 / 20 | 700 uppercase (tracking 0.8) for headings; 400 for meta | Section headings, freshness line, stop meta |
| `caption` | 12 / 16 | 600–700 uppercase, tracking 0.6 | Operator, load labels, "current stop" tag |

Weight roles are fixed: 800 display, 700 emphasis, 600 controls, 400 body. Large numerals (`hero`, route badge, top bar title) set `includeFontPadding: false` so Android doesn't seat them low in their boxes.

Route number is a strong bold label inside a sunk badge; the arrival minutes outrank it in size. Answer first.

## Spacing & Radius

- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 (`space.xs`–`xxl`). Layout uses `gap`, no arbitrary margins.
- Vertical rhythm is a fixed three-step beat: **8 within a group** (heading→content, header→cards, card→card in one stop), **24 between stop groups**, **36 between sections**. Sections use the shared `section` style (`gap: sm`, `marginTop: xl` on top of the screen's `md` flow gap); nothing else may introduce its own vertical spacing, so grouping always reads from space alone.
- Radius: `sm` 8 (chips, badges), `md` 12 (cards, buttons), `pill` 999 (icon buttons, dots).

## Components

- **TopBar** — in-app header (native header is disabled). Title + optional back + optional right action. Replaces the old oversized "← Home" button and the hidden Material header.
- **FreshnessLine** — coloured dot + "Updated 12s ago". Honest data age on every data screen. Error variant ("Couldn't refresh · Updated 2m ago", red dot + bold red text) when a background refresh fails while data is still on screen. The 30s auto-refresh is silent so this line never flickers away mid-read; user-initiated loads (cold load, pull, locate button) show phase text ("Finding your location…" / "Loading nearby stops…").
- **BusCard** — route badge + wheelchair icon + operator on the left, hero minutes on the right; follow-up arrivals as chips with load dots. Tappable (with a faint chevron) to open the route's next stops. When data passes the stale threshold the timings themselves dim to `inkFaint` (trust lives in the numbers, not only the dot).
- **NearbyStopCard** — stop name + walk distance (icon) + favourite star; grouped by spacing, not nested cards.
- **iconButton** — 44×44 circular sunk touch target. Meets the 44pt minimum.
- **Route timeline** (bus route page) — rail of hairline-joined dots: accent dot = current stop, outlined dots = stops ahead, ink dot = terminus. Each row is a 44pt+ tappable target opening that stop's arrivals; right-aligned tabular number = stops away. Route data is static, so no freshness line and no auto-refresh.
- **Segmented control** — sunk track, raised active option with hairline border. Used to pick route direction ("To {terminus}") when a service calls at the stop in both directions.

Elevation is restrained: hairline borders over heavy drop shadows. No card-on-card nesting.

## Motion

Pull-to-refresh and 30s auto-refresh keep timings live. Tinted with `accent`. Respect `prefers-reduced-motion`; motion is never required to read state.

## Iconography

`@expo/vector-icons` (Ionicons + MaterialIcons). No emoji in UI. Star, walk, locate, refresh, chevrons, settings, accessible, bus, cloud-offline.

## Bans honoured

No side-stripe borders, no gradient text, no glassmorphism, no Material blue, no emoji-as-UI, no pure `#000`/`#fff`.
