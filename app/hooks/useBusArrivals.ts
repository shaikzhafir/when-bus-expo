import { useCallback, useEffect, useRef, useState } from "react";
import { freshnessOf } from "../theme";
import type { BusArrival } from "../types";

const API_BASE_URL = "https://when-bus-api.shaikzhafir.com";
const AUTO_REFRESH_MS = 30_000;
const STALE_CHECK_MS = 5_000;

export const useBusArrivals = (busStopCode: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busArrivals, setBusArrivals] = useState<BusArrival[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Data older than the stale threshold must look untrustworthy, even if no
  // state change has re-rendered the screen since the last successful fetch.
  const [isStale, setIsStale] = useState(false);
  const lastUpdatedRef = useRef<Date | null>(null);
  const inFlight = useRef(false);

  const getBusArrivals = useCallback(
    // "auto" refreshes silently: no spinner anywhere, so the 30s cycle never
    // flickers the reading surface. Only the pull gesture shows isRefreshing.
    async (mode: "initial" | "refresh" | "auto" = "initial") => {
      if (inFlight.current) return;
      inFlight.current = true;
      if (mode === "refresh") setIsRefreshing(true);
      else if (mode === "initial") setIsLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/getBusArrival?busStopCode=${busStopCode}`,
        );
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const services = Array.isArray(data) ? data : data.Services || [];
        const now = new Date();
        setBusArrivals(services);
        setLastUpdated(now);
        lastUpdatedRef.current = now;
        setIsStale(false);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Couldn't load arrivals. Pull down to retry.");
      } finally {
        inFlight.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [busStopCode],
  );

  // Initial load + keep timings live while the screen is open.
  useEffect(() => {
    getBusArrivals("initial");
    const id = setInterval(() => getBusArrivals("auto"), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [getBusArrivals]);

  useEffect(() => {
    const id = setInterval(
      () => setIsStale(freshnessOf(lastUpdatedRef.current) === "stale"),
      STALE_CHECK_MS,
    );
    return () => clearInterval(id);
  }, []);

  return {
    isLoading,
    isRefreshing,
    busArrivals,
    lastUpdated,
    error,
    isStale,
    refresh: () => getBusArrivals("refresh"),
  };
};
