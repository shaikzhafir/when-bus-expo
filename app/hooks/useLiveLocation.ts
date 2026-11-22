import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

export type Fix = {
  latitude: number;
  longitude: number;
  /** Horizontal accuracy radius in metres, when the OS reports one. */
  accuracy: number | null;
  /** When the OS took the fix (ms epoch) — not when we received it. */
  timestamp: number;
};

export type LocationPermission = "unknown" | "granted" | "denied";

// Stops on opposite sides of a road are ~20 m apart, so only GPS-grade fixes
// can tell them apart. High accuracy runs only while the app is in the
// foreground, which is a glance at a time.
const WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.High,
  timeInterval: 5_000,
  // 0, not a distance: standing still must still refresh the fix's age, or a
  // rider waiting at a stop would be told their location is old.
  distanceInterval: 0,
};
// A cached OS fix is only good enough to paint the first screen.
const SEED_MAX_AGE_MS = 60_000;
const SEED_REQUIRED_ACCURACY_M = 100;
const FRESH_FIX_TIMEOUT_MS = 8_000;

const toFix = (loc: Location.LocationObject): Fix => ({
  latitude: loc.coords.latitude,
  longitude: loc.coords.longitude,
  accuracy: loc.coords.accuracy ?? null,
  timestamp: loc.timestamp,
});

export const fixAgeMs = (fix: Fix) => Math.max(0, Date.now() - fix.timestamp);

/**
 * Live device location for a foreground screen.
 *
 * Location is watched continuously while the app is active, so callers always
 * have a recent fix instead of guessing whether a cached one is still true.
 * The watch stops when the app goes to the background and restarts (with a
 * fresh fix) when it comes back.
 */
export function useLiveLocation(onFix?: (fix: Fix) => void) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [permission, setPermission] = useState<LocationPermission>("unknown");
  const fixRef = useRef<Fix | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const startingRef = useRef(false);
  const onFixRef = useRef(onFix);
  onFixRef.current = onFix;

  const accept = useCallback((next: Fix) => {
    // Never let an older fix (e.g. a slow one-shot request) replace a newer one.
    if (fixRef.current && next.timestamp < fixRef.current.timestamp) return;
    fixRef.current = next;
    setFix(next);
    onFixRef.current?.(next);
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";
      setPermission(granted ? "granted" : "denied");
      return granted;
    } catch {
      setPermission("denied");
      return false;
    }
  }, []);

  const stopWatching = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
  }, []);

  // Never prompts: the screen asks for permission once, then calls this.
  const startWatching = useCallback(async () => {
    // Mount, app resume and the screen's first load can all call this at
    // once; only one may create the watch.
    if (watchRef.current || startingRef.current) return;
    startingRef.current = true;
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;
      setPermission("granted");
      try {
        const seed = await Location.getLastKnownPositionAsync({
          maxAge: SEED_MAX_AGE_MS,
          requiredAccuracy: SEED_REQUIRED_ACCURACY_M,
        });
        if (seed) accept(toFix(seed));
      } catch {
        // No usable cached fix; the watch will deliver one.
      }
      if (AppState.currentState !== "active") return;
      const sub = await Location.watchPositionAsync(WATCH_OPTIONS, (loc) =>
        accept(toFix(loc)),
      );
      // Backgrounded while the watch was starting: don't leave it running.
      if (AppState.currentState !== "active") sub.remove();
      else watchRef.current = sub;
    } catch {
      // Location services off; getFreshFix surfaces the failure to the user.
    } finally {
      startingRef.current = false;
    }
  }, [accept]);

  /**
   * A fix no older than maxAgeMs. Uses the watched fix when it is recent
   * enough, otherwise asks the OS for a new one. Falls back to the last fix
   * (whatever its age) when a new one can't be had in time; callers show the
   * fix's age so a stale position is never silent.
   */
  const getFreshFix = useCallback(
    async (maxAgeMs: number): Promise<Fix | null> => {
      const current = fixRef.current;
      if (current && fixAgeMs(current) <= maxAgeMs) return current;
      if (!(await requestPermission())) return null;
      try {
        const loc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), FRESH_FIX_TIMEOUT_MS),
          ),
        ]);
        accept(toFix(loc));
      } catch {
        // Keep whatever we had.
      }
      return fixRef.current;
    },
    [accept, requestPermission],
  );

  useEffect(() => {
    startWatching();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") startWatching();
      else stopWatching();
    });
    return () => {
      sub.remove();
      stopWatching();
    };
  }, [startWatching, stopWatching]);

  return { fix, fixRef, permission, getFreshFix, requestPermission, startWatching };
}
