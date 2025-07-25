import { TripResponse, DayItinerary, Activity, FormState } from "@/types";
import { validateDateRange, getDateRangeFromStrings } from "./date-utils";

export function validateActivity(activity: unknown): activity is Activity {
  return (
    activity !== null &&
    typeof activity === 'object' &&
    'time' in activity &&
    'title' in activity &&
    'details' in activity &&
    typeof (activity as Record<string, unknown>).time === 'string' &&
    typeof (activity as Record<string, unknown>).title === 'string' &&
    typeof (activity as Record<string, unknown>).details === 'string' &&
    (typeof (activity as Record<string, unknown>).durationMinutes === 'number' || (activity as Record<string, unknown>).durationMinutes === undefined) &&
    (typeof (activity as Record<string, unknown>).costUSD === 'number' || (activity as Record<string, unknown>).costUSD === undefined)
  );
}

export function validateDayItinerary(day: unknown): day is DayItinerary {
  return (
    day !== null &&
    typeof day === 'object' &&
    'day' in day &&
    'date' in day &&
    'activities' in day &&
    typeof (day as Record<string, unknown>).day === 'number' &&
    typeof (day as Record<string, unknown>).date === 'string' &&
    Array.isArray((day as Record<string, unknown>).activities) &&
    ((day as Record<string, unknown>).activities as unknown[]).every(validateActivity)
  );
}

export function validateTripResponse(data: unknown): data is TripResponse {
  return (
    data !== null &&
    typeof data === 'object' &&
    'itinerary' in data &&
    'packing_list' in data &&
    Array.isArray((data as Record<string, unknown>).itinerary) &&
    ((data as Record<string, unknown>).itinerary as unknown[]).length > 0 &&
    ((data as Record<string, unknown>).itinerary as unknown[]).every(validateDayItinerary) &&
    Array.isArray((data as Record<string, unknown>).packing_list) &&
    ((data as Record<string, unknown>).packing_list as unknown[]).every((item: unknown) => typeof item === 'string') &&
    // Cost summary is optional, but if present should be valid
    ((data as Record<string, unknown>).costSummary === undefined || validateCostSummary((data as Record<string, unknown>).costSummary))
  );
}

export function validateCostSummary(costSummary: unknown): boolean {
  return (
    costSummary !== null &&
    typeof costSummary === 'object' &&
    'totalCostUSD' in costSummary &&
    'dailyAverageCostUSD' in costSummary &&
    'costBreakdown' in costSummary &&
    typeof (costSummary as Record<string, unknown>).totalCostUSD === 'number' &&
    typeof (costSummary as Record<string, unknown>).dailyAverageCostUSD === 'number' &&
    typeof (costSummary as Record<string, unknown>).costBreakdown === 'object' &&
    ((costSummary as Record<string, unknown>).budgetComparisonUSD === undefined ||
     (typeof (costSummary as Record<string, unknown>).budgetComparisonUSD === 'object' &&
      (costSummary as Record<string, unknown>).budgetComparisonUSD !== null &&
      'budgetAmountUSD' in ((costSummary as Record<string, unknown>).budgetComparisonUSD as Record<string, unknown>) &&
      'isOverBudget' in ((costSummary as Record<string, unknown>).budgetComparisonUSD as Record<string, unknown>) &&
      typeof (((costSummary as Record<string, unknown>).budgetComparisonUSD as Record<string, unknown>).budgetAmountUSD) === 'number' &&
      typeof (((costSummary as Record<string, unknown>).budgetComparisonUSD as Record<string, unknown>).isOverBudget) === 'boolean'))
  );
}

