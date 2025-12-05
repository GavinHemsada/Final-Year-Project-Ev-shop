import { ListingType, VehicleCondition, ListingStatus } from "@/types/enum";

export type Listing = {
  _id: string;
  name: string;
  model: string;
  price: string;
  status: ListingStatus;
  condition: VehicleCondition;
  listing_type: ListingType;
  battery_health: string;
  registration_year: string;
  number_of_ev: string;
  color: string;
  images: string[];
};

export type Vehicle = {
  _id: string;
  listing_type: string; 
  condition: string; 
  status: string; 
  color: string;
  price: number;
  number_of_ev: number;
  registration_year: number;
  battery_health: number;
  specifications: string[];
  features: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;

  // Nested references
  seller_id: {
    _id: string;
    business_name: string;
    user_id?: {
      _id: string;
      profile_image?: string;
      name?: string;
    };
    shop_logo?: string;
  };

  model_id: {
    _id: string;
    model_name: string;
    year: number;
    range_km: number;
    price_range: string;
    battery_capacity_kwh: number;
    charging_time_hours: number;
    motor_type: string;
    seating_capacity: number;

    // Populated references
    brand_id: {
      _id: string;
      brand_name: string;
      brand_logo: string;
      description: string;
      createdAt: string;
      updatedAt: string;
    };
    category_id: {
      _id: string;
      category_name: string;
      description: string;
      createdAt: string;
      updatedAt: string;
    };
  };
};


export interface Brand {
  id: string;
  name: string;
  description: string;
}

export interface categorie {
  id: string;
  name: string;
  description: string;
}

export interface EvListingFormData {
  // Step 1
  brand_id: string;
  category_id: string;

  // Step 2
  model_name: string;
  year: number | string;
  battery_capacity_kwh: number | string;
  range_km: number | string;
  charging_time_hours: number | string;
  motor_type: string;
  seating_capacity: number | string;
  price_range: string;
  specifications: string[];
  features: string[];

  // Step 3
  listing_type: ListingType | "";
  condition: VehicleCondition | "";
  price: number | string;
  battery_health: number | string;
  color: string;
  registration_year: string;
  number_of_ev: number | string;

  // Step 4
  images: File[];
}