import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FreshnessLine } from "./components/FreshnessLine";
import { EdgeScrims } from "./components/EdgeScrims";
import { NearbyStopCard } from "./components/NearbyStopCard";
import { TopBar } from "./components/TopBar";
import { useFavourites } from "./hooks/useFavourites";
import { sharedStyles } from "./styles";
import { colors, freshnessOf, screenEdgePadding, space } from "./theme";
import type { FavouriteStop, NearestBusStop } from "./types";
import { distanceMeters } from "./utils";

interface Coordinates {
  latitude: number;
  longitude: number;
}

const API_BASE_URL = "https://when-bus-api.shaikzhafir.com";
const AUTO_REFRESH_MS = 30_000;
const STALE_CHECK_MS = 5_000;
// Reuse a recent GPS fix for rapid refreshes, but re-fix if the device moved.
const LOCATION_TTL_MS = 15_000;
const MOVE_THRESHOLD_M = 50;
// Movement checks can extend a fix's life, but past this age we always get a
// real fix (in the background) — getLastKnownPositionAsync alone could pin us
// to an old spot, since it only updates when something requests a fix.
const LOCATION_MAX_AGE_MS = 180_000;

export default function Index() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nearestBusStops, setNearestBusStops] = useState<NearestBusStop[]>([]);
  const [isLoadingBusStops, setIsLoadingBusStops] = useState(false);
  // Which phase of a cold load we're in, so the user knows whether we're
  // waiting on the device GPS or on the arrivals backend.
  const [loadingPhase, setLoadingPhase] = useState<
    "locating" | "fetching" | null
  >(null);
  const [showMoreBusStops, setShowMoreBusStops] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favourites, isFavourite, toggleFavourite, renameFavourite } =
    useFavourites();
  const locationRef = useRef<Coordinates | null>(null);
  const locationTimeRef = useRef(0);
  const inFlight = useRef(false);
  const gpsRefixInFlight = useRef(false);
  // Locate button pressed and the real GPS fix is still in flight — data on
  // screen keeps serving, but the user sees their position is being updated.
  const [isRefixingLocation, setIsRefixingLocation] = useState(false);
  // Data older than the stale threshold must look untrustworthy even when
  // nothing else has re-rendered the screen since the last successful fetch.
  const [isStale, setIsStale] = useState(false);
  const lastUpdatedRef = useRef<Date | null>(null);
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

  // The 30s auto-refresh fetches silently: it never touches the loading UI,
  // so the reading surface doesn't flicker every cycle. User-initiated loads
  // (cold load, pull-to-refresh, locate button) show the phase text.
  const fetchNearestBusStops = useCallback(
    async (lat: number, lng: number, opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (!silent) {
        setIsLoadingBusStops(true);
        setLoadingPhase("fetching");
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}/getNearestBusStops?lat=${lat}&lng=${lng}`,
        );
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const now = new Date();
        setNearestBusStops(Array.isArray(data) ? data : []);
        setLastUpdated(now);
        lastUpdatedRef.current = now;
        setIsStale(false);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch nearest bus stops:", err);
        setError("Couldn't load nearby stops. Pull down to retry.");
      } finally {
        if (!silent) {
          setIsLoadingBusStops(false);
          setLoadingPhase(null);
        }
      }
    },
    [],
  );

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

  // A full GPS fix can take seconds, so it runs off the refresh path: the
  // refresh serves cached coords instantly, and if the real fix lands
  // somewhere else we silently re-fetch for the new position. alwaysRefetch
  // is for the explicit Locate button, where the user expects fresh data even
  // when they haven't moved.
  const refixLocationInBackground = useCallback(
    async (opts?: { alwaysRefetch?: boolean }) => {
      if (gpsRefixInFlight.current) return;
      gpsRefixInFlight.current = true;
      setIsRefixingLocation(true);
      try {
        const fix = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        const coords = {
          latitude: fix.coords.latitude,
          longitude: fix.coords.longitude,
        };
        const prev = locationRef.current;
        setLocation(coords);
        locationRef.current = coords;
        locationTimeRef.current = Date.now();
        const moved =
          !!prev && distanceMeters(prev, coords) > MOVE_THRESHOLD_M;
        if (moved || opts?.alwaysRefetch) {
          await fetchNearestBusStops(coords.latitude, coords.longitude, {
            silent: true,
          });
        }
      } catch {
        // Keep showing data for the cached position; the next refresh retries.
      } finally {
        gpsRefixInFlight.current = false;
        setIsRefixingLocation(false);
      }
    },
    [fetchNearestBusStops],
  );

  const getCurrentLocation = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (inFlight.current) return;
      inFlight.current = true;
      if (mode === "refresh") setIsRefreshing(true);
      else setIsLoading(true);
      // User-initiated loads show which phase they're waiting on (GPS vs
      // arrivals API). Only the 30s auto-refresh is silent.
      setLoadingPhase("locating");
      setError(null);

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        inFlight.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
        setLoadingPhase(null);
        return;
      }

      try {
        // Refresh path: never block a refresh on a full GPS fix. Within the
        // TTL reuse the cached fix as-is; after that, a movement check against
        // the OS-cached getLastKnownPositionAsync (cheap, no new fix) extends
        // its life while the device stays put. When the device moved or the
        // fix passed the hard age cap, fetch immediately with the best coords
        // available and get the real fix in the background.
        if (mode === "refresh" && locationRef.current) {
          const fixAge = Date.now() - locationTimeRef.current;
          let coords = locationRef.current;
          let needsRefix = fixAge >= LOCATION_MAX_AGE_MS;
          if (fixAge >= LOCATION_TTL_MS) {
            const lastKnown = await Location.getLastKnownPositionAsync();
            if (
              lastKnown &&
              distanceMeters(coords, lastKnown.coords) > MOVE_THRESHOLD_M
            ) {
              coords = {
                latitude: lastKnown.coords.latitude,
                longitude: lastKnown.coords.longitude,
              };
              setLocation(coords);
              locationRef.current = coords;
              needsRefix = true;
            }
          }
          if (needsRefix) refixLocationInBackground();
          await fetchNearestBusStops(coords.latitude, coords.longitude);
          return; // finally resets inFlight + flags
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
        setLoadingPhase(null);
      }
    },
    [requestLocationPermission, fetchNearestBusStops, refixLocationInBackground],
  );

  // Explicit "re-find me": always gets a real GPS fix and refreshes the list
  // for it, but still off the UI path — cached data stays on screen while the
  // fix is in flight.
  const handleLocate = () => {
    Haptics.selectionAsync();
    if (locationRef.current) {
      refixLocationInBackground({ alwaysRefetch: true });
    } else {
      getCurrentLocation("refresh");
    }
  };

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
          { silent: true },
        );
      }
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchNearestBusStops]);

  useEffect(() => {
    const id = setInterval(
      () => setIsStale(freshnessOf(lastUpdatedRef.current) === "stale"),
      STALE_CHECK_MS,
    );
    return () => clearInterval(id);
  }, []);

  const showInitialSkeleton = isLoading && nearestBusStops.length === 0;

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
              style={[
                sharedStyles.locateChip,
                (isLoading || isRefreshing || isRefixingLocation) &&
                  sharedStyles.pressableDisabled,
              ]}
              onPress={handleLocate}
              disabled={isLoading || isRefreshing || isRefixingLocation}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Update my location and refresh stops"
            >
              <Ionicons name="locate" size={18} color={colors.ink} />
              <Text style={sharedStyles.locateChipLabel}>Locate</Text>
            </TouchableOpacity>
          }
        />
        {!permissionDenied && loadingPhase && (
          <View style={sharedStyles.statusRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={sharedStyles.statusText}>
              {loadingPhase === "fetching"
                ? "Loading nearby stops…"
                : "Finding your location…"}
            </Text>
          </View>
        )}
        {!permissionDenied && !loadingPhase && isRefixingLocation && (
          <View style={sharedStyles.statusRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={sharedStyles.statusText}>Updating your location…</Text>
          </View>
        )}
        {lastUpdated && !permissionDenied && !loadingPhase && (
          <FreshnessLine
            updatedAt={lastUpdated}
            errored={!!error && nearestBusStops.length > 0}
          />
        )}

        {/* Favourites */}
        {favourites.length > 0 && (
          <View style={sharedStyles.section}>
            <Text style={sharedStyles.sectionTitle}>Favourites</Text>
            {favourites.map((fav) => (
              <View key={fav.BusStopCode} style={sharedStyles.favouriteRow}>
                <TouchableOpacity
                  style={{ flex: 1, gap: 2 }}
                  activeOpacity={0.65}
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

        {/* Nearby stops (the error state above already covers the
            nothing-loaded failure, so don't also show an empty section) */}
        {(location || isLoadingBusStops || loadingPhase) &&
          !permissionDenied &&
          !(error && nearestBusStops.length === 0) && (
          <View style={sharedStyles.section}>
            <Text style={sharedStyles.sectionTitle}>Nearby stops</Text>
            {showInitialSkeleton || (isLoadingBusStops && nearestBusStops.length === 0) ? (
              // Phase text already sits in the status row under the title;
              // repeating it here would show the same line twice.
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
                    stale={isStale}
                  />
                ))}

                {hiddenBusStops.length > 0 && (
                  <TouchableOpacity
                    style={sharedStyles.disclosureButton}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowMoreBusStops(!showMoreBusStops);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: showMoreBusStops }}
                    accessibilityLabel={
                      showMoreBusStops
                        ? "Show fewer stops"
                        : `Show ${hiddenBusStops.length} more stops nearby`
                    }
                  >
                    <Text style={sharedStyles.disclosureLabel}>
                      {showMoreBusStops
                        ? "Show fewer stops"
                        : `Show ${hiddenBusStops.length} more stops`}
                    </Text>
                    <Ionicons
                      name={showMoreBusStops ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={colors.inkMuted}
                    />
                  </TouchableOpacity>
                )}

                {showMoreBusStops &&
                  hiddenBusStops.map((busStop) => (
                    <NearbyStopCard
                      key={busStop.BusStopCode}
                      busStop={busStop}
                      isFavourite={isFavourite(busStop.BusStopCode)}
                      onToggleFavourite={() => toggleFavourite(busStop)}
                      stale={isStale}
                    />
                  ))}
              </>
            ) : (
              <View style={sharedStyles.stateContainer}>
                <Ionicons name="bus-outline" size={32} color={colors.inkMuted} />
                <Text style={sharedStyles.stateText}>No bus stops nearby.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <EdgeScrims />

      <Modal
        visible={editingFav !== null}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setEditingFav(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={sharedStyles.modalBackdrop}
        >
          {/* Transparent dismiss layer — the KeyboardAvoidingView above
              already carries the backdrop tint; tinting this too would
              stack to double darkness. */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
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
