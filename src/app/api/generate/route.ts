import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { buildPrompt } from "@/lib/prompt";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    destination,
    duration,
    budgetAmount,
    budgetCurrency,
    interests,
    mustSee,
    customRequest,
  } = body;
  const interestsArr = Array.isArray(interests)
    ? interests
    : interests.split(",").map((s: string) => s.trim());

  const prompt = buildPrompt(
    destination,
    duration,
    budgetAmount,
    budgetCurrency,
    interestsArr,
    mustSee,
    customRequest
  );
  const chat = await groq.chat.completions.create({
    model: "llama3-70b-8192",
    messages: [
        { role: "system", content: "You MUST output only valid JSON matching the provided schema." },
        { role: "user", content: prompt }],
    temperature: 0.0,
    response_format: {type: "json_object"}
  });

  const raw = chat.choices[0].message?.content;
  const parsed = JSON.parse(raw || "{}");

  return NextResponse.json(parsed);
}