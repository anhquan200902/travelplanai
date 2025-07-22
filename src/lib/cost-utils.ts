import { TripResponse, CostSummary, Activity, DayItinerary, CurrencyRate } from "@/types";

// Enhanced exchange rates with more currencies
const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  CNY: 6.45,
  INR: 74.5,
  KRW: 1180,
  SGD: 1.35,
  HKD: 7.8,
  THB: 33,
  VND: 23000,
  BRL: 5.2,
  MXN: 20.5,
  RUB: 75,
  ZAR: 15.8,
  NOK: 8.5,
  SEK: 8.8,
  DKK: 6.3,
  PLN: 3.9,
  CZK: 22.5,
  HUF: 310,
  RON: 4.2,
  BGN: 1.66,
  HRK: 6.4,
  TRY: 8.5,
  ILS: 3.2,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.30,
  BHD: 0.38,
  OMR: 0.38,
  EGP: 15.7,
  MAD: 9.8,
  NGN: 411,
  GHS: 6.1,
  KES: 110,
  ZMW: 16.8,
  MUR: 43.5,
  LKR: 200,
  PKR: 155,
  BDT: 85,
  NPR: 119,
  MMK: 1680,
  KHR: 4080,
  LAK: 9500,
  IDR: 14200,
  MYR: 4.2,
  PHP: 50.5,
  TWD: 28.5,
  NZD: 1.45,
  FJD: 2.1,
  PGK: 3.5,
  WST: 2.6,
  TOP: 2.3,
  VUV: 112,
  SBD: 8.2,
  // Add more as needed
};

// Cache for exchange rates
let exchangeRatesCache: Record<string, CurrencyRate> = {};
let lastRateUpdate: Date | null = null;
const RATE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Function to get current exchange rates (with caching)
export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = new Date();
  
  // Check if we have cached rates that are still valid
  if (lastRateUpdate && (now.getTime() - lastRateUpdate.getTime()) < RATE_CACHE_DURATION) {
    const rates: Record<string, number> = {};
    Object.entries(exchangeRatesCache).forEach(([code, rateInfo]) => {
      rates[code] = rateInfo.rate;
    });
    return rates;
  }

  // In a real application, you would fetch from an API like:
  // const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  // const data = await response.json();
  // return data.rates;

  // For now, return default rates and update cache
  Object.entries(DEFAULT_EXCHANGE_RATES).forEach(([code, rate]) => {
    exchangeRatesCache[code] = {
      code,
      rate,
      lastUpdated: now
    };
  });
  
  lastRateUpdate = now;
  return DEFAULT_EXCHANGE_RATES;
}

// Synchronous version for immediate use (uses cached or default rates)
export function getExchangeRatesSync(): Record<string, number> {
  if (Object.keys(exchangeRatesCache).length === 0) {
    // Initialize cache with default rates
    const now = new Date();
    Object.entries(DEFAULT_EXCHANGE_RATES).forEach(([code, rate]) => {
      exchangeRatesCache[code] = {
        code,
        rate,
        lastUpdated: now
      };
    });
    lastRateUpdate = now;
  }

  const rates: Record<string, number> = {};
  Object.entries(exchangeRatesCache).forEach(([code, rateInfo]) => {
    rates[code] = rateInfo.rate;
  });
  return rates;
}

export function convertToUSD(amount: number, fromCurrency: string): number {
  const rates = getExchangeRatesSync();
  const rate = rates[fromCurrency] || 1;
  return amount / rate;
}

export function convertFromUSD(amountUSD: number, toCurrency: string): number {
  const rates = getExchangeRatesSync();
  const rate = rates[toCurrency] || 1;
  return amountUSD * rate;
}

// Enhanced function to get exchange rate with metadata
export function getCurrencyRate(currencyCode: string): CurrencyRate | null {
  return exchangeRatesCache[currencyCode] || null;
}

