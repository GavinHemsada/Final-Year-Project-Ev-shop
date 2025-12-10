export type Seller = {
  user_id: string;
  business_name: string;
  license_number: string;
  description: string;
  website: string;
  shop_logo: string;
  rating: number;
  total_reviews: number;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

export interface SellerProfile {
  _id: string;
  user_id: {
    _id: string;
    name?: string;
    email?: string;
    profile_image?: string;
  };
  business_name?: string;
  license_number?: string;
  description?: string;
  website?: string;
  shop_logo?: string;
  rating?: number;
  total_reviews: number;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}