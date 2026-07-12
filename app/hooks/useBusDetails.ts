import { useCallback, useEffect, useRef, useState } from "react";
import type { BusDetailsResponse, BusDirectionDetails } from "../types";

const API_BASE_URL = "https://when-bus-api.shaikzhafir.com";

/**
 * Fetches the route ahead (next stops per direction) for a bus service at a
 * stop. Route data is a static snapshot, so it loads once — no auto-refresh.
 */
export const useBusDetails = (serviceNo: string, busStopCode: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [directions, setDirections] = useState<BusDirectionDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const fetchDetails = useCallback(async () => {
    if (inFlight.current || !serviceNo || !busStopCode) return;
    inFlight.current = true;
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/getBusDetails?serviceNo=${encodeURIComponent(
          serviceNo,
        )}&busStopCode=${encodeURIComponent(busStopCode)}`,
      );
      if (response.status === 404) {
        setDirections([]);
        setError(`Bus ${serviceNo} doesn't call at this stop.`);
        return;
      }
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data: BusDetailsResponse = await response.json();
      setDirections(Array.isArray(data?.Directions) ? data.Directions : []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch bus details:", err);
      setError("Couldn't load the route. Try again.");
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  }, [serviceNo, busStopCode]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { isLoading, directions, error, refresh: fetchDetails };
};
