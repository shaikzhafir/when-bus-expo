import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { sharedStyles } from "../styles";
import { colors, space } from "../theme";
import type { BusArrival, NearestBusStop } from "../types";
import { BusCard } from "./BusCard";

type NearbyStopCardProps = {
  busStop: NearestBusStop;
  isFavourite: boolean;
  onToggleFavourite: () => void;
};

export function NearbyStopCard({
  busStop,
  isFavourite,
  onToggleFavourite,
}: NearbyStopCardProps) {
  const metres = (busStop.Distance * 1000).toFixed(0);

  return (
    <View style={[sharedStyles.stopBlock, { marginBottom: space.lg }]}>
      <View style={sharedStyles.stopHeaderRow}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={sharedStyles.stopName}>{busStop.Description}</Text>
          <View style={sharedStyles.stopMetaRow}>
            <Ionicons name="walk" size={14} color={colors.inkMuted} />
            <Text style={sharedStyles.stopMeta}>
              {metres} m · {busStop.RoadName} · {busStop.BusStopCode}
            </Text>
          </View>
        </View>
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
          />
        ))
      ) : (
        <View style={[sharedStyles.busCard, { alignItems: "center" }]}>
          <Text style={sharedStyles.noTiming}>No buses arriving</Text>
        </View>
      )}
    </View>
  );
}
