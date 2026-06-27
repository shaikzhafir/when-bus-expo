import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { sharedStyles } from "../styles";
import { agoLabel, colors, freshnessOf } from "../theme";

const DOT_COLOR = {
  live: colors.loadSeats,
  recent: colors.loadStanding,
  stale: colors.inkFaint,
} as const;

type FreshnessLineProps = {
  updatedAt: Date | null;
  label?: string;
};

const exactTimeLabel = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

/**
 * Honest data-age indicator. A coloured dot (paired with text, never colour
 * alone) plus a relative timestamp so a commuter never trusts a stale time.
 */
export function FreshnessLine({ updatedAt, label = "Updated" }: FreshnessLineProps) {
  const [showExact, setShowExact] = useState(false);
  // Re-render once a second so the relative age counts up live.
  const [, tick] = useState(0);
  const updatedTime = updatedAt?.getTime() ?? null;

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setShowExact(false);
  }, [updatedTime]);

  const freshness = freshnessOf(updatedAt);
  const timeLabel =
    showExact && updatedAt ? `at ${exactTimeLabel(updatedAt)}` : agoLabel(updatedAt);

  return (
    <TouchableOpacity
      style={sharedStyles.statusRow}
      onPress={() => updatedAt && setShowExact((value) => !value)}
      activeOpacity={0.7}
      disabled={!updatedAt}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        updatedAt
          ? `${label} ${showExact ? agoLabel(updatedAt) : `at ${exactTimeLabel(updatedAt)}`}`
          : `${label} never`
      }
    >
      <View style={[sharedStyles.statusDot, { backgroundColor: DOT_COLOR[freshness] }]} />
      <Text style={sharedStyles.statusText}>
        {freshness === "stale" && updatedAt ? "Outdated · " : ""}
        {label} {timeLabel}
      </Text>
    </TouchableOpacity>
  );
}
