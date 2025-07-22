"use client";

import { currencies } from "@/lib/currencies";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangeInput } from "@/components/ui/date-input";
import { CostEstimator } from "@/components/ui/cost-estimator";
import { TripResponse, FormState } from "@/types";
import PDFExport from "@/components/travel/PDFExport";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { formatCurrency, convertFromUSD } from "@/lib/cost-utils";
import { validateFormCompleteness } from "@/lib/validation";
import { parseDateString, calculateDaysBetween } from "@/lib/date-utils";


const interestOptions = ["food", "culture", "beach", "hiking", "nightlife"];

export default function GeneratePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>({
    destination: "",
    from: "",
    to: "",
    numberOfPeople: "1",
    budgetAmount: "",
    budgetCurrency: "USD",
    interests: [] as string[],
    mustSee: "",
    customRequest: "",
    activities: "",
  });
  const [result, setResult] = useState<TripResponse | null>(null);
  const [formCompleteness, setFormCompleteness] = useState<{
    completeness: number;
    missingFields: string[];
    suggestions: string[];
  }>({ completeness: 0, missingFields: [], suggestions: [] });

  // Memoized PDF document - only updates when result changes
  const pdfDocument = useMemo(() => {
    if (!result) return null;
    return <PDFExport data={result} />;
  }, [result]);

  // Calculate duration using improved date utilities
  const duration = form.from && form.to ? (() => {
    const startDate = parseDateString(form.from);
    const endDate = parseDateString(form.to);
    return startDate && endDate ? calculateDaysBetween(startDate, endDate) : 0;
  })() : 0;

  // Update form completeness when form changes
  useEffect(() => {
    const completeness = validateFormCompleteness(form);
    setFormCompleteness(completeness);
  }, [form]);

  const toggleInterest = (i: string) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(i)
        ? f.interests.filter((x) => x !== i)
        : [...f.interests, i],
    }));

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    setWarnings([]);
    
    // Enhanced client-side validation
    const validation = validateFormCompleteness(form);
    if (validation.missingFields.length > 0) {
      setError(`Please fill in required fields: ${validation.missingFields.join(', ')}`);
      setLoading(false);
      return;
    }
    
    if (duration <= 0) {
      setError("Please select valid travel dates or specify duration");
      setLoading(false);
      return;
    }

    // Set any warnings
    if (validation.suggestions.length > 0) {
      setWarnings(validation.suggestions);
    }

    const payload = { ...form, duration };

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Additional client-side validation
      if (!data.itinerary || !Array.isArray(data.itinerary) || data.itinerary.length === 0) {
        throw new Error("Invalid itinerary data received");
      }
      
      setResult(data);
    } catch (error) {
      console.error("Failed to generate itinerary:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Form Section */}
      <aside className="w-1/3 bg-white p-8 shadow-lg overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">
              Plan your next trip ✈️
            </h1>
            <div className="text-right">
              <div className="text-xs text-gray-500">Form Completeness</div>
              <div className={`text-sm font-bold ${
                formCompleteness.completeness >= 80 ? 'text-green-600' :
                formCompleteness.completeness >= 50 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {formCompleteness.completeness}%
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Destination *
            </label>
            <Input
              placeholder="e.g. Tokyo, Japan"
              value={form.destination}
              onChange={(e) =>
                setForm({ ...form, destination: e.target.value })
              }
              className={!form.destination ? 'border-red-200' : ''}
            />
            {!form.destination && (
              <p className="text-xs text-red-500 mt-1">Destination is required</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Number of People
            </label>
            <Input
              type="number"
              min="1"
              max="20"
              placeholder="e.g. 2"
              value={form.numberOfPeople}
              onChange={(e) =>
                setForm({ ...form, numberOfPeople: e.target.value })
              }
            />
          </div>

          <DateRangeInput
            fromValue={form.from}
            toValue={form.to}
            onFromChange={(value) => setForm({ ...form, from: value })}
            onToChange={(value) => setForm({ ...form, to: value })}
            onDateRangeChange={(fromValue, toValue) => {
              setForm({ ...form, from: fromValue, to: toValue });
            }}
            destination={form.destination}
            showSuggestions={!form.from && !form.to}
          />

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  Budget (Optional)
                </label>
                <Input
                  type="number"
                  placeholder="Amount"
                  value={form.budgetAmount}
                  onChange={(e) =>
                    setForm({ ...form, budgetAmount: e.target.value })
                  }
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700">
                  Currency
                </label>
                <select
                  value={form.budgetCurrency}
                  onChange={(e) =>
                    setForm({ ...form, budgetCurrency: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1 h-10 text-xs"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cost Estimator */}
            {form.destination && duration > 0 && (
              <CostEstimator
                destination={form.destination}
                duration={duration}
                numberOfPeople={parseInt(form.numberOfPeople) || 1}
                selectedCurrency={form.budgetCurrency}
                budgetAmount={form.budgetAmount}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Interests
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {interestOptions.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleInterest(i)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    form.interests.includes(i)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Must-see (optional)
            </label>
            <Input
              placeholder="e.g. Eiffel Tower"
              value={form.mustSee}
              onChange={(e) => setForm({ ...form, mustSee: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Activities (optional)
            </label>
            <textarea
              placeholder="e.g. scuba diving, museum visits, cooking classes, etc."
              value={form.activities}
              onChange={(e) =>
                setForm({ ...form, activities: e.target.value })
              }
              className="w-full border rounded p-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Custom Request (optional)
            </label>
            <textarea
              placeholder="e.g. specific hotel, dietary restrictions, etc."
              value={form.customRequest}
              onChange={(e) =>
                setForm({ ...form, customRequest: e.target.value })
              }
              className="w-full border rounded p-2"
              rows={3}
            />
          </div>

          {/* Form completeness suggestions */}
          {formCompleteness.suggestions.length > 0 && formCompleteness.completeness < 80 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">💡 Suggestions:</div>
              <ul className="text-xs text-blue-700 space-y-1">
                {formCompleteness.suggestions.slice(0, 3).map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-yellow-800 mb-2">⚠️ Please Note:</div>
              <ul className="text-xs text-yellow-700 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading || !form.destination || formCompleteness.completeness < 30}
            className={`w-full font-bold py-3 px-4 rounded-lg transition-colors ${
              formCompleteness.completeness >= 80
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : formCompleteness.completeness >= 50
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
          >
            {loading ? "Generating…" :
             formCompleteness.completeness < 30 ? "Complete Required Fields" :
             "Generate Itinerary"}
          </Button>

          {formCompleteness.completeness < 100 && (
            <div className="text-xs text-gray-500 text-center">
              Complete more fields for better recommendations ({formCompleteness.completeness}% done)
            </div>
          )}
        </div>
      </aside>

      {/* Result Section */}
      <main className="w-2/3 p-8 overflow-y-auto">
        {loading && (
          <div className="flex justify-center items-center h-full">
            <p className="text-lg text-gray-600">
              Generating your dream trip...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error generating itinerary
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setError(null)}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                Your Itinerary
              </h2>
              {pdfDocument && (
                <PDFDownloadLink
                  document={pdfDocument}
                  fileName="itinerary.pdf"
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                  {({ loading }) =>
                    loading ? "Loading document..." : "Download PDF"
                  }
                </PDFDownloadLink>
              )}
            </div>

            <div className="space-y-8">
              {result.itinerary.map((day) => (
                <div key={day.day} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      Day {day.day} - {day.date}
                    </h3>
                    {day.dailyCostUSD && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Daily Total</p>
                        <p className="font-bold text-green-600">
                          {formatCurrency(day.dailyCostUSD)}
                        </p>
                        {form.budgetCurrency !== 'USD' && (
                          <p className="text-xs text-gray-400">
                            {formatCurrency(convertFromUSD(day.dailyCostUSD, form.budgetCurrency), form.budgetCurrency)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <ul className="space-y-4">
                    {day.activities.map((activity, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-24 text-gray-600 font-medium">
                          {activity.time}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">
                                {activity.title}
                              </p>
                              <p className="text-gray-600">{activity.details}</p>
                              {activity.durationMinutes && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Duration: {Math.floor(activity.durationMinutes / 60)}h {activity.durationMinutes % 60}m
                                </p>
                              )}
                            </div>
                            {activity.costUSD !== undefined && activity.costUSD > 0 && (
                              <div className="text-right ml-4">
                                <p className="font-medium text-green-600">
                                  {formatCurrency(activity.costUSD)}
                                </p>
                                {form.budgetCurrency !== 'USD' && (
                                  <p className="text-xs text-gray-400">
                                    {formatCurrency(convertFromUSD(activity.costUSD, form.budgetCurrency), form.budgetCurrency)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Cost Summary Section */}
            {result.costSummary && (
              <div className="mt-8 bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  Cost Summary
                </h3>
                
                {/* Total Cost and Budget Comparison */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Trip Total</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(result.costSummary.totalCostUSD)}
                    </p>
                    {form.budgetCurrency !== 'USD' && (
                      <p className="text-sm text-gray-600">
                        {formatCurrency(convertFromUSD(result.costSummary.totalCostUSD, form.budgetCurrency), form.budgetCurrency)}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Daily Average: {formatCurrency(result.costSummary.dailyAverageCostUSD)}
                    </p>
                  </div>

                  {result.costSummary.budgetComparisonUSD && (
                    <div className={`p-4 rounded-lg ${
                      result.costSummary.budgetComparisonUSD.isOverBudget
                        ? 'bg-red-50'
                        : 'bg-green-50'
                    }`}>
                      <h4 className="font-semibold text-gray-800 mb-2">Budget Analysis</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        Budget: {formatCurrency(result.costSummary.budgetComparisonUSD.originalBudgetAmount, result.costSummary.budgetComparisonUSD.originalCurrency)}
                      </p>
                      <p className={`font-bold ${
                        result.costSummary.budgetComparisonUSD.isOverBudget
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {result.costSummary.budgetComparisonUSD.isOverBudget ? 'Over' : 'Under'} by{' '}
                        {formatCurrency(Math.abs(result.costSummary.budgetComparisonUSD.differenceUSD))}
                      </p>
                      <p className="text-xs text-gray-500">
                        ({Math.abs(result.costSummary.budgetComparisonUSD.differencePercentage).toFixed(1)}% {result.costSummary.budgetComparisonUSD.isOverBudget ? 'over' : 'under'})
                      </p>
                    </div>
                  )}
                </div>

                {/* Cost Breakdown */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Cost Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(result.costSummary.costBreakdown).map(([category, amount]) => (
                      amount > 0 && (
                        <div key={category} className="text-center">
                          <p className="text-xs text-gray-500 capitalize">{category}</p>
                          <p className="font-medium text-gray-800">
                            {formatCurrency(amount)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {((amount / result.costSummary!.totalCostUSD) * 100).toFixed(0)}%
                          </p>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Packing List
              </h3>
              <ul className="list-disc list-inside text-gray-600">
                {result.packing_list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="flex justify-center items-center h-full">
            <p className="text-lg text-gray-500">
              Fill out the form to generate your travel plan.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}