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
    from: "",
    to: "",
    budgetAmount: "",
    budgetCurrency: "USD",
    interests: [] as string[],
    mustSee: "",
  });

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
    const payload = { ...form, duration };
    const id = btoa(JSON.stringify(payload));
    router.push(
      `/result/${id}?payload=${encodeURIComponent(JSON.stringify(payload))}`
    );
  };

  return (
    <main className="max-w-lg mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Plan your next trip ✈️</h1>

      <Input
        placeholder="Destination (e.g. Tokyo)"
        value={form.destination}
        onChange={(e) => setForm({ ...form, destination: e.target.value })}
      />

      <div className="flex gap-4">
        <Input
          type="date"
          value={form.from}
          onChange={(e) => setForm({ ...form, from: e.target.value })}
          className="w-full"
        />
        <Input
          type="date"
          value={form.to}
          onChange={(e) => setForm({ ...form, to: e.target.value })}
          className="w-full"
        />
      </div>
      {duration > 0 && <p>{duration} days</p>}

      <div className="flex gap-4">
        <Input
          type="number"
          placeholder="Budget Amount"
          value={form.budgetAmount}
          onChange={(e) =>
            setForm({ ...form, budgetAmount: e.target.value })
          }
          className="w-full"
        />
        <Input
          placeholder="Currency (e.g. USD)"
          value={form.budgetCurrency}
          onChange={(e) =>
            setForm({ ...form, budgetCurrency: e.target.value })
          }
          className="w-1/2"
        />
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