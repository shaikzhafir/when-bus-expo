export const formatTime = (minutes: string) => {
  const mins = parseInt(minutes, 10);
  if (isNaN(mins) || mins <= 0) return "Arriving";
  if (mins === 1) return "1 min";
  return `${mins} mins`;
};

export const getLoadColor = (load: string) => {
  switch (load) {
    case "SEA": return "#4CAF50"; // Green for seats available
    case "SDA": return "#FF9800"; // Orange for standing available
    case "LSD": return "#F44336"; // Red for limited standing
    default: return "#757575";
  }
};

export const getLoadText = (load: string) => {
  switch (load) {
    case "SEA": return "Seats Available";
    case "SDA": return "Standing Available";
    case "LSD": return "Limited Standing";
    default: return load;
  }
};

