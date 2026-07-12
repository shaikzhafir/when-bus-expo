export type BusArrival = {
  ServiceNo: string;
  Operator: string;
  NextBuses: string[];
  LoadStatus: string[];
  IsWheelchair: boolean;
};

export type NearestBusStop = {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Distance: number;
  Arrivals: BusArrival[];
};

export type BusRouteStop = {
  StopSequence: number;
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
  Distance: number;
};

export type BusDirectionDetails = {
  Direction: number;
  NextStops: BusRouteStop[];
};

export type BusDetailsResponse = {
  ServiceNo: string;
  CurrentBusStopCode: string;
  Directions: BusDirectionDetails[];
};

export type FavouriteStop = {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Nickname?: string;
};
