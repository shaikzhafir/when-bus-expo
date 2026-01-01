import { View, Text } from "react-native";
import { sharedStyles } from "../styles";
import { formatTime, getLoadColor, getLoadText } from "../utils";
import type { BusArrival } from "../types";

type BusCardProps = {
  arrival: BusArrival;
};

export function BusCard({ arrival }: BusCardProps) {
  return (
    <View style={sharedStyles.busCard}>
      <View style={sharedStyles.busHeader}>
        <Text style={sharedStyles.busNumber}>{arrival.ServiceNo}</Text>
        <View style={sharedStyles.busInfo}>
          <Text style={sharedStyles.operator}>{arrival.Operator}</Text>
          {arrival.IsWheelchair && (
            <Text style={sharedStyles.wheelchair}>♿</Text>
          )}
        </View>
      </View>
      <View style={sharedStyles.timingsContainer}>
        {arrival.NextBuses && arrival.NextBuses.length > 0 ? (
          arrival.NextBuses.map((time, index) => (
            <View key={index} style={sharedStyles.timingBox}>
              <Text style={sharedStyles.timingText}>{formatTime(time)}</Text>
              {arrival.LoadStatus && arrival.LoadStatus[index] && (
                <View style={[sharedStyles.loadBadge, { backgroundColor: getLoadColor(arrival.LoadStatus[index]) }]}>
                  <Text style={sharedStyles.loadText}>{getLoadText(arrival.LoadStatus[index])}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={sharedStyles.noTiming}>No upcoming buses</Text>
        )}
      </View>
    </View>
  );
}

