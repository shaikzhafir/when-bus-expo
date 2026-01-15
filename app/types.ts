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
