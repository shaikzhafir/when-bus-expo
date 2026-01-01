import { useCallback, useEffect, useState } from "react";
import type { BusArrival } from "../types";

export const useBusArrivals = (busStopCode: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [busArrivals, setBusArrivals] = useState<BusArrival[]>([]);

  const getBusArrivals = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`https://when-bus-api.shaikzhafir.com/getBusArrival?busStopCode=${busStopCode}`);
      const data = await response.json();
      // Handle both array response and object with Services property
      const services = Array.isArray(data) ? data : (data.Services || []);
      setBusArrivals(services);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  }, [busStopCode]);

  useEffect(() => {
    getBusArrivals();
  }, [getBusArrivals]);

  return {
    isLoading,
    busArrivals,
    refresh: getBusArrivals,
  };
};

