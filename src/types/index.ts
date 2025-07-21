export interface Activity {
  time: string;
  title: string;
  details: string;
  durationMinutes?: number;
  costUSD?: number;
}

export interface DayItinerary {
  day: number;
  date: string;
  activities: Activity[];
}

export interface TripResponse {
  itinerary: DayItinerary[];
  packing_list: string[];
}