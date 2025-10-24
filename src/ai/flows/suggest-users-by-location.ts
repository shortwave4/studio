'use server';
/**
 * @fileOverview Provides location-based chat suggestions.
 *
 * - suggestUsersByLocation - An async function that returns suggested users based on the user's location.
 * - SuggestUsersByLocationInput - The input type for the suggestUsersByLocation function, including latitude and longitude.
 * - SuggestUsersByLocationOutput - The output type for the suggestUsersByLocation function, a list of user profiles.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

const SuggestUsersByLocationOutputSchema = z.array(UserProfileSchema).describe('A list of suggested user profiles, ordered by proximity.');
export type SuggestUsersByLocationOutput = z.infer<
  typeof SuggestUsersByLocationOutputSchema
>;

export async function suggestUsersByLocation(
  input: SuggestUsersByLocationInput
): Promise<SuggestUsersByLocationOutput> {
  return suggestUsersByLocationFlow(input);
}

const suggestUsersByLocationPrompt = ai.definePrompt({
  name: 'suggestUsersByLocationPrompt',
  input: {schema: SuggestUsersByLocationInputSchema},
  output: {schema: SuggestUsersByLocationOutputSchema},
  prompt: `You are a location-based social networking expert.  Given the current user's location, suggest other users nearby who might be good matches for chatting.

Current user location: Latitude: {{latitude}}, Longitude: {{longitude}}

Return a JSON array of user profiles, ordered by proximity to the current user.  Include each user's userId, name, and bio.
`,
});

const suggestUsersByLocationFlow = ai.defineFlow(
  {
    name: 'suggestUsersByLocationFlow',
    inputSchema: SuggestUsersByLocationInputSchema,
    outputSchema: SuggestUsersByLocationOutputSchema,
  },
  async input => {
    // TODO: Implement retrieval of users from the database, ordered by proximity.
    // This is a placeholder implementation.
    const mockUsers: SuggestUsersByLocationOutput = [
      {
        userId: 'user1',
        name: 'Alice',
        bio: 'Loves hiking and photography.',
        location: {latitude: input.latitude + 0.01, longitude: input.longitude + 0.01},
      },
      {
        userId: 'user2',
        name: 'Bob',
        bio: 'Interested in coding and gaming.',
        location: {latitude: input.latitude - 0.02, longitude: input.longitude - 0.02},
      },
    ];

    // Sort the mock users by proximity to the input location.
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

    //const {output} = await suggestUsersByLocationPrompt(input);
    //return output!;

    return mockUsers;
  }
);
