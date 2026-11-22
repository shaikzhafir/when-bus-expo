/**
 * When Bus design tokens.
 *
 * Strategy: Restrained (product). A warm, tinted near-white surface, a near-black
 * warm ink, and ONE accent (vermilion) reserved for the primary action and live
 * state. Scene: a commuter glancing at the next-bus number on a sunny open-air
 * platform, so contrast is biased high and numerals are large and tabular.
 *
 * React Native StyleSheet does not parse oklch(), so values are authored in OKLCH
 * (noted in comments) and committed as hex.
 */

export const colors = {
  // Surfaces (warm neutrals, never pure white)
  bg: "#FAF7F2", // oklch(97.5% 0.006 75)
  surface: "#FFFDFA", // oklch(99.4% 0.004 75)
  surfaceSunk: "#F1ECE3", // oklch(94% 0.008 75) — chips, wells
  hairline: "#E6DFD4", // oklch(89% 0.009 75)

  // Ink (warm near-black, tinted toward the brand hue)
  ink: "#241F1A", // oklch(24% 0.008 60)
  inkMuted: "#6F665B", // oklch(48% 0.012 70) — secondary text
  inkFaint: "#9A9085", // oklch(64% 0.012 75) — tertiary / stale

  // Accent — the one committed color. Fill with onAccent text; for accent-
  // colored TEXT on light surfaces use accentText (darker, AA at small sizes).
  accent: "#E0481F", // oklch(62% 0.19 35)
  accentPressed: "#B83A18", // oklch(52% 0.17 35)
  accentText: "#B83A18",
  accentTint: "#FBE6DD", // oklch(94% 0.03 40) — soft wash, never a stripe
  onAccent: "#FFFDFA",

  // Load status — the ONE place hue encodes data; always paired with text.
  loadSeats: "#2F8F57", // green: seats available
  loadStanding: "#B5810F", // amber: standing available
  loadLimited: "#B23A2E", // red: limited standing
  loadUnknown: "#6F665B",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  pill: 999,
} as const;

/**
 * Type ramp. Each role bundles size + line-height (4px-grid friendly) so every
 * multi-line string gets breathing room without per-style guesswork. Weights
 * are assigned per role in styles: 800 display (hero, screen title), 700
 * emphasis (stop names, timings, section headings), 600 controls, 400 body.
 * Floors are biased up for sunlight glanceability (body never below 16).
 */
export const type = {
  hero: { fontSize: 44, lineHeight: 48, letterSpacing: -1.5 }, // the arrival minutes — the answer
  title: { fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  lg: { fontSize: 18, lineHeight: 24 },
  body: { fontSize: 16, lineHeight: 22 },
  label: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
} as const;

export const tabularNums = { fontVariant: ["tabular-nums" as const] };

// Android pads text boxes with font ascent/descent, which makes large numerals
// sit visibly low inside badges and cards; iOS ignores this prop.
export const noFontPadding = { includeFontPadding: false as const };

// Some Android devices report insets.bottom = 0 even though a translucent
// 3-button nav bar (~48dp) still draws over the content, so the floor must
// cover a full nav bar, not just cosmetic breathing room.
const NAV_BAR_FALLBACK = 48;

// Every screen's scroll content must clear the system bars by at least this
// much beyond the safe-area inset, so the last/first row never sits against
// the status bar or home indicator. See .claude/skills/safe-area.
export const screenEdgePadding = (insets: {
  top: number;
  bottom: number;
}) => ({
  paddingTop: insets.top + space.md,
  paddingBottom: Math.max(insets.bottom, NAV_BAR_FALLBACK) + space.xxl + space.lg,
});

/** Freshness of a timestamp: live (<45s), recent, or stale (>90s). */
export type Freshness = "live" | "recent" | "stale";

export const freshnessOf = (since: Date | null): Freshness => {
  if (!since) return "stale";
  const seconds = (Date.now() - since.getTime()) / 1000;
  if (seconds < 45) return "live";
  if (seconds < 90) return "recent";
  return "stale";
};

/** "just now" / "12s ago" / "3m ago" / "2h ago" relative label. */
export const agoLabel = (since: Date | null): string => {
  if (!since) return "never";
  const seconds = Math.max(0, Math.round((Date.now() - since.getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
};
