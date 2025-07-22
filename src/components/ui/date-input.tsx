"use client";

import { useState, useEffect } from "react";
import { Input } from "./input";
import { formatDateForDisplay, formatDateForInput, parseDateString, getSuggestedDateRanges, validateTravelDates } from "@/lib/date-utils";

interface DateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
}

export function DateInput({ label, value, onChange, placeholder, min, max, className }: DateInputProps) {
  const [inputType, setInputType] = useState<'text' | 'date'>('text');
  const [isValid, setIsValid] = useState(true);

  const handleFocus = () => {
    // Only switch to date type if the browser supports it properly
    if (typeof window !== 'undefined' && 'showPicker' in HTMLInputElement.prototype) {
      setInputType('date');
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Small delay to allow date picker selection
    setTimeout(() => {
      if (!value) {
        setInputType('text');
      }
    }, 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (inputType === 'date') {
      // Convert from YYYY-MM-DD to DD/MM/YYYY
      if (newValue) {
        // Parse the date string directly to avoid timezone issues
        const [year, month, day] = newValue.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed
        
        if (isValidDate(date)) {
          const formatted = formatDateForDisplay(date);
          onChange(formatted);
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } else {
        onChange('');
        setIsValid(true);
      }
    } else {
      // Handle text input with auto-formatting for MM/DD/YYYY
      let formattedValue = newValue;
      
      // Remove any non-numeric characters except /
      formattedValue = formattedValue.replace(/[^\d/]/g, '');
      
      // Auto-add slashes for MM/DD/YYYY format
      if (formattedValue.length >= 2 && formattedValue.indexOf('/') === -1) {
        formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2);
      }
      if (formattedValue.length >= 5 && formattedValue.split('/').length === 2) {
        const parts = formattedValue.split('/');
        formattedValue = parts[0] + '/' + parts[1].substring(0, 2) + '/' + parts[1].substring(2);
      }
      
      // Limit to MM/DD/YYYY format (10 characters)
      if (formattedValue.length > 10) {
        formattedValue = formattedValue.substring(0, 10);
      }
      
      onChange(formattedValue);
      
      // Only validate if the input looks complete
      if (formattedValue.length >= 8) {
        const parsed = parseDateString(formattedValue);
        setIsValid(parsed !== null);
      } else {
        setIsValid(true); // Don't show error while typing
      }
    }
  };

  // Helper function to check if date is valid
  const isValidDate = (date: Date): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  // Convert display value to input value for date type
  const getInputValue = () => {
    if (inputType === 'date' && value) {
      const parsed = parseDateString(value);
      return parsed ? formatDateForInput(parsed) : '';
    }
    return value;
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <Input
        type={inputType}
        value={getInputValue()}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder || "MM/DD/YYYY"}
        min={min}
        max={max}
        className={`${!isValid ? 'border-red-500' : ''}`}
      />
      {!isValid && (
        <p className="text-xs text-red-500 mt-1">
          Please enter a valid date in MM/DD/YYYY format
        </p>
      )}
    </div>
  );
}

interface DateRangeInputProps {
  fromLabel?: string;
  toLabel?: string;
  fromValue: string;
  toValue: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onDateRangeChange?: (fromValue: string, toValue: string) => void;
  showSuggestions?: boolean;
  destination?: string;
}

export function DateRangeInput({
  fromLabel = "From",
  toLabel = "To",
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  onDateRangeChange,
  showSuggestions = true,
  destination
}: DateRangeInputProps) {
  const [duration, setDuration] = useState<number | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (fromValue && toValue) {
      const startDate = parseDateString(fromValue);
      const endDate = parseDateString(toValue);
      
      if (startDate && endDate) {
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        setDuration(days);
        
        // Validate travel dates and get warnings/suggestions
        const validation = validateTravelDates(startDate, endDate, destination);
        setWarnings(validation.warnings);
        setSuggestions(validation.suggestions);
      } else {
        setDuration(null);
        setWarnings([]);
        setSuggestions([]);
      }
    } else {
      setDuration(null);
      setWarnings([]);
      setSuggestions([]);
    }
  }, [fromValue, toValue, destination]);

  const handleSuggestionClick = (startDate: Date, endDate: Date) => {
    const formattedStartDate = formatDateForDisplay(startDate);
    const formattedEndDate = formatDateForDisplay(endDate);
    
    // Use the combined callback if available, otherwise fall back to individual callbacks
    if (onDateRangeChange) {
      onDateRangeChange(formattedStartDate, formattedEndDate);
    } else {
      onFromChange(formattedStartDate);
      onToChange(formattedEndDate);
    }
  };

  const suggestedRanges = getSuggestedDateRanges();

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <DateInput
          label={fromLabel}
          value={fromValue}
          onChange={onFromChange}
          min={formatDateForInput(new Date())}
          className="flex-1"
        />
        <DateInput
          label={toLabel}
          value={toValue}
          onChange={onToChange}
          min={fromValue ? formatDateForInput(parseDateString(fromValue) || new Date()) : formatDateForInput(new Date())}
          className="flex-1"
        />
      </div>

      {duration !== null && duration > 0 && (
        <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
          <span className="font-medium">{duration} day{duration !== 1 ? 's' : ''}</span>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
          <div className="font-medium mb-1">⚠️ Travel Tips:</div>
          <ul className="list-disc list-inside space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
          <div className="font-medium mb-1">💡 Suggestions:</div>
          <ul className="list-disc list-inside space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {showSuggestions && !fromValue && !toValue && (
        <div className="border rounded-lg p-3 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Date Suggestions:</h4>
          <div className="space-y-2">
            {suggestedRanges.map((range, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(range.startDate, range.endDate)}
                className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded transition-colors"
              >
                <span className="font-medium">{range.label}</span>
                <span className="text-gray-500 ml-2">
                  ({formatDateForDisplay(range.startDate)} - {formatDateForDisplay(range.endDate)})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}