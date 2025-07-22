export const buildPrompt = (
  dest: string,
  days: number,
  budgetAmount: string,
  budgetCurrency: string,
  interests: string[],
  mustSee: string,
  customRequest: string,
  numberOfPeople: string,
  startDate?: string,
  activities?: string
) => {
  // Calculate dates for the itinerary
  const dates = [];
  if (startDate) {
    const [day, month, year] = startDate.split("/");
    const start = new Date(`${year}-${month}-${day}`);
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(
        `${String(date.getDate()).padStart(2, "0")}/${String(
          date.getMonth() + 1
        ).padStart(2, "0")}/${date.getFullYear()}`
      );
    }
  }

  return `You are an expert travel planner. Generate a detailed ${days}-day itinerary with accurate cost estimations.

CRITICAL: Return ONLY valid JSON with this EXACT structure:
{
  "itinerary": [
    {
      "day": number,
      "date": "DD/MM/YYYY",
      "activities": [
        {
          "time": "HH:MM",
          "title": "string",
          "details": "string",
          "durationMinutes": number,
          "costUSD": number
        }
      ]
    }
  ],
  "packing_list": ["string"]
}

Requirements:
- Trip: ${days} days in ${dest} for ${numberOfPeople} people
- Budget: ${budgetAmount} ${budgetCurrency} total
- Start date: ${startDate || 'flexible'}
- Interests: ${interests.join(", ") || "general sightseeing"}
- Must-see: ${mustSee || "none specified"}
- Preferred activities: ${activities || "none specified"}
- Special requests: ${customRequest || "none"}

Rules:
- Include realistic times (09:00-22:00 range)
- Provide accurate cost estimates in USD for each activity (consider ${numberOfPeople} people)
- Include travel time between locations with transport costs
- Suggest 4-6 activities per day
- Pack list should be destination and season appropriate
- All dates must be consecutive starting from day 1${dates.length > 0 ? `\n- Use these exact dates: ${dates.join(', ')}` : ''}
- Each activity must have all required fields: time, title, details, durationMinutes, costUSD
- Times should be in HH:MM format (24-hour)

COST ESTIMATION GUIDELINES:
- Research typical costs for ${dest} and adjust for ${numberOfPeople} people
- Include accommodation costs (hotels/hostels) - spread across days if multi-day stays
- Food costs: breakfast ($10-25), lunch ($15-35), dinner ($25-60) per person in USD
- Transportation: local transport, taxis, tours - realistic pricing
- Activities: entrance fees, tours, experiences - check typical pricing
- Consider seasonal pricing and local cost of living
- If budget is specified (${budgetAmount} ${budgetCurrency}), try to stay within reasonable range
- Be specific about what's included in each cost (per person, total, etc.)`;
};