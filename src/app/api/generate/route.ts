import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { buildPrompt } from "@/lib/prompt";
import { validateRequestBody, validateTripResponse } from "@/lib/validation";
import { generateCostSummary, addDailyCostsToItinerary } from "@/lib/cost-utils";
import { openrouter } from "@/lib/openrouter";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper function to call Groq API
async function callGroqAPI(prompt: string) {
  console.log("Attempting to call Groq API...");
  const chat = await groq.chat.completions.create({
    model: "llama3-70b-8192",
    messages: [
      {
        role: "system",
        content: "You are a travel planning expert. Return only valid JSON matching the exact schema provided. Do not include any explanatory text."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const raw = chat.choices[0].message?.content;
  if (!raw) {
    throw new Error("Empty response from Groq API");
  }
  
  console.log("Groq API call successful");
  return raw;
}

// Helper function to call OpenRouter API
async function callOpenRouterAPI(prompt: string) {
  console.log("Attempting to call OpenRouter API (fallback)...");
  const response = await openrouter.createChatCompletion({
    model: "deepseek/deepseek-r1-0528-qwen3-8b:free",
    messages: [
      {
        role: "system",
        content: "You are a travel planning expert. Return only valid JSON matching the exact schema provided. Do not include any explanatory text. Your response must be valid JSON only."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.1,
    // Remove response_format for compatibility with more models
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty response from OpenRouter API");
  }
  
  console.log("OpenRouter API call successful");
  return raw;
}

// Helper function to call APIs with fallback logic
async function callAIWithFallback(prompt: string): Promise<string> {
  let lastError: Error | null = null;
  
  // Try Groq first
  try {
    return await callGroqAPI(prompt);
  } catch (error) {
    lastError = error as Error;
    console.warn("Groq API failed:", error);
    
    // Check if we should fallback (rate limit, overload, or other API errors)
    // Check both error message and error properties for HTTP status codes
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const errorString = String(error).toLowerCase();
    
    
    const shouldFallback = (
      // Check error message for common patterns
      errorMessage.includes('rate limit') ||
      errorMessage.includes('overload') ||
      errorMessage.includes('503') ||
      errorMessage.includes('502') ||
      errorMessage.includes('500') ||
      errorMessage.includes('401') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('api error') ||
      errorMessage.includes('invalid api key') ||
      errorMessage.includes('service unavailable') ||
      errorMessage.includes('bad gateway') ||
      errorMessage.includes('internal server error') ||
      errorMessage.includes('unauthorized') ||
      // Check full error string for HTTP status codes
      errorString.includes('503') ||
      errorString.includes('502') ||
      errorString.includes('500') ||
      errorString.includes('401') ||
      // Check if error has status property (common in HTTP errors)
      (error as any)?.status === 503 ||
      (error as any)?.status === 502 ||
      (error as any)?.status === 500 ||
      (error as any)?.status === 401 ||
      (error as any)?.statusCode === 503 ||
      (error as any)?.statusCode === 502 ||
      (error as any)?.statusCode === 500 ||
      (error as any)?.statusCode === 401 ||
      // Check if error has response.status (axios-style errors)
      (error as any)?.response?.status === 503 ||
      (error as any)?.response?.status === 502 ||
      (error as any)?.response?.status === 500 ||
      (error as any)?.response?.status === 401
    );
    
    if (shouldFallback && process.env.OPENROUTER_API_KEY) {
      try {
        console.log("Falling back to OpenRouter API...");
        return await callOpenRouterAPI(prompt);
      } catch (fallbackError) {
        console.error("OpenRouter fallback also failed:", fallbackError);
        // Throw the original Groq error if fallback also fails
        throw lastError;
      }
    } else {
      // Re-throw the original error if no fallback is available
      throw lastError;
    }
  }
}

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

    // Call AI API with fallback logic
    const raw = await callAIWithFallback(prompt);

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
    
    // Handle specific API errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json({
          error: "Service temporarily unavailable",
          details: "Both primary and backup services are currently overloaded. Please try again in a moment."
        }, { status: 429 });
      }
      
      if (error.message.includes('API key')) {
        return NextResponse.json({
          error: "Service configuration error",
          details: "Please contact support"
        }, { status: 500 });
      }
      
      if (error.message.includes('OpenRouter') || error.message.includes('Groq')) {
        return NextResponse.json({
          error: "AI service unavailable",
          details: "Both primary and backup AI services are currently unavailable. Please try again later."
        }, { status: 503 });
      }
    }

    return NextResponse.json({
      error: "Failed to generate itinerary",
      details: "An unexpected error occurred"
    }, { status: 500 });
  }
}