export function validateRequestBody(body: FormState): {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Destination validation
  if (!body.destination || typeof body.destination !== 'string' || body.destination.trim().length === 0) {
    errors.push('Destination is required');
  }

  // Number of people validation
  if (body.numberOfPeople) {
    const numPeople = parseInt(body.numberOfPeople);
    if (isNaN(numPeople) || numPeople < 1) {
      errors.push('Number of people must be at least 1');
    } else if (numPeople > 20) {
      warnings.push('Large groups may require special arrangements');
    }
  }

  // Budget validation
  if (body.budgetAmount) {
    const budgetNum = parseFloat(body.budgetAmount);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      errors.push('Budget amount must be a valid positive number');
    } else if (budgetNum < 50) {
      warnings.push('Very low budget may limit available options');
    }
  }

  // Enhanced date validation using new date utilities
  if (body.from && body.to) {
    const dateRange = getDateRangeFromStrings(body.from, body.to);
    
    if (!dateRange.startDate) {
      errors.push('Invalid start date format. Please use MM/DD/YYYY');
    }
    
    if (!dateRange.endDate) {
      errors.push('Invalid end date format. Please use MM/DD/YYYY');
    }
    
    if (dateRange.startDate && dateRange.endDate) {
      const validation = validateDateRange(dateRange.startDate, dateRange.endDate);
      errors.push(...validation.errors);
      
      if (validation.duration) {
        // Update duration in body if not set
        if (!body.duration) {
          body.duration = validation.duration;
        }
        
        // Check for duration mismatch
        if (body.duration && Math.abs(body.duration - validation.duration) > 0) {
          warnings.push(`Duration calculated from dates (${validation.duration} days) differs from specified duration`);
        }
      }
    }
  } else if (!body.duration) {
    errors.push('Either specify travel dates or duration');
  }

  // Duration validation (if specified without dates)
  if (body.duration && typeof body.duration === 'number') {
    if (body.duration < 1 || body.duration > 365) {
      errors.push('Duration must be between 1 and 365 days');
    } else if (body.duration > 30) {
      warnings.push('Long trips require more planning and may be more expensive');
    }
  }

  // Currency validation
  if (body.budgetCurrency && typeof body.budgetCurrency === 'string') {
    // Basic currency code validation (3 letters)
    if (!/^[A-Z]{3}$/.test(body.budgetCurrency)) {
      errors.push('Invalid currency code format');
    }
  }

  // Interests validation
  if (body.interests && Array.isArray(body.interests)) {
    if (body.interests.length > 10) {
      warnings.push('Too many interests selected may make planning difficult');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

// Additional validation for form state completeness
export function validateFormCompleteness(body: FormState): {
  completeness: number; // 0-100
  missingFields: string[];
  suggestions: string[];
} {
  const requiredFields = ['destination'];
  const optionalFields = ['numberOfPeople', 'budgetAmount', 'budgetCurrency', 'interests', 'mustSee', 'customRequest', 'activities'];
  const dateFields = ['from', 'to'];
  
  const missingFields: string[] = [];
  const suggestions: string[] = [];
  let filledFields = 0;
  const totalFields = requiredFields.length + optionalFields.length + dateFields.length;
  
  // Check required fields
  requiredFields.forEach(field => {
    if (!body[field as keyof FormState] || (body[field as keyof FormState] as string).trim() === '') {
      missingFields.push(field);
    } else {
      filledFields++;
    }
  });
  
  // Check optional fields
  optionalFields.forEach(field => {
    const value = body[field as keyof FormState];
    if (value && (typeof value === 'string' ? value.trim() !== '' : Array.isArray(value) ? value.length > 0 : true)) {
      filledFields++;
    }
  });
  
  // Check date fields
  if (body.from && body.to) {
    filledFields += 2;
  } else if (body.duration) {
    filledFields += 1; // Partial credit for duration
    suggestions.push('Consider specifying exact travel dates for better planning');
  } else {
    missingFields.push('travel dates or duration');
  }
  
  // Generate suggestions
  if (!body.budgetAmount) {
    suggestions.push('Adding a budget helps create more realistic recommendations');
  }
  
  if (!body.interests || body.interests.length === 0) {
    suggestions.push('Select interests to get personalized activity recommendations');
  }
  
  if (!body.numberOfPeople || body.numberOfPeople === '1') {
    suggestions.push('Specify number of travelers for accurate cost estimates');
  }
  
  const completeness = Math.round((filledFields / totalFields) * 100);
  
  return {
    completeness,
    missingFields,
    suggestions
  };
}