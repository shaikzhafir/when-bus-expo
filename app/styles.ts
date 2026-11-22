import { StyleSheet } from "react-native";
import { colors, noFontPadding, radius, space, tabularNums, type } from "./theme";

export const sharedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
    gap: space.md,
  },

  // In-app top bar (native header is disabled in _layout)
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingBottom: space.sm,
  },
  topBarTitleWrap: {
    flex: 1,
  },
  topBarTitle: {
    ...type.title,
    ...noFontPadding,
    fontWeight: "800",
    color: colors.ink,
  },
  topBarSubtitle: {
    ...type.label,
    color: colors.inkMuted,
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSunk,
  },
  locateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    height: 44,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    backgroundColor: colors.surfaceSunk,
  },
  locateChipLabel: {
    ...type.label,
    fontWeight: "600",
    color: colors.ink,
  },
  // Disabled visual for any touchable; RN's disabled prop alone gives no cue.
  pressableDisabled: {
    opacity: 0.4,
  },

  // Freshness line under the title
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  statusText: {
    ...type.label,
    color: colors.inkMuted,
  },
  statusTextErrored: {
    color: colors.loadLimited,
    fontWeight: "700",
  },

  // Section = heading + its content. Spacing rhythm is 8 within a group,
  // 24 between stop groups, 36 between sections (marginTop xl + parent gap),
  // so grouping always separates less than the section boundary above it.
  section: {
    gap: space.sm,
    marginTop: space.xl,
  },
  sectionTitle: {
    ...type.label,
    fontWeight: "700",
    color: colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Stop block (no card chrome on the stop itself; spacing groups it).
  // The extra bottom margin separates stop groups more than the cards
  // within one, so grouping reads from spacing alone.
  stopBlock: {
    gap: space.sm,
    marginBottom: space.lg,
  },
  stopHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
  },
  stopName: {
    flex: 1,
    ...type.lg,
    fontWeight: "700",
    color: colors.ink,
  },
  stopMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  stopMeta: {
    ...type.label,
    color: colors.inkMuted,
  },

  // Bus arrival card — the answer surface
  busCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space.lg,
    gap: space.md,
  },
  busTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  routeBadge: {
    backgroundColor: colors.surfaceSunk,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    minWidth: 56,
    alignItems: "center",
  },
  routeNumber: {
    ...type.lg,
    ...noFontPadding,
    fontWeight: "800",
    color: colors.ink,
    ...tabularNums,
  },
  // The hero: next arrival
  heroValue: {
    ...type.hero,
    ...noFontPadding,
    fontWeight: "800",
    color: colors.ink,
    ...tabularNums,
  },
  heroUnit: {
    ...type.body,
    fontWeight: "600",
    color: colors.inkMuted,
  },
  heroArriving: {
    ...type.title,
    fontWeight: "800",
    color: colors.accentText,
  },

  // Following arrivals row
  followRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  followChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    backgroundColor: colors.surfaceSunk,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  followTime: {
    ...type.body,
    fontWeight: "700",
    color: colors.ink,
    ...tabularNums,
  },
  loadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  loadLabel: {
    ...type.caption,
    color: colors.inkMuted,
  },
  operator: {
    ...type.caption,
    color: colors.inkMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroImminent: {
    color: colors.accentText,
  },
  // Data past the stale threshold: the numbers themselves stop looking
  // trustworthy, not just the freshness dot.
  heroStale: {
    color: colors.inkFaint,
  },
  noTiming: {
    ...type.body,
    color: colors.inkMuted,
    fontStyle: "italic",
  },

  // Primary / secondary buttons
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: space.sm,
    minHeight: 52,
  },
  primaryButtonText: {
    ...type.lg,
    fontWeight: "700",
    color: colors.onAccent,
  },
  // Full-width fold toggle for the farther nearby stops
  disclosureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSunk,
    paddingHorizontal: space.lg,
  },
  disclosureLabel: {
    ...type.body,
    fontWeight: "600",
    color: colors.ink,
  },
  textButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    minHeight: 44,
    paddingHorizontal: space.sm,
  },
  textButtonLabel: {
    ...type.body,
    fontWeight: "600",
    color: colors.accentText,
  },

  // States
  stateContainer: {
    paddingVertical: space.xxl,
    alignItems: "center",
    gap: space.md,
  },
  stateText: {
    ...type.body,
    color: colors.inkMuted,
    textAlign: "center",
  },
  stateTextError: {
    ...type.body,
    color: colors.loadLimited,
    textAlign: "center",
  },

  // Loading skeleton block
  skeleton: {
    backgroundColor: colors.surfaceSunk,
    borderRadius: radius.md,
    height: 96,
  },

  // Favourite stop row (home)
  favouriteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingLeft: space.lg,
    paddingRight: space.sm,
  },

  // Direction segmented control (bus route page)
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSunk,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segmentOption: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  segmentOptionActive: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
  },
  segmentLabel: {
    ...type.body,
    fontWeight: "600",
    color: colors.inkMuted,
    textAlign: "center",
  },
  segmentLabelActive: {
    color: colors.ink,
    fontWeight: "700",
  },

  // Route timeline (bus route page) — rail of dots joined by a line
  routeRow: {
    flexDirection: "row",
    gap: space.md,
  },
  routeRail: {
    width: 14,
    alignItems: "center",
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.hairline,
  },
  routeLineHidden: {
    width: 2,
    flex: 1,
    backgroundColor: "transparent",
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.inkFaint,
    backgroundColor: colors.bg,
  },
  routeDotCurrent: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  routeDotLast: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  routeRowBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.md,
  },
  routeStopText: {
    flex: 1,
    gap: 2,
  },
  routeStopName: {
    ...type.body,
    fontWeight: "600",
    color: colors.ink,
  },
  routeStopMeta: {
    ...type.label,
    color: colors.inkMuted,
  },
  routeCurrentLabel: {
    ...type.caption,
    fontWeight: "700",
    color: colors.accentText,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  routeStopCount: {
    ...type.body,
    fontWeight: "700",
    color: colors.inkFaint,
    ...tabularNums,
  },

  // Nickname editor modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(36, 31, 26, 0.45)",
    justifyContent: "center",
    paddingHorizontal: space.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.sm,
  },
  modalTitle: {
    ...type.lg,
    fontWeight: "700",
    color: colors.ink,
  },
  modalSubtitle: {
    ...type.label,
    color: colors.inkMuted,
  },
  modalInput: {
    backgroundColor: colors.surfaceSunk,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    ...type.body,
    color: colors.ink,
    marginTop: space.xs,
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: space.md,
    marginTop: space.sm,
  },
});
