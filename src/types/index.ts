
export type UserProfile = {
    id: string; 
    userId: string;
    name: string;
    email: string;
    bio?: string;
    location?: {
        latitude: number;
        longitude: number;
    }
};
