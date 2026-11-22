import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BusCard } from "../components/BusCard";
import { EdgeScrims } from "../components/EdgeScrims";
import { FreshnessLine } from "../components/FreshnessLine";
import { TopBar } from "../components/TopBar";
import { useBusArrivals } from "../hooks/useBusArrivals";
import { sharedStyles } from "../styles";
import { colors, screenEdgePadding, space } from "../theme";

export default function BusStopDetail() {
  const { code, name, subtitle } = useLocalSearchParams<{
    code: string;
    name?: string;
    subtitle?: string;
  }>();
  const busStopName = name || `Bus Stop ${code}`;
  const {
    isLoading,
    isRefreshing,
    busArrivals,
    lastUpdated,
    error,
    isStale,
    refresh,
  } = useBusArrivals(code);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const hasArrivals = busArrivals && busArrivals.length > 0;

  return (
    <View style={sharedStyles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={[
          sharedStyles.scrollContent,
          screenEdgePadding(insets),
        ]}
        scrollIndicatorInsets={{ top: insets.top, bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            progressViewOffset={insets.top + space.md}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <TopBar
          title={busStopName}
          subtitle={subtitle}
          onBack={() => router.back()}
          right={
            <TouchableOpacity
              style={sharedStyles.iconButton}
              onPress={refresh}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Refresh arrivals"
            >
              <Ionicons name="refresh" size={22} color={colors.ink} />
            </TouchableOpacity>
          }
        />
        {/* Only the cold load swaps in a spinner row. Pull-to-refresh already
            shows the RefreshControl, and auto-refresh is silent, so the
            freshness line stays put while a commuter is reading times. */}
        {isLoading ? (
          <View style={sharedStyles.statusRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={sharedStyles.statusText}>Loading arrivals…</Text>
          </View>
        ) : lastUpdated ? (
          <FreshnessLine
            updatedAt={lastUpdated}
            errored={!!error && hasArrivals}
          />
        ) : null}

        {isLoading ? (
          <>
            <View style={sharedStyles.skeleton} />
            <View style={sharedStyles.skeleton} />
            <View style={sharedStyles.skeleton} />
          </>
        ) : error && !hasArrivals ? (
          <View style={sharedStyles.stateContainer}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.inkMuted} />
            <Text style={sharedStyles.stateTextError}>{error}</Text>
            <TouchableOpacity style={sharedStyles.primaryButton} onPress={refresh}>
              <Ionicons name="refresh" size={18} color={colors.onAccent} />
              <Text style={sharedStyles.primaryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : hasArrivals ? (
          busArrivals.map((arrival) => (
            <BusCard
              key={arrival.ServiceNo}
              arrival={arrival}
              stale={isStale}
              onPress={() =>
                router.push({
                  pathname: "/bus-route/[serviceNo]",
                  params: {
                    serviceNo: arrival.ServiceNo,
                    stopCode: code,
                    stopName: busStopName,
                  },
                })
              }
            />
          ))
        ) : (
          <View style={sharedStyles.stateContainer}>
            <Ionicons name="bus-outline" size={32} color={colors.inkMuted} />
            <Text style={sharedStyles.stateText}>No buses arriving right now.</Text>
          </View>
        )}
      </ScrollView>
      <EdgeScrims />
    </View>
  );
}
