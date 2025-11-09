
'use server';
/**
 * @fileOverview A flow to suggest users based on location.
 *
 * - suggestUsersByLocation - A function that sorts users by proximity to a given location.
 * - SuggestUsersByLocationInput - The input type for the suggestUsersByLocation function.
 * - SuggestUsersByLocationOutput - The return type for the suggestUsersByLocation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { UserProfile } from '@/types';
import { GeoPoint } from 'firebase/firestore';

// Haversine distance formula to calculate distance between two points on Earth
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}


const UserProfileSchema = z.object({
    id: z.string(),
    userId: z.string().optional(),
    name: z.string(),
    email: z.string(),
    bio: z.string().optional(),
    coordinates: z.custom<GeoPoint>((val) => val instanceof GeoPoint).nullable().optional(),
});

const SuggestUsersByLocationInputSchema = z.object({
  latitude: z.number().describe('The latitude of the user.'),
  longitude: z.number().describe('The longitude of the user.'),
  users: z.array(UserProfileSchema).describe('A list of user profiles to sort.'),
});

const SuggestUsersByLocationOutputSchema = z.array(UserProfileSchema);

export type SuggestUsersByLocationInput = z.infer<typeof SuggestUsersByLocationInputSchema>;
export type SuggestUsersByLocationOutput = z.infer<typeof SuggestUsersByLocationOutputSchema>;

export async function suggestUsersByLocation(input: SuggestUsersByLocationInput): Promise<SuggestUsersByLocationOutput> {
  return suggestUsersByLocationFlow(input);
}

const suggestUsersByLocationFlow = ai.defineFlow(
  {
    name: 'suggestUsersByLocationFlow',
    inputSchema: SuggestUsersByLocationInputSchema,
    outputSchema: SuggestUsersByLocationOutputSchema,
  },
  async (input) => {
    const { latitude, longitude, users } = input;

    const sortedUsers = users.sort((a, b) => {
      const locationA = a.coordinates;
      const locationB = b.coordinates;

      if (locationA && locationB) {
        const distanceA = getDistance(latitude, longitude, locationA.latitude, locationA.longitude);
        const distanceB = getDistance(latitude, longitude, locationB.latitude, locationB.longitude);
        return distanceA - distanceB;
      }
      if (locationA) return -1; // A has location, B does not
      if (locationB) return 1;  // B has location, A does not
      return 0; // Neither has location
    });

    return sortedUsers;
  }
);
