import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import type { Fix } from "../hooks/useLiveLocation";
import { fixAgeMs } from "../hooks/useLiveLocation";
import { sharedStyles } from "../styles";
import { agoLabel, colors } from "../theme";

// Opposite-side stops sit ~20 m apart; past this radius the list order (and
// "nearest") can't be trusted to pick the right side of the road.
const APPROXIMATE_M = 40;
const OLD_FIX_MS = 60_000;

/**
 * How good the position behind "Nearby stops" is: accuracy radius and age of
 * the GPS fix. When either is poor, it says so in words, so a rider checks
 * the stop code on the pole instead of trusting the top card.
 */
export function LocationLine({ fix }: { fix: Fix | null }) {
  // Re-render every few seconds so the age stays honest.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 5_000);
    return () => clearInterval(id);
  }, []);

  if (!fix) return null;

  const accuracy = fix.accuracy != null ? Math.round(fix.accuracy) : null;
  const approximate = accuracy == null || accuracy > APPROXIMATE_M;
  const old = fixAgeMs(fix) > OLD_FIX_MS;
  const age = agoLabel(new Date(fix.timestamp));

  const line = old
    ? `Location from ${age}. Pull down to update.`
    : approximate
      ? `Approximate location${accuracy != null ? ` (±${accuracy} m)` : ""}. Check the stop code on the pole.`
      : `Location ±${accuracy} m · ${age}`;
  const warn = old || approximate;

  return (
    <View style={sharedStyles.statusRow} accessibilityLabel={line}>
      <Ionicons
        name={warn ? "warning-outline" : "navigate"}
        size={14}
        color={warn ? colors.loadStanding : colors.inkMuted}
      />
      <Text style={[sharedStyles.statusText, { flexShrink: 1 }]}>{line}</Text>
    </View>
  );
}
