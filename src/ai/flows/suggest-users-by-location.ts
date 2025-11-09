
'use server';
/**
 * @fileOverview Provides location-based chat suggestions.
 *
 * - suggestUsersByLocation - An async function that returns suggested users based on the user's location.
 * - SuggestUsersByLocationInput - The input type for the suggestUsersByLocation function, including latitude and longitude.
 * - SuggestUsersByLocationOutput - The output type for the suggestUsersByLocation function, a list of user profiles.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebase } from '@/firebase';
import { getDocs, collection } from 'firebase/firestore';
import type { UserProfile } from '@/types';

// Haversine distance function
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

const SuggestUsersByLocationInputSchema = z.object({
  latitude: z
    .number()
    .describe('The latitude of the user requesting suggestions.'),
  longitude: z
    .number()
    .describe('The longitude of the user requesting suggestions.'),
});
export type SuggestUsersByLocationInput = z.infer<
  typeof SuggestUsersByLocationInputSchema
>;

const UserProfileSchema = z.object({
  id: z.string().describe('The unique identifier of the user.'),
  name: z.string().describe('The name of the user.'),
  bio: z.string().optional().describe('A short biography of the user.'),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional()
    .describe('The last known location of the user.'),
  email: z.string().optional(),
  userId: z.string().optional(),
});

const SuggestUsersByLocationOutputSchema = z
  .array(UserProfileSchema)
  .describe('A list of suggested user profiles, ordered by proximity.');
export type SuggestUsersByLocationOutput = z.infer<
  typeof SuggestUsersByLocationOutputSchema
>;

export async function suggestUsersByLocation(
  input: SuggestUsersByLocationInput
): Promise<SuggestUsersByLocationOutput> {
  return suggestUsersByLocationFlow(input);
}

const suggestUsersByLocationFlow = ai.defineFlow(
  {
    name: 'suggestUsersByLocationFlow',
    inputSchema: SuggestUsersByLocationInputSchema,
    outputSchema: SuggestUsersByLocationOutputSchema,
  },
  async (input) => {
    // In a real application, you would fetch users from your database (e.g., Firestore)
    // and then could optionally use an LLM to rank or filter them.
    const { firestore } = initializeFirebase();
    const usersCollection = collection(firestore, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const users: UserProfile[] = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));

    const usersWithLocation = users.filter(user => user.location);
    
    // Sort users by proximity to the input location (Euclidean distance).
    usersWithLocation.sort((a, b) => {
      const distanceA = getDistance(
        a.location!.latitude,
        a.location!.longitude,
        input.latitude,
        input.longitude
      );
      const distanceB = getDistance(
        b.location!.latitude,
        b.location!.longitude,
        input.latitude,
        input.longitude
      );
      return distanceA - distanceB;
    });

    return usersWithLocation;
  }
);
