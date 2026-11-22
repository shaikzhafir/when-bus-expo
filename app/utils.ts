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

/** Initial great-circle bearing from a to b, degrees clockwise from north. */
export const bearingDegrees = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

const COMPASS_POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
const COMPASS_WORDS: Record<(typeof COMPASS_POINTS)[number], string> = {
  N: "north",
  NE: "north-east",
  E: "east",
  SE: "south-east",
  S: "south",
  SW: "south-west",
  W: "west",
  NW: "north-west",
};

/** Eight-point compass label for a bearing, e.g. 47 -> "NE". */
export const compassPoint = (degrees: number) =>
  COMPASS_POINTS[Math.round(degrees / 45) % 8];

/** Spoken form of a compass point, for screen readers. */
export const compassWord = (point: string) =>
  COMPASS_WORDS[point as keyof typeof COMPASS_WORDS] ?? point;

/** Walking distance from a km value: "320 m" under 1 km, "1.2 km" above. */
export const formatDistance = (km: number) => formatMetres(km * 1000);

/** "320 m" under 1 km, "1.2 km" above. */
export const formatMetres = (m: number) => {
  const metres = Math.round(m);
  if (metres < 1000) return `${metres} m`;
  return `${(metres / 1000).toFixed(1)} km`;
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
