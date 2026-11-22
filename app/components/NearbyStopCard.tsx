import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { sharedStyles } from "../styles";
import { colors } from "../theme";
import type { BusArrival, NearestBusStop } from "../types";
import {
  bearingDegrees,
  compassPoint,
  compassWord,
  distanceMeters,
  formatDistance,
  formatMetres,
} from "../utils";
import { BusCard } from "./BusCard";

type NearbyStopCardProps = {
  busStop: NearestBusStop;
  isFavourite: boolean;
  onToggleFavourite: () => void;
  /** Arrival data is past the stale threshold; dim the timings. */
  stale?: boolean;
  /**
   * The rider's current position. With the stop's coordinates it gives a live
   * distance and compass direction, which is what tells two same-named stops
   * on opposite sides of a road apart.
   */
  from?: { latitude: number; longitude: number } | null;
};

export function NearbyStopCard({
  busStop,
  isFavourite,
  onToggleFavourite,
  stale = false,
  from,
}: NearbyStopCardProps) {
  const stopCoords =
    busStop.Latitude != null && busStop.Longitude != null
      ? { latitude: busStop.Latitude, longitude: busStop.Longitude }
      : null;
  const live = from && stopCoords;
  const walkDistance = live
    ? formatMetres(distanceMeters(from, stopCoords))
    : formatDistance(busStop.Distance);
  // Under ~10 m a direction is GPS noise: you're at the stop.
  const direction =
    live && distanceMeters(from, stopCoords) >= 10
      ? compassPoint(bearingDegrees(from, stopCoords))
      : null;
  const router = useRouter();

  const openBusRoute = (arrival: BusArrival) => {
    router.push({
      pathname: "/bus-route/[serviceNo]",
      params: {
        serviceNo: arrival.ServiceNo,
        stopCode: busStop.BusStopCode,
        stopName: busStop.Description,
      },
    });
  };

  return (
    <View style={sharedStyles.stopBlock}>
      <View style={sharedStyles.stopHeaderRow}>
        <TouchableOpacity
          style={{ flex: 1, gap: 2 }}
          onPress={() =>
            router.push({
              pathname: "/bus-stop/[code]",
              params: {
                code: busStop.BusStopCode,
                name: busStop.Description,
                subtitle: busStop.RoadName,
              },
            })
          }
          activeOpacity={0.65}
          accessibilityRole="button"
          accessibilityLabel={`Open ${busStop.Description}, stop ${busStop.BusStopCode}, ${walkDistance} away${
            direction ? ` to the ${compassWord(direction)}` : ""
          }`}
          accessibilityHint="Shows all arrivals at this stop"
        >
          <Text style={sharedStyles.stopName}>{busStop.Description}</Text>
          <View style={sharedStyles.stopMetaRow}>
            <Ionicons name="walk" size={14} color={colors.inkMuted} />
            <Text style={sharedStyles.stopMeta}>
              {walkDistance}
              {direction ? ` ${direction}` : ""} · {busStop.RoadName} ·{" "}
              <Text style={sharedStyles.stopCode}>{busStop.BusStopCode}</Text>
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onToggleFavourite}
          style={sharedStyles.iconButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            isFavourite ? "Remove from favourites" : "Add to favourites"
          }
        >
          <Ionicons
            name={isFavourite ? "star" : "star-outline"}
            size={22}
            color={isFavourite ? colors.accent : colors.inkMuted}
          />
        </TouchableOpacity>
      </View>

      {busStop.Arrivals && busStop.Arrivals.length > 0 ? (
        busStop.Arrivals.map((arrival: BusArrival) => (
          <BusCard
            key={`${busStop.BusStopCode}-${arrival.ServiceNo}`}
            arrival={arrival}
            stale={stale}
            onPress={() => openBusRoute(arrival)}
          />
        ))
      ) : (
        <View style={[sharedStyles.busCard, { alignItems: "center" }]}>
          <Text style={sharedStyles.noTiming}>No buses arriving right now.</Text>
        </View>
      )}
    </View>
  );
}