// Function to estimate costs in different currencies
export function estimateCostInCurrency(
  baseAmountUSD: number,
  targetCurrency: string,
  includeBuffer: boolean = true
): {
  amount: number;
  formattedAmount: string;
  confidence: 'high' | 'medium' | 'low';
  lastUpdated: Date | null;
} {
  const rates = getExchangeRatesSync();
  const rate = rates[targetCurrency] || 1;
  let amount = baseAmountUSD * rate;
  
  // Add a small buffer for cost estimation uncertainty
  if (includeBuffer) {
    amount *= 1.1; // 10% buffer
  }
  
  const currencyRate = getCurrencyRate(targetCurrency);
  const confidence = currencyRate && lastRateUpdate &&
    (new Date().getTime() - lastRateUpdate.getTime()) < RATE_CACHE_DURATION
    ? 'high' : 'medium';

  return {
    amount,
    formattedAmount: formatCurrency(amount, targetCurrency),
    confidence,
    lastUpdated: currencyRate?.lastUpdated || null
  };
}

export function calculateActivityCost(activity: Activity): number {
  return activity.costUSD || 0;
}

export function calculateDailyCost(day: DayItinerary): number {
  return day.activities.reduce((total, activity) => {
    return total + calculateActivityCost(activity);
  }, 0);
}

export function calculateTotalCost(itinerary: DayItinerary[]): number {
  return itinerary.reduce((total, day) => {
    return total + calculateDailyCost(day);
  }, 0);
}

export function categorizeCost(activity: Activity): string {
  const title = activity.title.toLowerCase();
  const details = activity.details.toLowerCase();
  
  if (title.includes('hotel') || title.includes('accommodation') || title.includes('check-in') || 
      details.includes('hotel') || details.includes('accommodation')) {
    return 'accommodation';
  }
  
  if (title.includes('restaurant') || title.includes('lunch') || title.includes('dinner') || 
      title.includes('breakfast') || title.includes('food') || title.includes('cafe') ||
      details.includes('restaurant') || details.includes('meal') || details.includes('food')) {
    return 'food';
  }
  
  if (title.includes('transport') || title.includes('taxi') || title.includes('bus') || 
      title.includes('train') || title.includes('flight') || title.includes('metro') ||
      details.includes('transport') || details.includes('travel')) {
    return 'transportation';
  }
  
  if (title.includes('museum') || title.includes('tour') || title.includes('ticket') || 
      title.includes('attraction') || title.includes('activity') ||
      details.includes('entrance') || details.includes('admission')) {
    return 'activities';
  }
  
  return 'other';
}

export function calculateCostBreakdown(itinerary: DayItinerary[]) {
  const breakdown = {
    accommodation: 0,
    food: 0,
    activities: 0,
    transportation: 0,
    other: 0,
  };
  
  itinerary.forEach(day => {
    day.activities.forEach(activity => {
      const cost = calculateActivityCost(activity);
      const category = categorizeCost(activity);
      breakdown[category as keyof typeof breakdown] += cost;
    });
  });
  
  return breakdown;
}

export function generateCostSummary(
  tripResponse: TripResponse,
  budgetAmount?: string,
  budgetCurrency?: string
): CostSummary {
  const totalCostUSD = calculateTotalCost(tripResponse.itinerary);
  const dailyAverageCostUSD = totalCostUSD / tripResponse.itinerary.length;
  const costBreakdown = calculateCostBreakdown(tripResponse.itinerary);
  
  let budgetComparisonUSD;
  if (budgetAmount && budgetCurrency) {
    const budgetAmountNum = parseFloat(budgetAmount);
    const budgetAmountUSD = convertToUSD(budgetAmountNum, budgetCurrency);
    const differenceUSD = totalCostUSD - budgetAmountUSD;
    const differencePercentage = (differenceUSD / budgetAmountUSD) * 100;
    
    budgetComparisonUSD = {
      budgetAmountUSD,
      originalBudgetAmount: budgetAmountNum,
      originalCurrency: budgetCurrency,
      isOverBudget: differenceUSD > 0,
      differenceUSD,
      differencePercentage,
    };
  }
  
  return {
    totalCostUSD,
    dailyAverageCostUSD,
    budgetComparisonUSD,
    costBreakdown,
  };
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function addDailyCostsToItinerary(itinerary: DayItinerary[]): DayItinerary[] {
  return itinerary.map(day => ({
    ...day,
    dailyCostUSD: calculateDailyCost(day),
  }));
}