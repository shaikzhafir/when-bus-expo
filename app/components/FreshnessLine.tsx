import { useEffect, useState } from "react";
import { Text, View } from "react-native";
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
  /**
   * Last background refresh failed while data is still on screen. The line
   * turns into a warning so a commuter never trusts a silently-dead feed.
   */
  errored?: boolean;
};

const exactTimeLabel = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

/**
 * Honest data-age indicator. A coloured dot (paired with text, never colour
 * alone) plus relative age and the exact fetch time, so a commuter always
 * knows precisely when the data was last refreshed.
 */
export function FreshnessLine({
  updatedAt,
  label = "Updated",
  errored = false,
}: FreshnessLineProps) {
  // Re-render once a second so the relative age counts up live.
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const freshness = freshnessOf(updatedAt);
  const timeLabel = updatedAt
    ? `${agoLabel(updatedAt)} · ${exactTimeLabel(updatedAt)}`
    : agoLabel(updatedAt);
  const prefix = errored
    ? "Couldn't refresh · "
    : freshness === "stale" && updatedAt
      ? "Outdated · "
      : "";
  const line = `${prefix}${label} ${timeLabel}`;

  return (
    <View style={sharedStyles.statusRow} accessibilityLabel={line}>
      <View
        style={[
          sharedStyles.statusDot,
          { backgroundColor: errored ? colors.loadLimited : DOT_COLOR[freshness] },
        ]}
      />
      <Text style={[sharedStyles.statusText, errored && sharedStyles.statusTextErrored]}>
        {line}
      </Text>
    </View>
  );
}
