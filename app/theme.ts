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

export const type = {
  hero: 44, // the arrival minutes — the answer
  title: 24,
  lg: 18,
  body: 15,
  label: 13,
  caption: 11,
} as const;

export const tabularNums = { fontVariant: ["tabular-nums" as const] };

/** Freshness of a timestamp: live (<45s), recent, or stale (>90s). */
export type Freshness = "live" | "recent" | "stale";

export const freshnessOf = (since: Date | null): Freshness => {
  if (!since) return "stale";
  const seconds = (Date.now() - since.getTime()) / 1000;
  if (seconds < 45) return "live";
  if (seconds < 90) return "recent";
  return "stale";
};

/** "just now" / "12s ago" / "3m ago" relative label. */
export const agoLabel = (since: Date | null): string => {
  if (!since) return "never";
  const seconds = Math.max(0, Math.round((Date.now() - since.getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m ago`;
};
