"use server";

import { suggestUsersByLocation, SuggestUsersByLocationInput } from "@/ai/flows/suggest-users-by-location";

export async function getSuggestedUsers(input: SuggestUsersByLocationInput) {
  try {
    const suggestions = await suggestUsersByLocation(input);
    return suggestions;
  } catch (error) {
    console.error("Error fetching user suggestions:", error);
    return [];
  }
}
