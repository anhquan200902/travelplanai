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
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Form Section */}
      <aside className="w-full md:w-1/3 bg-white p-6 md:p-8 shadow-lg overflow-y-auto">
        <div className="space-y-6">
          {/* Header with Title and Progress */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Plan your next trip ✈️
            </h1>
            <div className="bg-gray-100 p-2 rounded-lg text-center sm:text-right">
              <div className="text-xs text-gray-500">Form Completeness</div>
              <div className={`text-sm md:text-base font-bold ${
                formCompleteness.completeness >= 80 ? 'text-green-600' :
                formCompleteness.completeness >= 50 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {formCompleteness.completeness}%
              </div>
            </div>
          </div>

          {/* --- Trip Details Section --- */}
          <section className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 border-b pb-2">Trip Details</h2>
            
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                Destination *
              </label>
              <Input
                id="destination"
                placeholder="e.g. Tokyo, Japan"
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
                onBlur={() => setTouchedFields(prev => new Set(prev).add('destination'))}
                className={`${!form.destination && touchedFields.has('destination') ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                aria-required="true"
              />
              {!form.destination && touchedFields.has('destination') && (
                <p className="text-xs text-red-500 mt-1">Destination is required</p>
              )}
            </div>
            
            <div>
              <label htmlFor="numberOfPeople" className="block text-sm font-medium text-gray-700 mb-1">
                Number of People
              </label>
              <Input
                id="numberOfPeople"
                type="number"
                min="1"
                max="20"
                placeholder="e.g. 2"
                value={form.numberOfPeople}
                onChange={(e) =>
                  setForm({ ...form, numberOfPeople: e.target.value })
                }
                aria-label="Number of people traveling"
              />
            </div>

            {/* Date Range Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Travel Dates
              </label>
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
            </div>
          </section>

          {/* --- Preferences Section --- */}
          <section className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 border-b pb-2">Preferences</h2>
            
            {/* Budget Input */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="budgetAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Budget (Optional)
                  </label>
                  <Input
                    id="budgetAmount"
                    type="number"
                    placeholder="Amount"
                    value={form.budgetAmount}
                    onChange={(e) =>
                      setForm({ ...form, budgetAmount: e.target.value })
                    }
                    aria-label="Budget amount"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label htmlFor="budgetCurrency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    id="budgetCurrency"
                    value={form.budgetCurrency}
                    onChange={(e) =>
                      setForm({ ...form, budgetCurrency: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 h-10 text-sm focus:ring-blue-500 focus:border-blue-500"
                    aria-label="Select budget currency"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Cost Estimator - Shown when relevant */}
              {form.destination && duration > 0 && (
                <div className="mt-2">
                  <CostEstimator
                    destination={form.destination}
                    duration={duration}
                    numberOfPeople={parseInt(form.numberOfPeople) || 1}
                    selectedCurrency={form.budgetCurrency}
                    budgetAmount={form.budgetAmount}
                  />
                </div>
              )}
            </div>
          </section>

          {/* --- Interests Section --- */}
          <section className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 border-b pb-2">Interests</h2>
            <div>
              <div className="flex flex-wrap gap-2 mt-1">
                {interestOptions.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleInterest(i)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      form.interests.includes(i)
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    aria-pressed={form.interests.includes(i)}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* --- Custom Requests Section (Collapsible) --- */}
          <section className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <details>
              <summary className="text-lg md:text-xl font-semibold text-gray-800 cursor-pointer list-none">
                <span className="border-b pb-2">Additional Preferences</span>
              </summary>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="mustSee" className="block text-sm font-medium text-gray-700 mb-1">
                    Must-see (optional)
                  </label>
                  <Input
                    id="mustSee"
                    placeholder="e.g. Eiffel Tower"
                    value={form.mustSee}
                    onChange={(e) => setForm({ ...form, mustSee: e.target.value })}
                    aria-label="Must-see attractions"
                  />
                </div>
                <div>
                  <label htmlFor="activities" className="block text-sm font-medium text-gray-700 mb-1">
                    Activities (optional)
                  </label>
                  <textarea
                    id="activities"
                    placeholder="e.g. scuba diving, museum visits, cooking classes, etc."
                    value={form.activities}
                    onChange={(e) =>
                      setForm({ ...form, activities: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    aria-label="Preferred activities"
                  />
                </div>
                <div>
                  <label htmlFor="customRequest" className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Request (optional)
                  </label>
                  <textarea
                    id="customRequest"
                    placeholder="e.g. specific hotel, dietary restrictions, etc."
                    value={form.customRequest}
                    onChange={(e) =>
                      setForm({ ...form, customRequest: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    aria-label="Any custom requests or special needs"
                  />
                </div>
              </div>
            </details>
          </section>

          {/* --- Form Feedback and Submit Button --- */}
          
          {/* Form completeness suggestions */}
          {formCompleteness.suggestions.length > 0 && formCompleteness.completeness < 80 && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">💡 Suggestions:</h3>
                  <ul className="mt-1 text-sm text-blue-700 list-disc list-inside space-y-1">
                    {formCompleteness.suggestions.slice(0, 3).map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">⚠️ Please Note:</h3>
                  <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading || !form.destination || formCompleteness.completeness < 10} // Lowered threshold slightly
            className={`w-full font-bold py-3 px-4 rounded-lg transition-colors ${
              formCompleteness.completeness >= 80
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : formCompleteness.completeness >= 50
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating…
              </span>
            ) : formCompleteness.completeness < 10 ? (
              "Complete Required Fields"
            ) : (
              "Generate Itinerary"
            )}
          </Button>
          
          {formCompleteness.completeness < 100 && (
            <div className="text-xs text-gray-500 text-center">
              Complete more fields for better recommendations ({formCompleteness.completeness}% done)
            </div>
          )}
        </div>
      </aside>

      {/* Result Section */}
      <main className="w-full md:w-2/3 p-6 md:p-8 overflow-y-auto bg-gray-50 md:bg-white">
        {loading && (
          <div className="flex justify-center items-center h-full py-20">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-lg text-gray-600">
                Generating your dream trip...
              </p>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 max-w-3xl mx-auto">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Error generating itinerary
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {result && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                Your Itinerary
              </h2>
              {pdfDocument && (
                <PDFDownloadLink
                  document={pdfDocument}
                  fileName={`itinerary-${form.destination.replace(/\s+/g, '_')}-${form.from || 'dates'}.pdf`}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 whitespace-nowrap"
                >
                  {({ loading: pdfLoading }) =>
                    pdfLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading PDF...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Download PDF
                      </span>
                    )
                  }
                </PDFDownloadLink>
              )}
            </div>
            <div className="space-y-6">
              {result.itinerary.map((day) => (
                <div key={day.day} className="bg-white p-5 md:p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-3">
                    <h3 className="text-lg md:text-xl font-bold text-gray-800">
                      Day {day.day} - {day.date}
                    </h3>
                    {day.dailyCostUSD !== undefined && day.dailyCostUSD > 0 && (
                      <div className="bg-gray-100 p-2 rounded text-right min-w-[120px]">
                        <p className="text-xs text-gray-500">Daily Total</p>
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
                      <li key={index} className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded hover:bg-gray-50">
                        <div className="sm:w-24 text-gray-600 font-medium text-sm sm:text-base">
                          {activity.time}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">
                                {activity.title}
                              </p>
                              <p className="text-gray-600 text-sm">{activity.details}</p>
                              {activity.durationMinutes && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Duration: {Math.floor(activity.durationMinutes / 60)}h {activity.durationMinutes % 60}m
                                </p>
                              )}
                            </div>
                            {activity.costUSD !== undefined && activity.costUSD > 0 && (
                              <div className="text-right bg-gray-50 p-2 rounded min-w-[80px] sm:min-w-[100px]">
                                <p className="font-medium text-green-600 text-sm">
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
              <div className="mt-8 bg-white p-5 md:p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-5">
                  Cost Summary
                </h3>
                {/* Total Cost and Budget Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-semibold text-gray-800 mb-2">Trip Total</h4>
                    <p className="text-xl md:text-2xl font-bold text-blue-600">
                      {formatCurrency(result.costSummary.totalCostUSD)}
                    </p>
                    {form.budgetCurrency !== 'USD' && (
                      <p className="text-sm text-gray-600 mt-1">
                        {formatCurrency(convertFromUSD(result.costSummary.totalCostUSD, form.budgetCurrency), form.budgetCurrency)}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Daily Average: {formatCurrency(result.costSummary.dailyAverageCostUSD)}
                    </p>
                  </div>
                  {result.costSummary.budgetComparisonUSD && (
                    <div className={`p-4 rounded-lg border ${
                      result.costSummary.budgetComparisonUSD.isOverBudget
                        ? 'bg-red-50 border-red-100'
                        : 'bg-green-50 border-green-100'
                    }`}>
                      <h4 className="font-semibold text-gray-800 mb-2">Budget Analysis</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        Budget: {formatCurrency(result.costSummary.budgetComparisonUSD.originalBudgetAmount, result.costSummary.budgetComparisonUSD.originalCurrency)}
                      </p>
                      <p className={`font-bold text-base ${
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
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Cost Breakdown</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {Object.entries(result.costSummary.costBreakdown).map(([category, amount]) => (
                      amount > 0 && (
                        <div key={category} className="bg-white p-3 rounded text-center border border-gray-200">
                          <p className="text-xs text-gray-500 capitalize">{category}</p>
                          <p className="font-medium text-gray-800 text-sm">
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
            
            <div className="mt-8 bg-white p-5 md:p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                Packing List
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {result.packing_list.map((item, index) => (
                  <li key={index} className="text-sm md:text-base">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {!loading && !result && !error && (
          <div className="flex justify-center items-center h-full py-20">
            <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              <p className="mt-4 text-lg text-gray-500">
                Fill out the form to generate your travel plan.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
