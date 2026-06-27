import { MaterialIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { sharedStyles } from "../styles";
import { colors } from "../theme";
import type { BusArrival } from "../types";
import { getLoadColor, getLoadShort, getLoadText, minutesUntil } from "../utils";

type BusCardProps = {
  arrival: BusArrival;
};

const IMMINENT_MINS = 2;

function LoadIndicator({ load }: { load?: string }) {
  if (!load) return null;
  const short = getLoadShort(load);
  if (!short) return null;
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
      accessibilityLabel={getLoadText(load)}
    >
      <View style={[sharedStyles.loadDot, { backgroundColor: getLoadColor(load) }]} />
      <Text style={sharedStyles.loadLabel}>{short}</Text>
    </View>
  );
}

export function BusCard({ arrival }: BusCardProps) {
  const times = arrival.NextBuses ?? [];
  const [next, ...rest] = times;
  const nextMins = next != null ? minutesUntil(next) : undefined;
  const imminent = nextMins != null && nextMins <= IMMINENT_MINS;

  const heroSpeech =
    next == null
      ? "no upcoming buses"
      : nextMins == null
        ? "arriving now"
        : `${nextMins} ${nextMins === 1 ? "minute" : "minutes"}`;

  return (
    <View
      style={sharedStyles.busCard}
      accessible
      accessibilityLabel={`Bus ${arrival.ServiceNo}, ${heroSpeech}`}
    >
      <View style={sharedStyles.busTopRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
            <Text style={sharedStyles.operator}>{arrival.Operator}</Text>
          ) : null}
        </View>

        {next == null ? (
          <Text style={sharedStyles.noTiming}>No upcoming buses</Text>
        ) : nextMins == null ? (
          <Text style={sharedStyles.heroArriving}>Arriving</Text>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
            <Text style={[sharedStyles.heroValue, imminent && sharedStyles.heroImminent]}>
              {nextMins}
            </Text>
            <Text style={sharedStyles.heroUnit}>{nextMins === 1 ? "min" : "mins"}</Text>
          </View>
        )}
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
                  `Then ${mins == null ? "arriving" : `${mins} minutes`}` +
                  (load ? `, ${getLoadText(load)}` : "")
                }
              >
                <Text style={sharedStyles.followTime}>
                  {mins == null ? "Arriving" : `${mins} min`}
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
    </View>
  );
}
