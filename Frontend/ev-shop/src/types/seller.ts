export type Seller = {
  user_id: string;
  business_name: string;
  license_number: string;
  description: string;
  website: string;
  shop_logo: string;
  rating: number;
  total_reviews: number;
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
}