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
  dailyCostUSD?: number;
}

export interface CostSummary {
  totalCostUSD: number;
  dailyAverageCostUSD: number;
  budgetComparisonUSD?: {
    budgetAmountUSD: number;
    originalBudgetAmount: number;
    originalCurrency: string;
    isOverBudget: boolean;
    differenceUSD: number;
    differencePercentage: number;
  };
  costBreakdown: {
    accommodation?: number;
    food?: number;
    activities?: number;
    transportation?: number;
    other?: number;
  };
}

export interface TripResponse {
  itinerary: DayItinerary[];
  packing_list: string[];
  numberOfPeople?: number;
  costSummary?: CostSummary;
}

export interface FormState {
  destination: string;
  from: string;
  to: string;
  numberOfPeople: string;
  budgetAmount: string;
  budgetCurrency: string;
  interests: string[];
  mustSee: string;
  customRequest: string;
  activities: string;
  duration?: number;
}

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface CurrencyRate {
  code: string;
  rate: number;
  lastUpdated: Date;
}