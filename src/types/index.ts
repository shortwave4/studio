

export type UserProfile = {
    id: string; 
    userId: string;
    name: string;
    email: string;
    bio?: string;
    location?: {
        latitude: number;
        longitude: number;
    } | null;
};

export type AffiliateProduct = {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    affiliateLink: string;
    adminId: string;
};

