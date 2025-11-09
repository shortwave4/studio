
import type { GeoPoint } from 'firebase/firestore';

export type UserProfile = {
    id: string; 
    userId?: string;
    name: string;
    email: string;
    bio?: string;
    location?: GeoPoint | null;
    g?: string | null; // geohash for location
};

export type AffiliateProduct = {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    affiliateLink: string;
    adminId: string;
};

