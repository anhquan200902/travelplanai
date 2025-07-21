"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GeneratePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    destination: "",
    duration: 3,
    budget: "mid-range",
    interests: ["food", "culture"],
    mustSee: "",
  });

  const handleSubmit = async () => {
    const res = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify(form),
    });
    const json = await res.json();
    const id = btoa(JSON.stringify(form));
    await fetch(`/api/cache/${id}`, { method: "POST", body: JSON.stringify(json) });
    router.push(`/result/${id}`);
  };

  return (
    <main className="max-w-lg mx-auto space-y-4 p-4">
      <h1 className="text-2xl font-bold">Plan your dream trip ✈️</h1>
      <Input
        placeholder="Destination"
        value={form.destination}
        onChange={(e) => setForm({ ...form, destination: e.target.value })}
      />
      {/* Add sliders, checkboxes, etc. */}
      <Button onClick={handleSubmit}>Generate Itinerary</Button>
    </main>
  );
}