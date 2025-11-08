
import type { SuggestUsersByLocationOutput } from '@/ai/flows/suggest-users-by-location';

// This extracts the type of a single user from the array type returned by the flow.
export type UserProfile = SuggestUsersByLocationOutput[0] & {
    id?: string; // id is optional now
};
