export type BusArrival = {
  ServiceNo: string;
  Operator: string;
  NextBuses: string[];
  LoadStatus: string[];
  IsWheelchair: boolean;
  /** Terminating stop of the next bus; tells you which way the stop goes. */
  DestinationCode?: string;
  DestinationName?: string;
};

export type NearestBusStop = {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  /** Km from the coordinates the request was made with. */
  Distance: number;
  Latitude?: number;
  Longitude?: number;
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
