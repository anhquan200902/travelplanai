"use client";

import { useState, useEffect } from "react";
import { estimateCostInCurrency, formatCurrency } from "@/lib/cost-utils";
import { currencies } from "@/lib/currencies";

interface CostEstimatorProps {
  destination: string;
  duration: number;
  numberOfPeople: number;
  selectedCurrency: string;
  budgetAmount?: string;
  onEstimateUpdate?: (estimate: CostEstimate) => void;
}

interface CostEstimate {
  lowEstimate: number;
  midEstimate: number;
  highEstimate: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  breakdown: {
    accommodation: { min: number; max: number };
    food: { min: number; max: number };
    activities: { min: number; max: number };
    transportation: { min: number; max: number };
  };
}

// Base daily costs in USD for different destination types
const BASE_DAILY_COSTS = {
  budget: { min: 30, max: 60 },
  mid: { min: 80, max: 150 },
  luxury: { min: 200, max: 500 }
};

// Regional multipliers
const REGIONAL_MULTIPLIERS: Record<string, number> = {
  // Europe
  'switzerland': 2.2, 'norway': 2.0, 'denmark': 1.8, 'sweden': 1.7, 'iceland': 1.9,
  'uk': 1.6, 'england': 1.6, 'london': 1.8, 'france': 1.4, 'paris': 1.6,
  'germany': 1.3, 'netherlands': 1.5, 'austria': 1.4, 'belgium': 1.4,
  'italy': 1.2, 'spain': 1.1, 'portugal': 1.0, 'greece': 0.9,
  
  // Asia
  'japan': 1.5, 'tokyo': 1.7, 'singapore': 1.3, 'hong kong': 1.4,
  'south korea': 1.1, 'taiwan': 0.8, 'china': 0.7, 'thailand': 0.5,
  'vietnam': 0.4, 'cambodia': 0.4, 'laos': 0.4, 'myanmar': 0.4,
  'india': 0.3, 'nepal': 0.3, 'sri lanka': 0.4, 'indonesia': 0.5,
  'malaysia': 0.6, 'philippines': 0.5,
  
  // Americas
  'usa': 1.5, 'new york': 2.0, 'san francisco': 1.9, 'canada': 1.3,
  'mexico': 0.6, 'guatemala': 0.5, 'costa rica': 0.8, 'panama': 0.7,
  'colombia': 0.5, 'peru': 0.5, 'bolivia': 0.4, 'ecuador': 0.5,
  'brazil': 0.7, 'argentina': 0.6, 'chile': 0.9, 'uruguay': 0.8,
  
  // Africa
  'south africa': 0.6, 'morocco': 0.5, 'egypt': 0.4, 'kenya': 0.5,
  'tanzania': 0.5, 'uganda': 0.4, 'ethiopia': 0.3, 'ghana': 0.5,
  
  // Oceania
  'australia': 1.6, 'new zealand': 1.4, 'fiji': 1.0,
  
  // Middle East
  'uae': 1.4, 'dubai': 1.6, 'qatar': 1.5, 'israel': 1.3, 'jordan': 0.7,
  'turkey': 0.6, 'iran': 0.3,
};

function getDestinationMultiplier(destination: string): number {
  const dest = destination.toLowerCase();
  
  // Check for exact matches first
  for (const [key, multiplier] of Object.entries(REGIONAL_MULTIPLIERS)) {
    if (dest.includes(key)) {
      return multiplier;
    }
  }
  
  // Default multiplier for unknown destinations
  return 1.0;
}

