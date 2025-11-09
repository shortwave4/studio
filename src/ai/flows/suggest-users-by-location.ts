
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
  userId: z.string().describe('The unique identifier of the user.'),
  name: z.string().describe('The name of the user.'),
  bio: z.string().describe('A short biography of the user.'),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional()
    .describe('The last known location of the user.'),
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
    // For now, we'll use a simple mock implementation.

    const mockUsers: SuggestUsersByLocationOutput = [
      {
        userId: 'user1',
        name: 'Alice',
        bio: 'Loves hiking and photography.',
        location: {
          latitude: input.latitude + 0.01,
          longitude: input.longitude + 0.01,
        },
      },
      {
        userId: 'user2',
        name: 'Bob',
        bio: 'Interested in coding and gaming.',
        location: {
          latitude: input.latitude - 0.02,
          longitude: input.longitude - 0.02,
        },
      },
      {
        userId: 'user3',
        name: 'Charlie',
        bio: 'Foodie and world traveler.',
        location: {
          latitude: input.latitude + 0.05,
          longitude: input.longitude - 0.03,
        },
      },
      {
        userId: 'user4',
        name: 'Diana',
        bio: 'Musician and artist.',
        location: {
          latitude: input.latitude - 0.03,
          longitude: input.longitude + 0.04,
        },
      },
    ];

    // Sort users by proximity to the input location (Euclidean distance).
    mockUsers.sort((a, b) => {
      const distanceA = Math.sqrt(
        Math.pow(a.location!.latitude - input.latitude, 2) +
          Math.pow(a.location!.longitude - input.longitude, 2)
      );
      const distanceB = Math.sqrt(
        Math.pow(b.location!.latitude - input.latitude, 2) +
          Math.pow(b.location!.longitude - input.longitude, 2)
      );
      return distanceA - distanceB;
    });

    return mockUsers;
  }
);
