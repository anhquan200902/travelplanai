"use client";

import { currencies } from "@/lib/currencies";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Itinerary } from "@/types";
import PDFExport from "@/components/travel/PDFExport";
import { PDFDownloadLink } from "@react-pdf/renderer";

const interestOptions = ["food", "culture", "beach", "hiking", "nightlife"];

export default function GeneratePage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    destination: "",
    from: "",
    to: "",
    budgetAmount: "",
    budgetCurrency: "USD",
    interests: [] as string[],
    mustSee: "",
    customRequest: "",
  });
  const [result, setResult] = useState<Itinerary | null>(null);

  const duration =
    form.from && form.to
      ? Math.ceil(
          (new Date(form.to).getTime() - new Date(form.from).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

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
    const payload = { ...form, duration };

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Failed to generate itinerary:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Form Section */}
      <aside className="w-1/3 bg-white p-8 shadow-lg">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Plan your next trip ✈️
          </h1>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Destination
            </label>
            <Input
              placeholder="e.g. Tokyo"
              value={form.destination}
              onChange={(e) =>
                setForm({ ...form, destination: e.target.value })
              }
            />
          </div>

          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                From
              </label>
              <Input
                type="date"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                To
              </label>
              <Input
                type="date"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
              />
            </div>
          </div>
          {duration > 0 && (
            <p className="text-sm text-gray-500">{duration} days</p>
          )}

          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Budget
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
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                value={form.budgetCurrency}
                onChange={(e) =>
                  setForm({ ...form, budgetCurrency: e.target.value })
                }
                className="w-full border rounded px-2 py-1 h-10"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
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

          <Button
            onClick={handleSubmit}
            disabled={loading || !form.destination}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg"
          >
            {loading ? "Generating…" : "Generate Itinerary"}
          </Button>
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

        {result && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                Your Itinerary
              </h2>
              <PDFDownloadLink
                document={<PDFExport data={result} />}
                fileName="itinerary.pdf"
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              >
                {({ loading }) =>
                  loading ? "Loading document..." : "Download PDF"
                }
              </PDFDownloadLink>
            </div>

            <div className="space-y-8">
              {result.itinerary.map((day) => (
                <div key={day.day} className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Day {day.day} - {day.date}
                  </h3>
                  <ul className="space-y-4">
                    {day.activities.map((activity, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-24 text-gray-600 font-medium">
                          {activity.time}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {activity.title}
                          </p>
                          <p className="text-gray-600">{activity.details}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

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

        {!loading && !result && (
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