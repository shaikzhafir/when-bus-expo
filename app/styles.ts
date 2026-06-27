import { StyleSheet } from "react-native";
import { colors, radius, space, tabularNums, type } from "./theme";

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
    paddingBottom: space.md,
  },
  topBarTitleWrap: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: type.title,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  topBarSubtitle: {
    fontSize: type.label,
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

  // Freshness line under the title
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: -space.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: type.label,
    color: colors.inkMuted,
  },

  // Section heading
  sectionTitle: {
    fontSize: type.label,
    fontWeight: "700",
    color: colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: space.sm,
  },

  // Stop block (no card chrome on the stop itself; spacing groups it)
  stopBlock: {
    gap: space.sm,
  },
  stopHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
  },
  stopName: {
    flex: 1,
    fontSize: type.lg,
    fontWeight: "700",
    color: colors.ink,
  },
  stopMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  stopMeta: {
    fontSize: type.label,
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
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.ink,
    ...tabularNums,
  },
  // The hero: next arrival
  heroValue: {
    fontSize: type.hero,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -1.5,
    ...tabularNums,
  },
  heroUnit: {
    fontSize: type.body,
    fontWeight: "600",
    color: colors.inkMuted,
  },
  heroArriving: {
    fontSize: type.title,
    fontWeight: "800",
    color: colors.accentText,
    letterSpacing: -0.5,
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
    fontSize: type.body,
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
    fontSize: type.caption,
    color: colors.inkMuted,
  },
  operator: {
    fontSize: type.caption,
    color: colors.inkMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroImminent: {
    color: colors.accentText,
  },
  noTiming: {
    fontSize: type.body,
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
    fontSize: type.lg,
    fontWeight: "700",
    color: colors.onAccent,
  },
  textButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    paddingVertical: space.sm,
  },
  textButtonLabel: {
    fontSize: type.body,
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
    fontSize: type.body,
    color: colors.inkMuted,
    textAlign: "center",
  },
  stateTextError: {
    fontSize: type.body,
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
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.ink,
  },
  modalSubtitle: {
    fontSize: type.label,
    color: colors.inkMuted,
  },
  modalInput: {
    backgroundColor: colors.surfaceSunk,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: type.body,
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
