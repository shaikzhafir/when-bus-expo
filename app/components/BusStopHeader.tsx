import { Text, View } from "react-native";
import { sharedStyles } from "../styles";

type BusStopHeaderProps = {
  busStopName: string;
};

export function BusStopHeader({ busStopName }: BusStopHeaderProps) {
  return (
    <View style={sharedStyles.busStopHeader}>
      <Text style={sharedStyles.busStopName}>{busStopName}</Text>
    </View>
  );
}

