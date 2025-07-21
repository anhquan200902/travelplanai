export const buildPrompt = (
  dest: string,
  days: number,
  budgetAmount: string,
  budgetCurrency: string,
  interests: string[],
  mustSee: string,
  customRequest: string
) => `
You are an expert travel planner.
Return **only** valid JSON, no introductory text, no markdown fences, with the exact keys:
{
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "time": "HH:MM",
          "title": "...",
          "details": "...",
          "durationMinutes": ...,
          "costUSD": ...
        }
      ]
    }
  ],
  "packing_list": ["item1", "item2"]
}

Trip: ${days} days in ${dest} for a traveler with a budget of ${budgetAmount} ${budgetCurrency}.
Interests: ${interests.join(", ")}.
Must-see: ${mustSee || "none"}.
Custom Request: ${customRequest || "none"}.
`;