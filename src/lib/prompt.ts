export const buildPrompt = (
  dest: string,
  days: number,
  budget: string,
  interests: string[],
  mustSee: string
) => `
You are a professional travel planner.  
Return **only** JSON with the exact keys:  
{
  "itinerary": [{ "day": 1, "activities": [{ "time": "...", "title": "...", "details": "..." }] }],
  "packing_list": ["item1", "item2"]
}

Trip: ${days} days in ${dest} for a ${budget} budget traveler.
Interests: ${interests.join(", ")}.
Must-see: ${mustSee}.
`;