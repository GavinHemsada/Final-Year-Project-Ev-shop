export type Review = {
  _id: string;

  reviewer_id: {
    _id: string;
    name: string;
    profile_image?: string;
  };

  target_type: string;

  target_id: {
    _id: string;
    business_name?: string;
    shop_logo?: string;
  };

  order_id: {
    _id: string;
    listing_id: {
      _id: string;
      model_id: {
        _id: string;
        model_name: string;
      };
    };
  };

  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
  updated_at?: string;
};
