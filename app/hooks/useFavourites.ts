import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import type { FavouriteStop } from "../types";

const STORAGE_KEY = "favourite_bus_stops";

export const useFavourites = () => {
  const [favourites, setFavourites] = useState<FavouriteStop[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted favourites on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setFavourites(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to load favourites:", err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: FavouriteStop[]) => {
    setFavourites(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error("Failed to save favourites:", err);
    }
  }, []);

  const isFavourite = useCallback(
    (busStopCode: string) =>
      favourites.some((fav) => fav.BusStopCode === busStopCode),
    [favourites],
  );

  const toggleFavourite = useCallback(
    (stop: FavouriteStop) => {
      const exists = favourites.some(
        (fav) => fav.BusStopCode === stop.BusStopCode,
      );
      const next = exists
        ? favourites.filter((fav) => fav.BusStopCode !== stop.BusStopCode)
        : [
            ...favourites,
            {
              BusStopCode: stop.BusStopCode,
              RoadName: stop.RoadName,
              Description: stop.Description,
            },
          ];
      persist(next);
    },
    [favourites, persist],
  );

  const renameFavourite = useCallback(
    (busStopCode: string, nickname: string) => {
      const trimmed = nickname.trim();
      const next = favourites.map((fav) =>
        fav.BusStopCode === busStopCode
          ? { ...fav, Nickname: trimmed || undefined }
          : fav,
      );
      persist(next);
    },
    [favourites, persist],
  );

  return {
    favourites,
    isLoaded,
    isFavourite,
    toggleFavourite,
    renameFavourite,
  };
};
