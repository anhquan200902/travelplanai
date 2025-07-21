"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const interestOptions = ["food", "culture", "beach", "hiking", "nightlife"];

export default function GeneratePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    destination: "",
    duration: 3,
    budget: "mid-range",
    interests: [] as string[],
    mustSee: "",
  });

  const toggleInterest = (i: string) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(i)
        ? f.interests.filter((x) => x !== i)
        : [...f.interests, i],
    }));

  const handleSubmit = async () => {
    setLoading(true);
    const id = btoa(JSON.stringify(form));
    router.push(`/result/${id}?payload=${encodeURIComponent(JSON.stringify(form))}`);
  };

  return (
    <main className="max-w-lg mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Plan your next trip ✈️</h1>

      <Input
        placeholder="Destination (e.g. Tokyo)"
        value={form.destination}
        onChange={(e) => setForm({ ...form, destination: e.target.value })}
      />

      <label className="block">
        Days
        <input
          type="range"
          min="1"
          max="14"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
          className="ml-2"
        />
        <span>{form.duration}</span>
      </label>

      <div>
        Budget
        <select
          value={form.budget}
          onChange={(e) => setForm({ ...form, budget: e.target.value })}
          className="ml-2 border rounded px-2 py-1"
        >
          <option value="budget">Budget</option>
          <option value="mid-range">Mid-range</option>
          <option value="luxury">Luxury</option>
        </select>
      </div>

      <div>
        Interests
        <div className="flex flex-wrap gap-2 mt-1">
          {interestOptions.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleInterest(i)}
              className={`px-2 py-1 rounded text-sm border ${
                form.interests.includes(i)
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <Input
        placeholder="Must-see (optional)"
        value={form.mustSee}
        onChange={(e) => setForm({ ...form, mustSee: e.target.value })}
      />

      <Button onClick={handleSubmit} disabled={loading || !form.destination}>
        {loading ? "Generating…" : "Generate Itinerary"}
      </Button>
    </main>
  );
}