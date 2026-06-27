import { colors } from "./theme";

export const formatTime = (minutes: string) => {
  const mins = parseInt(minutes, 10);
  if (isNaN(mins) || mins <= 0) return "Arriving";
  if (mins === 1) return "1 min";
  return `${mins} mins`;
};

/** Numeric minutes for the hero value, or null when arriving / unknown. */
export const minutesUntil = (raw: string): number | null => {
  const mins = parseInt(raw, 10);
  if (isNaN(mins) || mins <= 0) return null;
  return mins;
};

export const getLoadColor = (load: string) => {
  switch (load) {
    case "SEA":
      return colors.loadSeats;
    case "SDA":
      return colors.loadStanding;
    case "LSD":
      return colors.loadLimited;
    default:
      return colors.loadUnknown;
  }
};

export const getLoadText = (load: string) => {
  switch (load) {
    case "SEA":
      return "Seats Available";
    case "SDA":
      return "Standing Available";
    case "LSD":
      return "Limited Standing";
    default:
      return load;
  }
};

/** Great-circle distance in metres between two lat/lng points. */
export const distanceMeters = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) => {
  const R = 6_371_000; // earth radius, metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Compact load label for inline chips. */
export const getLoadShort = (load: string) => {
  switch (load) {
    case "SEA":
      return "Seats";
    case "SDA":
      return "Standing";
    case "LSD":
      return "Full";
    default:
      return "";
  }
};
