import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
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
import { LocationLine } from "./components/LocationLine";
import { EdgeScrims } from "./components/EdgeScrims";
import { NearbyStopCard } from "./components/NearbyStopCard";
import { TopBar } from "./components/TopBar";
import { useFavourites } from "./hooks/useFavourites";
import { type Fix, useLiveLocation } from "./hooks/useLiveLocation";
import { sharedStyles } from "./styles";
import { colors, freshnessOf, screenEdgePadding, space } from "./theme";
import type { FavouriteStop, NearestBusStop } from "./types";
import { distanceMeters } from "./utils";

const API_BASE_URL = "https://when-bus-api.shaikzhafir.com";
const AUTO_REFRESH_MS = 30_000;
const STALE_CHECK_MS = 5_000;
// Walked this far from where the list was fetched: fetch it again. Stops on
// opposite sides of a road are ~20 m apart.
const REFETCH_MOVE_M = 25;
// Pull-to-refresh and app resume trust a watched fix up to this age.
const REFRESH_FIX_MAX_AGE_MS = 10_000;
// The first paint may use a cached OS fix this old; the watch corrects it.
const INITIAL_FIX_MAX_AGE_MS = 60_000;
// Back from the background after this long: refresh position and arrivals.
const RESUME_REFRESH_MS = 15_000;

type Coordinates = { latitude: number; longitude: number };

export default function Index() {
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
  const inFlight = useRef(false);
  // Where the list on screen was fetched for. Compared against every new fix.
  const fetchedForRef = useRef<Coordinates | null>(null);
  // Responses can land out of order (walking while a slow request is out);
  // only the newest request may update the screen.
  const fetchSeq = useRef(0);
  // Getting a new fix while the list on screen keeps serving (Locate button,
  // app resume): the user sees their position is being updated.
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
  // (cold load, pull-to-refresh) show the phase text.
  const fetchNearestBusStops = useCallback(
    async (at: Coordinates, opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      const seq = ++fetchSeq.current;
      fetchedForRef.current = at;
      if (!silent) {
        setIsLoadingBusStops(true);
        setLoadingPhase("fetching");
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}/getNearestBusStops?lat=${at.latitude}&lng=${at.longitude}`,
        );
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        if (seq !== fetchSeq.current) return; // a newer position won
        const now = new Date();
        setNearestBusStops(Array.isArray(data) ? data : []);
        setLastUpdated(now);
        lastUpdatedRef.current = now;
        setIsStale(false);
        setError(null);
      } catch (err) {
        if (seq !== fetchSeq.current) return;
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

  // Every watched fix: if the rider has walked away from where the list was
  // fetched, the nearest stops may have changed, so fetch again (silently).
  const onFix = useCallback(
    (fix: Fix) => {
      const at = fetchedForRef.current;
      if (at && distanceMeters(at, fix) > REFETCH_MOVE_M) {
        fetchNearestBusStops(fix, { silent: true });
      }
    },
    [fetchNearestBusStops],
  );
  const { fix, fixRef, getFreshFix, requestPermission, startWatching } =
    useLiveLocation(onFix);

  /**
   * initial: cold start, shows skeleton + phase text.
   * refresh: pull-to-refresh, keeps the list, spinner at the top.
   * locate / resume: always a new fix (locate) or one under 10 s (resume);
   *   the list keeps serving while "Updating your location…" shows.
   */
  const load = useCallback(
    async (mode: "initial" | "refresh" | "locate" | "resume") => {
      if (inFlight.current) return;
      inFlight.current = true;
      const background = mode === "locate" || mode === "resume";
      if (mode === "refresh") setIsRefreshing(true);
      else if (mode === "initial") setIsLoading(true);
      else setIsRefixingLocation(true);
      if (!background) setLoadingPhase("locating");

      try {
        const granted = await requestPermission();
        setPermissionDenied(!granted);
        if (!granted) {
          setError("Location is off, so we can't find stops near you.");
          return;
        }
        startWatching();

        const maxAge =
          mode === "locate"
            ? 0
            : mode === "initial"
              ? INITIAL_FIX_MAX_AGE_MS
              : REFRESH_FIX_MAX_AGE_MS;
        const next = await getFreshFix(maxAge);
        if (!next) {
          setError("No location available. Check GPS and try again.");
          if (mode === "initial") {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
          return;
        }
        if (mode === "initial") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        await fetchNearestBusStops(next, { silent: background });
      } catch {
        setError("Couldn't get your location.");
      } finally {
        inFlight.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
        setIsRefixingLocation(false);
        setLoadingPhase(null);
      }
    },
    [requestPermission, startWatching, getFreshFix, fetchNearestBusStops],
  );

  const handleLocate = () => {
    Haptics.selectionAsync();
    load(nearestBusStops.length > 0 ? "locate" : "refresh");
  };

  useEffect(() => {
    load("initial");
  }, [load]);

  // Coming back to the app (often after travelling): new fix, new list.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      const updated = lastUpdatedRef.current;
      if (!updated || Date.now() - updated.getTime() > RESUME_REFRESH_MS) {
        load("resume");
      }
    });
    return () => sub.remove();
  }, [load]);

  // Keep timings live while the screen is open, at the latest watched fix.
  useEffect(() => {
    const id = setInterval(() => {
      const latest = fixRef.current ?? fetchedForRef.current;
      if (latest && !inFlight.current) {
        fetchNearestBusStops(latest, { silent: true });
      }
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchNearestBusStops, fixRef]);

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
            onRefresh={() => load("refresh")}
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
        {!permissionDenied && !loadingPhase && !isRefixingLocation && (
          <LocationLine fix={fix} />
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
              onPress={() => load("refresh")}
            >
              <Ionicons name="refresh" size={18} color={colors.onAccent} />
              <Text style={sharedStyles.primaryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Nearby stops (the error state above already covers the
            nothing-loaded failure, so don't also show an empty section) */}
        {(fix || nearestBusStops.length > 0 || isLoadingBusStops || loadingPhase) &&
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
                    from={fix}
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
                      from={fix}
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
