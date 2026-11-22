import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { sharedStyles } from "../styles";
import { colors, space } from "../theme";
import type { BusArrival } from "../types";
import {
  formatTime,
  getLoadColor,
  getLoadShort,
  getLoadText,
  minutesUntil,
} from "../utils";

type BusCardProps = {
  arrival: BusArrival;
  /** When set, the card is tappable and opens the route's next stops. */
  onPress?: () => void;
  /** Data is past the stale threshold; dim the timings so nobody trusts them. */
  stale?: boolean;
};

const IMMINENT_MINS = 2;

function LoadIndicator({ load }: { load?: string }) {
  if (!load) return null;
  const short = getLoadShort(load);
  if (!short) return null;
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}
      accessibilityLabel={getLoadText(load)}
    >
      <View style={[sharedStyles.loadDot, { backgroundColor: getLoadColor(load) }]} />
      <Text style={sharedStyles.loadLabel}>{short}</Text>
    </View>
  );
}

export function BusCard({ arrival, onPress, stale = false }: BusCardProps) {
  const times = arrival.NextBuses ?? [];
  const [next, ...rest] = times;
  const nextMins = next != null ? minutesUntil(next) : undefined;
  const imminent = nextMins != null && nextMins <= IMMINENT_MINS;

  // The card sets `accessible`, which flattens its children for screen
  // readers, so the label must carry everything sighted users can see:
  // next arrival, load, follow-up times, staleness.
  const minsSpeech = (raw: string) => {
    const mins = minutesUntil(raw);
    return mins == null
      ? "arriving now"
      : `${mins} ${mins === 1 ? "minute" : "minutes"}`;
  };
  const firstLoad = arrival.LoadStatus?.[0];
  const heroSpeech =
    (next == null ? "no upcoming buses" : minsSpeech(next)) +
    (firstLoad ? `, ${getLoadText(firstLoad)}` : "") +
    (rest.length > 0 ? `, then ${rest.map(minsSpeech).join(", ")}` : "") +
    (stale ? ", timing outdated" : "");

  const content = (
    <>
      <View style={sharedStyles.busTopRow}>
        {/* flexShrink so a long operator name truncates instead of
            squeezing the hero minutes off the right edge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.sm,
            flexShrink: 1,
          }}
        >
          <View style={sharedStyles.routeBadge}>
            <Text style={sharedStyles.routeNumber}>{arrival.ServiceNo}</Text>
          </View>
          {arrival.IsWheelchair && (
            <MaterialIcons
              name="accessible"
              size={18}
              color={colors.inkMuted}
              accessibilityLabel="Wheelchair accessible"
            />
          )}
          {arrival.Operator ? (
            <Text
              style={[sharedStyles.operator, { flexShrink: 1 }]}
              numberOfLines={1}
            >
              {arrival.Operator}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          {next == null ? (
            <Text style={sharedStyles.noTiming}>No upcoming buses</Text>
          ) : nextMins == null ? (
            <Text style={[sharedStyles.heroArriving, stale && sharedStyles.heroStale]}>
              Arriving
            </Text>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.xs }}>
              <Text
                style={[
                  sharedStyles.heroValue,
                  imminent && sharedStyles.heroImminent,
                  stale && sharedStyles.heroStale,
                ]}
              >
                {nextMins}
              </Text>
              <Text style={[sharedStyles.heroUnit, stale && sharedStyles.heroStale]}>
                {nextMins === 1 ? "min" : "mins"}
              </Text>
            </View>
          )}
          {onPress && (
            <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
          )}
        </View>
      </View>

      {(arrival.LoadStatus?.[0] || rest.length > 0) && (
        <View style={sharedStyles.followRow}>
          {arrival.LoadStatus?.[0] && <LoadIndicator load={arrival.LoadStatus[0]} />}
          {rest.map((time, i) => {
            const mins = minutesUntil(time);
            const load = arrival.LoadStatus?.[i + 1];
            const short = load ? getLoadShort(load) : "";
            return (
              <View
                key={i}
                style={sharedStyles.followChip}
                accessibilityLabel={
                  `Then ${
                    mins == null
                      ? "arriving"
                      : `${mins} ${mins === 1 ? "minute" : "minutes"}`
                  }` + (load ? `, ${getLoadText(load)}` : "")
                }
              >
                <Text style={[sharedStyles.followTime, stale && sharedStyles.heroStale]}>
                  {formatTime(time)}
                </Text>
                {load && short ? (
                  <>
                    <View
                      style={[sharedStyles.loadDot, { backgroundColor: getLoadColor(load) }]}
                    />
                    <Text style={sharedStyles.loadLabel}>{short}</Text>
                  </>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={sharedStyles.busCard}
        onPress={onPress}
        activeOpacity={0.65}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Bus ${arrival.ServiceNo}, ${heroSpeech}`}
        accessibilityHint="Shows the next stops on this route"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={sharedStyles.busCard}
      accessible
      accessibilityLabel={`Bus ${arrival.ServiceNo}, ${heroSpeech}`}
    >
      {content}
    </View>
  );
}
