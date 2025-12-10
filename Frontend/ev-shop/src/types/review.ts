export type Review = {
  _id: string;
  reviewer_id: string;
  listing_id: {
    _id: string;
    listing_title: string;
    vehicle_images: string[];
  };
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
};