export function CostEstimator({
  destination,
  duration,
  numberOfPeople,
  selectedCurrency,
  budgetAmount,
  onEstimateUpdate
}: CostEstimatorProps) {
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (destination && duration > 0 && numberOfPeople > 0) {
      generateEstimate();
    }
  }, [destination, duration, numberOfPeople, selectedCurrency]);

  const generateEstimate = async () => {
    setIsLoading(true);
    
    try {
      const multiplier = getDestinationMultiplier(destination);
      
      // Calculate base costs in USD
      const budgetDaily = BASE_DAILY_COSTS.budget;
      const midDaily = BASE_DAILY_COSTS.mid;
      const luxuryDaily = BASE_DAILY_COSTS.luxury;
      
      // Apply regional multiplier
      const adjustedBudget = {
        min: budgetDaily.min * multiplier,
        max: budgetDaily.max * multiplier
      };
      const adjustedMid = {
        min: midDaily.min * multiplier,
        max: midDaily.max * multiplier
      };
      const adjustedLuxury = {
        min: luxuryDaily.min * multiplier,
        max: luxuryDaily.max * multiplier
      };
      
      // Calculate total costs for the trip
      const lowTotalUSD = adjustedBudget.min * duration * numberOfPeople;
      const midTotalUSD = adjustedMid.min * duration * numberOfPeople;
      const highTotalUSD = adjustedLuxury.min * duration * numberOfPeople;
      
      // Convert to selected currency
      const lowEstimateResult = estimateCostInCurrency(lowTotalUSD, selectedCurrency, false);
      const midEstimateResult = estimateCostInCurrency(midTotalUSD, selectedCurrency, false);
      const highEstimateResult = estimateCostInCurrency(highTotalUSD, selectedCurrency, false);
      
      // Calculate breakdown (percentages based on typical travel spending)
      const breakdown = {
        accommodation: {
          min: lowEstimateResult.amount * 0.35,
          max: highEstimateResult.amount * 0.45
        },
        food: {
          min: lowEstimateResult.amount * 0.25,
          max: highEstimateResult.amount * 0.30
        },
        activities: {
          min: lowEstimateResult.amount * 0.20,
          max: highEstimateResult.amount * 0.25
        },
        transportation: {
          min: lowEstimateResult.amount * 0.20,
          max: highEstimateResult.amount * 0.15
        }
      };
      
      const newEstimate: CostEstimate = {
        lowEstimate: lowEstimateResult.amount,
        midEstimate: midEstimateResult.amount,
        highEstimate: highEstimateResult.amount,
        currency: selectedCurrency,
        confidence: lowEstimateResult.confidence,
        breakdown
      };
      
      setEstimate(newEstimate);
      onEstimateUpdate?.(newEstimate);
      
    } catch (error) {
      console.error('Error generating cost estimate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!destination || duration <= 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-blue-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return null;
  }

  const budgetNum = budgetAmount ? parseFloat(budgetAmount) : null;
  const isOverBudget = budgetNum && estimate.midEstimate > budgetNum;
  const isUnderBudget = budgetNum && estimate.lowEstimate < budgetNum;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">💰 Cost Estimate</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${
          estimate.confidence === 'high' ? 'bg-green-100 text-green-700' :
          estimate.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {estimate.confidence} confidence
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Budget</div>
          <div className="font-bold text-green-600">
            {formatCurrency(estimate.lowEstimate, selectedCurrency)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Mid-range</div>
          <div className="font-bold text-blue-600">
            {formatCurrency(estimate.midEstimate, selectedCurrency)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Luxury</div>
          <div className="font-bold text-purple-600">
            {formatCurrency(estimate.highEstimate, selectedCurrency)}
          </div>
        </div>
      </div>

      {budgetNum && (
        <div className={`text-sm p-2 rounded mb-3 ${
          isOverBudget ? 'bg-red-100 text-red-700' :
          isUnderBudget ? 'bg-green-100 text-green-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {isOverBudget && (
            <>
              ⚠️ Your budget ({formatCurrency(budgetNum, selectedCurrency)}) may be tight. 
              Consider budget options or extending your budget.
            </>
          )}
          {isUnderBudget && (
            <>
              ✅ Your budget ({formatCurrency(budgetNum, selectedCurrency)}) looks good! 
              You can enjoy mid-range to luxury options.
            </>
          )}
          {!isOverBudget && !isUnderBudget && (
            <>
              💡 Your budget ({formatCurrency(budgetNum, selectedCurrency)}) aligns well 
              with mid-range travel options.
            </>
          )}
        </div>
      )}

      <div className="text-xs text-gray-600">
        <div className="mb-2">
          <strong>Typical breakdown:</strong>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>🏨 Accommodation: 35-45%</div>
          <div>🍽️ Food: 25-30%</div>
          <div>🎯 Activities: 20-25%</div>
          <div>🚗 Transport: 15-20%</div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Estimates for {numberOfPeople} {numberOfPeople === 1 ? 'person' : 'people'} × {duration} days in {destination}
      </div>
    </div>
  );
}