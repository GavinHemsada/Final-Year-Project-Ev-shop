export type Order = {
  _id: string;
  order_date: string;
  order_status: "Delivered" | "Processing" | "Cancelled" | "pending" | "confirmed";
  total_amount: number;
  listing_id?: {
    price: number;
    color?: string;
    registration_year?: number;
    model_id?: {
      model_name: string;
    };
  };
  seller_id?: {
    street_address?: string;
    business_name?: string;
  };
  items?: Array<{
    listing_id: {
      listing_title: string;
    }
  }>;
  // Legacy fields for compatibility if needed (optional)
  id?: string;
  date?: string;
  vehicle?: string;
  status?: string;
  total?: string;
};