import { DateRange } from "@/types";

// Date formatting utilities
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}

export function formatDateForInput(date: Date): string {
  // Use local date components to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Handle MM/DD/YYYY format
  if (dateString.includes('/')) {
    const [month, day, year] = dateString.split('/').map(s => parseInt(s, 10));
    if (day && month && year && day <= 31 && month <= 12 && year >= 1900) {
      const date = new Date(year, month - 1, day); // month is 0-indexed
      return isValidDate(date) && date.getDate() === day ? date : null;
    }
    return null;
  }
  
  // Handle YYYY-MM-DD format
  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('-').map(s => parseInt(s, 10));
    if (day && month && year && day <= 31 && month <= 12 && year >= 1900) {
      const date = new Date(year, month - 1, day); // month is 0-indexed
      return isValidDate(date) && date.getDate() === day ? date : null;
    }
    return null;
  }
  
  return null;
}

export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

export function validateDateRange(startDate: Date | null, endDate: Date | null): {
  isValid: boolean;
  errors: string[];
  duration?: number;
} {
  const errors: string[] = [];
  
  if (!startDate) {
    errors.push("Start date is required");
  }
  
  if (!endDate) {
    errors.push("End date is required");
  }
  
  if (startDate && endDate) {
    if (startDate >= endDate) {
      errors.push("End date must be after start date");
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      errors.push("Start date cannot be in the past");
    }
    
    const duration = calculateDaysBetween(startDate, endDate);
    
    if (duration > 365) {
      errors.push("Trip duration cannot exceed 365 days");
    }
    
    if (duration < 1) {
      errors.push("Trip must be at least 1 day");
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      duration
    };
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getDateRangeFromStrings(fromString: string, toString: string): DateRange {
  return {
    startDate: parseDateString(fromString),
    endDate: parseDateString(toString)
  };
}

export function generateDateRange(startDate: Date, duration: number): Date[] {
  const dates: Date[] = [];
  
  for (let i = 0; i < duration; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}

export function formatDateRangeForDisplay(startDate: Date, endDate: Date): string {
  const start = formatDateForDisplay(startDate);
  const end = formatDateForDisplay(endDate);
  const duration = calculateDaysBetween(startDate, endDate);
  
  return `${start} - ${end} (${duration} day${duration !== 1 ? 's' : ''})`;
}

// Get suggested date ranges
export function getSuggestedDateRanges(): Array<{
  label: string;
  startDate: Date;
  endDate: Date;
}> {
  const today = new Date();
  const suggestions = [];
  
  // Next weekend
  const nextFriday = new Date(today);
  const daysUntilFriday = (5 - today.getDay() + 7) % 7;
  // If today is Friday, get next Friday (7 days from now)
  const daysToAdd = daysUntilFriday === 0 ? 7 : daysUntilFriday;
  nextFriday.setDate(today.getDate() + daysToAdd);
  const nextSunday = new Date(nextFriday);
  nextSunday.setDate(nextFriday.getDate() + 2);
  
  suggestions.push({
    label: "Next Weekend",
    startDate: nextFriday,
    endDate: nextSunday
  });
  
  // Next week (7 days)
  const nextWeekStart = new Date(today);
  nextWeekStart.setDate(today.getDate() + 7);
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 6); // 7 days total, so +6 from start
  
  suggestions.push({
    label: "Next Week (7 days)",
    startDate: nextWeekStart,
    endDate: nextWeekEnd
  });
  
  // Next month
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);
  const nextMonthEnd = new Date(nextMonth);
  nextMonthEnd.setDate(nextMonth.getDate() + 14);
  
  suggestions.push({
    label: "Next Month (2 weeks)",
    startDate: nextMonth,
    endDate: nextMonthEnd
  });
  
  return suggestions;
}

// Validate business rules for travel dates
export function validateTravelDates(startDate: Date, endDate: Date, destination?: string): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  const duration = calculateDaysBetween(startDate, endDate);
  const dayOfWeek = startDate.getDay();
  const month = startDate.getMonth();
  
  // Weekend travel warning
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    warnings.push("Weekend departures may be more expensive");
  }
  
  // Peak season warnings (general)
  if (month === 11 || month === 0 || month === 6 || month === 7) {
    warnings.push("This is typically peak travel season - expect higher prices");
  }
  
  // Duration suggestions
  if (duration < 3) {
    suggestions.push("Consider extending your trip for a more relaxed experience");
  } else if (duration > 21) {
    suggestions.push("Long trips require more planning - consider travel insurance");
  }
  
  // Advance booking suggestions
  const daysUntilTravel = calculateDaysBetween(new Date(), startDate);
  if (daysUntilTravel < 14) {
    warnings.push("Last-minute bookings may be more expensive");
  } else if (daysUntilTravel > 365) {
    warnings.push("Booking too far in advance may limit flexibility");
  }
  
  return {
    isValid: true,
    warnings,
    suggestions
  };
}