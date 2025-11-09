
export type UserProfile = {
    id: string; 
    name: string;
    email: string;
    bio?: string;
    location?: {
        latitude: number;
        longitude: number;
    }
};
