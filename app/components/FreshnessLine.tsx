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
};

/**
 * Honest data-age indicator. A coloured dot (paired with text, never colour
 * alone) plus a relative timestamp so a commuter never trusts a stale time.
 */
export function FreshnessLine({ updatedAt, label = "Updated" }: FreshnessLineProps) {
  // Re-render once a second so the relative age counts up live.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const freshness = freshnessOf(updatedAt);
  return (
    <View style={sharedStyles.statusRow}>
      <View style={[sharedStyles.statusDot, { backgroundColor: DOT_COLOR[freshness] }]} />
      <Text style={sharedStyles.statusText}>
        {freshness === "stale" && updatedAt ? "Outdated · " : ""}
        {label} {agoLabel(updatedAt)}
      </Text>
    </View>
  );
}
