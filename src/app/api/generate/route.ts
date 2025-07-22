import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { buildPrompt } from "@/lib/prompt";
import { validateRequestBody, validateTripResponse } from "@/lib/validation";
import { generateCostSummary, addDailyCostsToItinerary } from "@/lib/cost-utils";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const validation = validateRequestBody(body);
    if (!validation.isValid) {
      return NextResponse.json({
        error: "Invalid request parameters",
        details: validation.errors
      }, { status: 400 });
    }

    const {
      destination,
      duration,
      numberOfPeople = "1",
      budgetAmount,
      budgetCurrency,
      interests,
      mustSee,
      customRequest,
      from,
    } = body;

    // Process interests array
    const interestsArr = Array.isArray(interests)
      ? interests
      : (interests ? interests.split(",").map((s: string) => s.trim()) : []);

    // Build the prompt with corrected parameter order
    const prompt = buildPrompt(
      destination,
      duration,
      budgetAmount || "",
      budgetCurrency || "USD",
      interestsArr,
      mustSee || "",
      customRequest || "",
      numberOfPeople,
      from
    );

    // Call Groq API with enhanced error handling
    const chat = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: "You are a travel planning expert. Return only valid JSON matching the exact schema provided. Do not include any explanatory text."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.1, // Slightly higher for creativity while maintaining consistency
      response_format: { type: "json_object" },
      max_tokens: 4000 // Ensure sufficient tokens for complete response
    });

    const raw = chat.choices[0].message?.content;
    if (!raw) {
      console.error("Empty response from Groq API");
      return NextResponse.json({ error: "AI service returned empty response" }, { status: 500 });
    }

    // Parse JSON with error handling
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Raw response:", raw);
      return NextResponse.json({
        error: "Invalid response format from AI service",
        details: "The AI returned malformed JSON"
      }, { status: 500 });
    }

    // Validate the response structure
    if (!validateTripResponse(parsed)) {
      console.error("Invalid response structure:", parsed);
      return NextResponse.json({
        error: "Invalid itinerary structure",
        details: "The AI response does not match the expected format"
      }, { status: 500 });
    }

    // Add daily costs to itinerary
    const itineraryWithCosts = addDailyCostsToItinerary(parsed.itinerary);
    
    // Generate cost summary
    const costSummary = generateCostSummary(
      { ...parsed, itinerary: itineraryWithCosts },
      budgetAmount,
      budgetCurrency
    );

    // Return enhanced response with cost information
    const enhancedResponse = {
      ...parsed,
      itinerary: itineraryWithCosts,
      costSummary,
      numberOfPeople: parseInt(numberOfPeople)
    };

    return NextResponse.json(enhancedResponse);

  } catch (error) {
    console.error("API error:", error);
    
    // Handle specific Groq API errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json({
          error: "Service temporarily unavailable",
          details: "Please try again in a moment"
        }, { status: 429 });
      }
      
      if (error.message.includes('API key')) {
        return NextResponse.json({
          error: "Service configuration error",
          details: "Please contact support"
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      error: "Failed to generate itinerary",
      details: "An unexpected error occurred"
    }, { status: 500 });
  }
}