import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopBar } from "../components/TopBar";
import { useBusDetails } from "../hooks/useBusDetails";
import { sharedStyles } from "../styles";
import { colors, space } from "../theme";
import type { BusDirectionDetails, BusRouteStop } from "../types";

/** "To {terminus}" label for the direction toggle. */
const directionLabel = (direction: BusDirectionDetails) => {
  const last = direction.NextStops[direction.NextStops.length - 1];
  return last ? `To ${last.Description}` : "Last stop";
};

export default function BusRouteDetail() {
  const { serviceNo, stopCode, stopName } = useLocalSearchParams<{
    serviceNo: string;
    stopCode: string;
    stopName?: string;
  }>();
  const { isLoading, directions, error, refresh } = useBusDetails(
    serviceNo,
    stopCode,
  );
  const [directionIndex, setDirectionIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const selected =
    directions[Math.min(directionIndex, Math.max(directions.length - 1, 0))];
  const nextStops = selected?.NextStops ?? [];
  const currentStopName = stopName || `Bus stop ${stopCode}`;

  const openStop = (stop: BusRouteStop) => {
    router.push({
      pathname: "/bus-stop/[code]",
      params: {
        code: stop.BusStopCode,
        name: stop.Description,
        subtitle: stop.RoadName,
      },
    });
  };

  return (
    <View style={sharedStyles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={[
          sharedStyles.scrollContent,
          {
            paddingTop: insets.top + space.md,
            paddingBottom: insets.bottom + space.xxl,
          },
        ]}
        scrollIndicatorInsets={{ top: insets.top, bottom: insets.bottom }}
      >
        <TopBar
          title={`Bus ${serviceNo}`}
          subtitle={`from ${currentStopName}`}
          onBack={() => router.back()}
        />

        {isLoading ? (
          <>
            <View style={sharedStyles.statusRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={sharedStyles.statusText}>Loading route…</Text>
            </View>
            <View style={sharedStyles.skeleton} />
            <View style={sharedStyles.skeleton} />
          </>
        ) : error ? (
          <View style={sharedStyles.stateContainer}>
            <Ionicons
              name="cloud-offline-outline"
              size={32}
              color={colors.inkMuted}
            />
            <Text style={sharedStyles.stateTextError}>{error}</Text>
            <TouchableOpacity
              style={sharedStyles.primaryButton}
              onPress={refresh}
            >
              <Ionicons name="refresh" size={18} color={colors.onAccent} />
              <Text style={sharedStyles.primaryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {directions.length > 1 && (
              <View
                style={sharedStyles.segmented}
                accessibilityRole="tablist"
              >
                {directions.map((direction, i) => {
                  const active = i === directionIndex;
                  return (
                    <TouchableOpacity
                      key={direction.Direction}
                      style={[
                        sharedStyles.segmentOption,
                        active && sharedStyles.segmentOptionActive,
                      ]}
                      onPress={() => setDirectionIndex(i)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={directionLabel(direction)}
                    >
                      <Text
                        style={[
                          sharedStyles.segmentLabel,
                          active && sharedStyles.segmentLabelActive,
                        ]}
                        numberOfLines={1}
                      >
                        {directionLabel(direction)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {nextStops.length === 0 ? (
              <View style={sharedStyles.stateContainer}>
                <Ionicons name="flag-outline" size={32} color={colors.inkMuted} />
                <Text style={sharedStyles.stateText}>
                  This is the last stop for Bus {serviceNo}.
                </Text>
              </View>
            ) : (
              <>
                <Text style={sharedStyles.sectionTitle}>Stops ahead</Text>

                {/* Current stop pins the top of the rail */}
                <View style={{ gap: 0 }}>
                  <View style={sharedStyles.routeRow}>
                    <View style={sharedStyles.routeRail}>
                      <View style={sharedStyles.routeLineHidden} />
                      <View
                        style={[
                          sharedStyles.routeDot,
                          sharedStyles.routeDotCurrent,
                        ]}
                      />
                      <View style={sharedStyles.routeLine} />
                    </View>
                    <View
                      style={sharedStyles.routeRowBody}
                      accessible
                      accessibilityLabel={`Current stop, ${currentStopName}`}
                    >
                      <View style={sharedStyles.routeStopText}>
                        <Text style={sharedStyles.routeCurrentLabel}>
                          Current stop
                        </Text>
                        <Text style={sharedStyles.routeStopName}>
                          {currentStopName}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {nextStops.map((stop, i) => {
                    const isLast = i === nextStops.length - 1;
                    const stopsAway = i + 1;
                    return (
                      <View key={stop.BusStopCode} style={sharedStyles.routeRow}>
                        <View style={sharedStyles.routeRail}>
                          <View style={sharedStyles.routeLine} />
                          <View
                            style={[
                              sharedStyles.routeDot,
                              isLast && sharedStyles.routeDotLast,
                            ]}
                          />
                          <View
                            style={
                              isLast
                                ? sharedStyles.routeLineHidden
                                : sharedStyles.routeLine
                            }
                          />
                        </View>
                        <TouchableOpacity
                          style={sharedStyles.routeRowBody}
                          onPress={() => openStop(stop)}
                          activeOpacity={0.65}
                          accessibilityRole="button"
                          accessibilityLabel={`${stop.Description}, ${stopsAway} ${
                            stopsAway === 1 ? "stop" : "stops"
                          } away${isLast ? ", last stop" : ""}`}
                          accessibilityHint="Shows arrivals at this stop"
                        >
                          <View style={sharedStyles.routeStopText}>
                            <Text style={sharedStyles.routeStopName}>
                              {stop.Description}
                            </Text>
                            <Text
                              style={sharedStyles.routeStopMeta}
                              numberOfLines={1}
                            >
                              {stop.RoadName} · {stop.BusStopCode}
                              {isLast ? " · Last stop" : ""}
                            </Text>
                          </View>
                          <Text style={sharedStyles.routeStopCount}>
                            {stopsAway}
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={colors.inkFaint}
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
