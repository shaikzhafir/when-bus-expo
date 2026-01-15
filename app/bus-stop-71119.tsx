import { Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BusCard } from "./components/BusCard";
import { BusStopHeader } from "./components/BusStopHeader";
import { NavigationButton } from "./components/NavigationButton";
import { RefreshButton } from "./components/RefreshButton";
import { useBusArrivals } from "./hooks/useBusArrivals";
import { sharedStyles } from "./styles";

export default function BusStop71119() {
  const busStopCode = "71119";
  const busStopName = "Opposite Blk 344 (Towards Eunos)";
  const { isLoading, busArrivals, refresh } = useBusArrivals(busStopCode);
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: `Bus Stop ${busStopCode}` }} />
      {isLoading ? (
        <View style={sharedStyles.container}>
          <Text style={sharedStyles.loadingText}>Loading bus arrivals...</Text>
        </View>
      ) : (
        <ScrollView 
          style={sharedStyles.scrollView} 
          contentContainerStyle={[
            sharedStyles.scrollContent,
            { paddingTop: insets.top + 16 }
          ]}
        >
          <BusStopHeader busStopName={busStopName} />
          <RefreshButton onPress={refresh} isLoading={isLoading} />
          <NavigationButton href="/" text="← Home" />
          {busArrivals && busArrivals.length > 0 ? (
            busArrivals.map((arrival) => (
              <BusCard key={arrival.ServiceNo} arrival={arrival} />
            ))
          ) : (
            <View style={sharedStyles.emptyContainer}>
              <Text style={sharedStyles.emptyText}>No bus arrivals found</Text>
            </View>
          )}
        </ScrollView>
      )}
    </>
  );
}
