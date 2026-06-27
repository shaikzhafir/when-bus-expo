import { useCallback, useEffect, useRef, useState } from "react";
import type { BusArrival } from "../types";

const API_BASE_URL = "https://when-bus-api.shaikzhafir.com";
const AUTO_REFRESH_MS = 30_000;

export const useBusArrivals = (busStopCode: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busArrivals, setBusArrivals] = useState<BusArrival[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const getBusArrivals = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (inFlight.current) return;
      inFlight.current = true;
      if (mode === "refresh") setIsRefreshing(true);
      else setIsLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/getBusArrival?busStopCode=${busStopCode}`,
        );
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const services = Array.isArray(data) ? data : data.Services || [];
        setBusArrivals(services);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Couldn't load arrivals. Pull to retry.");
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
    const id = setInterval(() => getBusArrivals("refresh"), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [getBusArrivals]);

  return {
    isLoading,
    isRefreshing,
    busArrivals,
    lastUpdated,
    error,
    refresh: () => getBusArrivals("refresh"),
  };
};
