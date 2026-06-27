import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FreshnessLine } from "./components/FreshnessLine";
import { NearbyStopCard } from "./components/NearbyStopCard";
import { TopBar } from "./components/TopBar";
import { useFavourites } from "./hooks/useFavourites";
import { sharedStyles } from "./styles";
import { colors, space } from "./theme";
import type { BusArrival, FavouriteStop } from "./types";
import { distanceMeters } from "./utils";

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
const AUTO_REFRESH_MS = 30_000;
// Reuse a recent GPS fix for rapid refreshes, but re-fix if the device moved.
const LOCATION_TTL_MS = 15_000;
const MOVE_THRESHOLD_M = 50;

export default function Index() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nearestBusStops, setNearestBusStops] = useState<NearestBusStop[]>([]);
  const [isLoadingBusStops, setIsLoadingBusStops] = useState(false);
  const [showMoreBusStops, setShowMoreBusStops] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favourites, isFavourite, toggleFavourite, renameFavourite } =
    useFavourites();
  const locationRef = useRef<Coordinates | null>(null);
  const locationTimeRef = useRef(0);
  const inFlight = useRef(false);
  const [editingFav, setEditingFav] = useState<FavouriteStop | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState("");

  const openNicknameEditor = (fav: FavouriteStop) => {
    setNicknameDraft(fav.Nickname ?? "");
    setEditingFav(fav);
  };

  const saveNickname = () => {
    if (editingFav) renameFavourite(editingFav.BusStopCode, nicknameDraft);
    setEditingFav(null);
  };

  const openBusStop = (code: string, name: string, subtitle?: string) => {
    router.push({
      pathname: "/bus-stop/[code]",
      params: { code, name, ...(subtitle ? { subtitle } : {}) },
    });
  };

  // First N stops are always shown; the farthest 3 fold away to cut clutter.
  const visibleBusStops =
    nearestBusStops.length > 3
      ? nearestBusStops.slice(0, nearestBusStops.length - 3)
      : nearestBusStops;
  const hiddenBusStops =
    nearestBusStops.length > 3 ? nearestBusStops.slice(-3) : [];

  const fetchNearestBusStops = useCallback(async (lat: number, lng: number) => {
    setIsLoadingBusStops(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/getNearestBusStops?lat=${lat}&lng=${lng}`,
      );
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      setNearestBusStops(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Failed to fetch nearest bus stops:", err);
      setError("Couldn't load nearby stops. Pull down to retry.");
    } finally {
      setIsLoadingBusStops(false);
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionDenied(true);
        setError("Location is off, so we can't find stops near you.");
        return false;
      }
      setPermissionDenied(false);
      return true;
    } catch {
      setError("Couldn't request location permission.");
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (inFlight.current) return;
      inFlight.current = true;
      if (mode === "refresh") setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        inFlight.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      try {
        // Fast path: on rapid refreshes reuse the cached fix unless the device
        // has actually moved. getLastKnownPositionAsync is OS-cached (cheap),
        // so we detect movement without paying for a full GPS fix.
        if (mode === "refresh" && locationRef.current) {
          const age = Date.now() - locationTimeRef.current;
          if (age < LOCATION_TTL_MS) {
            const lastKnown = await Location.getLastKnownPositionAsync();
            const moved =
              !!lastKnown &&
              distanceMeters(locationRef.current, lastKnown.coords) >
                MOVE_THRESHOLD_M;
            if (!moved) {
              await fetchNearestBusStops(
                locationRef.current.latitude,
                locationRef.current.longitude,
              );
              return; // finally resets inFlight + flags
            }
          }
        }

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Location timeout")), 10000),
        );
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        const locationData = await Promise.race([
          locationPromise,
          timeoutPromise,
        ]).catch(async () => Location.getLastKnownPositionAsync());

        if (locationData) {
          const coords = {
            latitude: locationData.coords.latitude,
            longitude: locationData.coords.longitude,
          };
          setLocation(coords);
          locationRef.current = coords;
          locationTimeRef.current = Date.now();
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
          await fetchNearestBusStops(coords.latitude, coords.longitude);
        } else {
          setError("No location available. Check GPS and try again.");
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(
          message === "Location timeout"
            ? "Location timed out. Try again or check GPS."
            : "Couldn't get your location.",
        );
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        inFlight.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [requestLocationPermission, fetchNearestBusStops],
  );

  useEffect(() => {
    getCurrentLocation("initial");
  }, [getCurrentLocation]);

  // Keep timings live while the screen is open, reusing the known location.
  useEffect(() => {
    const id = setInterval(() => {
      if (locationRef.current) {
        fetchNearestBusStops(
          locationRef.current.latitude,
          locationRef.current.longitude,
        );
      }
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchNearestBusStops]);

  const showInitialSkeleton = isLoading && nearestBusStops.length === 0;

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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => getCurrentLocation("refresh")}
            progressViewOffset={insets.top + space.md}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <TopBar
          title="When Bus"
          right={
            <TouchableOpacity
              style={sharedStyles.iconButton}
              onPress={() => getCurrentLocation("refresh")}
              disabled={isLoading || isRefreshing}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Refresh location and arrivals"
            >
              <Ionicons name="locate" size={22} color={colors.ink} />
            </TouchableOpacity>
          }
        />
        {lastUpdated && !permissionDenied && (
          <FreshnessLine updatedAt={lastUpdated} />
        )}

        {/* Favourites */}
        {favourites.length > 0 && (
          <View style={{ gap: space.sm }}>
            <Text style={sharedStyles.sectionTitle}>Favourites</Text>
            {favourites.map((fav) => (
              <View key={fav.BusStopCode} style={sharedStyles.favouriteRow}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() =>
                    openBusStop(
                      fav.BusStopCode,
                      fav.Nickname || fav.Description,
                      fav.Nickname ? fav.Description : undefined,
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${fav.Nickname || fav.Description}`}
                >
                  <Text style={sharedStyles.stopName} numberOfLines={1}>
                    {fav.Nickname || fav.Description}
                  </Text>
                  <Text style={sharedStyles.stopMeta} numberOfLines={1}>
                    {fav.Nickname ? `${fav.Description} · ` : ""}
                    {fav.RoadName} · {fav.BusStopCode}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openNicknameEditor(fav)}
                  style={sharedStyles.iconButton}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Rename ${fav.Description}`}
                >
                  <Ionicons name="pencil" size={18} color={colors.inkMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => toggleFavourite(fav)}
                  style={sharedStyles.iconButton}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Remove from favourites"
                >
                  <Ionicons name="star" size={22} color={colors.accent} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Permission denied recovery */}
        {permissionDenied && (
          <View style={sharedStyles.stateContainer}>
            <Ionicons name="location-outline" size={32} color={colors.inkMuted} />
            <Text style={sharedStyles.stateText}>{error}</Text>
            <TouchableOpacity
              style={sharedStyles.primaryButton}
              onPress={() => Linking.openSettings()}
            >
              <Ionicons name="settings-outline" size={18} color={colors.onAccent} />
              <Text style={sharedStyles.primaryButtonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error (non-permission) */}
        {error && !permissionDenied && nearestBusStops.length === 0 && (
          <View style={sharedStyles.stateContainer}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.inkMuted} />
            <Text style={sharedStyles.stateTextError}>{error}</Text>
            <TouchableOpacity
              style={sharedStyles.primaryButton}
              onPress={() => getCurrentLocation("refresh")}
            >
              <Ionicons name="refresh" size={18} color={colors.onAccent} />
              <Text style={sharedStyles.primaryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Nearby stops */}
        {(location || isLoadingBusStops) && !permissionDenied && (
          <>
            <Text style={sharedStyles.sectionTitle}>Nearby stops</Text>
            {showInitialSkeleton || (isLoadingBusStops && nearestBusStops.length === 0) ? (
              <>
                <View style={sharedStyles.skeleton} />
                <View style={sharedStyles.skeleton} />
              </>
            ) : nearestBusStops.length > 0 ? (
              <>
                {visibleBusStops.map((busStop) => (
                  <NearbyStopCard
                    key={busStop.BusStopCode}
                    busStop={busStop}
                    isFavourite={isFavourite(busStop.BusStopCode)}
                    onToggleFavourite={() => toggleFavourite(busStop)}
                  />
                ))}

                {hiddenBusStops.length > 0 && (
                  <TouchableOpacity
                    style={sharedStyles.textButton}
                    onPress={() => setShowMoreBusStops(!showMoreBusStops)}
                  >
                    <Ionicons
                      name={showMoreBusStops ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={colors.accentText}
                    />
                    <Text style={sharedStyles.textButtonLabel}>
                      {showMoreBusStops
                        ? "Show fewer"
                        : `${hiddenBusStops.length} more stops nearby`}
                    </Text>
                  </TouchableOpacity>
                )}

                {showMoreBusStops &&
                  hiddenBusStops.map((busStop) => (
                    <NearbyStopCard
                      key={busStop.BusStopCode}
                      busStop={busStop}
                      isFavourite={isFavourite(busStop.BusStopCode)}
                      onToggleFavourite={() => toggleFavourite(busStop)}
                    />
                  ))}
              </>
            ) : (
              <View style={sharedStyles.stateContainer}>
                <Ionicons name="bus-outline" size={32} color={colors.inkMuted} />
                <Text style={sharedStyles.stateText}>No bus stops nearby.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={editingFav !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingFav(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={sharedStyles.modalBackdrop}
        >
          <TouchableOpacity
            style={sharedStyles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setEditingFav(null)}
          />
          <View style={sharedStyles.modalCard}>
            <Text style={sharedStyles.modalTitle}>Nickname</Text>
            <Text style={sharedStyles.modalSubtitle} numberOfLines={1}>
              {editingFav?.Description}
            </Text>
            <TextInput
              style={sharedStyles.modalInput}
              value={nicknameDraft}
              onChangeText={setNicknameDraft}
              placeholder="e.g. Home, Work"
              placeholderTextColor={colors.inkFaint}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveNickname}
              maxLength={40}
            />
            <View style={sharedStyles.modalActions}>
              <TouchableOpacity
                style={sharedStyles.textButton}
                onPress={() => setEditingFav(null)}
              >
                <Text style={sharedStyles.textButtonLabel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[sharedStyles.primaryButton, { paddingHorizontal: space.xl }]}
                onPress={saveNickname}
              >
                <Text style={sharedStyles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
