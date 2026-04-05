import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { Link, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BusCard } from "./components/BusCard";
import { sharedStyles } from "./styles";
import type { BusArrival } from "./types";

interface NearestBusStop {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Distance: number;
  Arrivals: BusArrival[];
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

const API_BASE_URL = "https://when-bus-api.shaikzhafir.com";

export default function Index() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nearestBusStops, setNearestBusStops] = useState<NearestBusStop[]>([]);
  const [isLoadingBusStops, setIsLoadingBusStops] = useState(false);
  const [showMoreBusStops, setShowMoreBusStops] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const insets = useSafeAreaInsets();

  // Split bus stops: show first ones by default, last 3 are toggleable
  const visibleBusStops =
    nearestBusStops.length > 3
      ? nearestBusStops.slice(0, nearestBusStops.length - 3)
      : nearestBusStops;
  const hiddenBusStops =
    nearestBusStops.length > 3
      ? nearestBusStops.slice(nearestBusStops.length - 3)
      : [];

  const fetchNearestBusStops = async (lat: number, lng: number) => {
    setIsLoadingBusStops(true);
    setLastFetchedAt(new Date());
    try {
      const response = await fetch(
        `${API_BASE_URL}/getNearestBusStops?lat=${lat}&lng=${lng}`,
      );
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const data = await response.json();
      setNearestBusStops(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch nearest bus stops:", err);
      setError("Failed to load nearby bus stops. Please try again.");
      setNearestBusStops([]);
    } finally {
      setIsLoadingBusStops(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        Alert.alert(
          "Permission Denied",
          "Location permission is required to find nearby bus stops.",
        );
        return false;
      }
      return true;
    } catch {
      setError("Failed to request location permission");
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setIsLoading(false);
      return;
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Location timeout")), 10000),
      );

      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });

      let locationData = await Promise.race([locationPromise, timeoutPromise]).catch(async () => {
        // Fall back to cached location only if fresh fetch fails/times out
        return await Location.getLastKnownPositionAsync();
      });

      if (locationData) {
        const { latitude, longitude } = locationData.coords;
        setLocation({ latitude, longitude });
        setLastUpdated(new Date());
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        fetchNearestBusStops(latitude, longitude);
      } else {
        setError("No location data available");
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message === "Location timeout") {
        setError("Location request timed out. Try again or check GPS.");
      } else {
        setError("Failed to get location");
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: "When Bus" }} />
      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={[
          sharedStyles.scrollContent,
          { paddingTop: insets.top + 16 },
        ]}
      >
        <TouchableOpacity
          style={[sharedStyles.refreshButton, isLoading && { opacity: 0.7 }]}
          onPress={getCurrentLocation}
          disabled={isLoading}
        >
          <Text style={sharedStyles.refreshButtonText}>
            {isLoading ? "Getting Location..." : "Refresh Location"}
          </Text>
        </TouchableOpacity>

        {lastUpdated && !isLoading && (
          <Text
            style={{
              textAlign: "center",
              color: "#4CAF50",
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            ✓ Updated at {lastUpdated.toLocaleTimeString()}
          </Text>
        )}

        {/* Quick Access Buttons */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <Link href="/bus-stop-71119" asChild>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "#fff",
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: "#ddd",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 12, color: "#666" }}>Stop 71119</Text>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#1976D2" }}
              >
                → Eunos
              </Text>
            </TouchableOpacity>
          </Link>
          <Link href="/bus-stop-71201" asChild>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "#fff",
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: "#ddd",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 12, color: "#666" }}>Stop 71201</Text>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#1976D2" }}
              >
                → Paya Lebar
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {error && (
          <View style={sharedStyles.emptyContainer}>
            <Text style={[sharedStyles.emptyText, { color: "#d32f2f" }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Nearest Bus Stops Section */}
        {location && (
          <>
            <TouchableOpacity
              onPress={() => setShowDebugInfo(!showDebugInfo)}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#666",
                  marginTop: 8,
                  marginBottom: showDebugInfo ? 4 : 16,
                }}
              >
                Nearby Bus Stops
              </Text>
            </TouchableOpacity>
            {showDebugInfo && (
              <Text
                style={{
                  fontSize: 10,
                  color: "#aaa",
                  marginBottom: 12,
                  fontFamily: "monospace",
                }}
              >
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                {lastFetchedAt &&
                  `\nFetched: ${lastFetchedAt.toLocaleTimeString()}`}
              </Text>
            )}

            {isLoadingBusStops ? (
              <View style={sharedStyles.emptyContainer}>
                <Text style={sharedStyles.loadingText}>
                  Loading nearby bus stops...
                </Text>
              </View>
            ) : nearestBusStops.length > 0 ? (
              <>
                {/* Always visible bus stops */}
                {visibleBusStops.map((busStop) => (
                  <View key={busStop.BusStopCode} style={{ marginBottom: 24 }}>
                    <View
                      style={[
                        sharedStyles.busCard,
                        {
                          marginBottom: 8,
                          backgroundColor: "#E8F5E9",
                          borderLeftWidth: 4,
                          borderLeftColor: "#4CAF50",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: "bold",
                          color: "#2E7D32",
                          marginBottom: 4,
                        }}
                      >
                        {busStop.Description}
                      </Text>
                      <Text
                        style={{ fontSize: 14, color: "#666", marginBottom: 2 }}
                      >
                        {busStop.RoadName}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 8,
                        }}
                      >
                        <Text style={{ fontSize: 14, color: "#888" }}>
                          Stop {busStop.BusStopCode}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: "#4CAF50",
                          }}
                        >
                          📍 {(busStop.Distance * 1000).toFixed(0)}m away
                        </Text>
                      </View>
                    </View>
                    {busStop.Arrivals && busStop.Arrivals.length > 0 ? (
                      busStop.Arrivals.map((arrival: BusArrival) => (
                        <BusCard
                          key={`${busStop.BusStopCode}-${arrival.ServiceNo}`}
                          arrival={arrival}
                        />
                      ))
                    ) : (
                      <View style={sharedStyles.emptyContainer}>
                        <Text style={sharedStyles.emptyText}>
                          No buses arriving
                        </Text>
                      </View>
                    )}
                  </View>
                ))}

                {/* Toggle button for hidden bus stops */}
                {hiddenBusStops.length > 0 && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#f5f5f5",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: "#ddd",
                      alignItems: "center",
                    }}
                    onPress={() => setShowMoreBusStops(!showMoreBusStops)}
                  >
                    <Text
                      style={{ fontSize: 14, fontWeight: "600", color: "#666" }}
                    >
                      {showMoreBusStops ? "▲ Hide" : "▼ Show"}{" "}
                      {hiddenBusStops.length} More Bus Stops Near Me
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Toggleable hidden bus stops */}
                {showMoreBusStops &&
                  hiddenBusStops.map((busStop) => (
                    <View
                      key={busStop.BusStopCode}
                      style={{ marginBottom: 24 }}
                    >
                      <View
                        style={[
                          sharedStyles.busCard,
                          {
                            marginBottom: 8,
                            backgroundColor: "#E8F5E9",
                            borderLeftWidth: 4,
                            borderLeftColor: "#4CAF50",
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 22,
                            fontWeight: "bold",
                            color: "#2E7D32",
                            marginBottom: 4,
                          }}
                        >
                          {busStop.Description}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#666",
                            marginBottom: 2,
                          }}
                        >
                          {busStop.RoadName}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 8,
                          }}
                        >
                          <Text style={{ fontSize: 14, color: "#888" }}>
                            Stop {busStop.BusStopCode}
                          </Text>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "600",
                              color: "#4CAF50",
                            }}
                          >
                            📍 {(busStop.Distance * 1000).toFixed(0)}m away
                          </Text>
                        </View>
                      </View>
                      {busStop.Arrivals && busStop.Arrivals.length > 0 ? (
                        busStop.Arrivals.map((arrival: BusArrival) => (
                          <BusCard
                            key={`${busStop.BusStopCode}-${arrival.ServiceNo}`}
                            arrival={arrival}
                          />
                        ))
                      ) : (
                        <View style={sharedStyles.emptyContainer}>
                          <Text style={sharedStyles.emptyText}>
                            No buses arriving
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
              </>
            ) : (
              <View style={sharedStyles.emptyContainer}>
                <Text style={sharedStyles.emptyText}>
                  No nearby bus stops found
                </Text>
              </View>
            )}
          </>
        )}

        {!location && !error && !isLoading && (
          <View style={sharedStyles.emptyContainer}>
            <Text style={sharedStyles.emptyText}>Getting your location...</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
