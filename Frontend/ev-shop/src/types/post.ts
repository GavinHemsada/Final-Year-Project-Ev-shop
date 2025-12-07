export interface Post {
  _id: string;

  user_id: {
    _id: string;
    name: string;
    profile_image?: string;
    role?: string[];
    seller?: {
      business_name?: string;
      shop_logo?: string;
    };
  };

  seller_id?: {
    _id: string;
    business_name?: string;
    shop_logo?: string;
  } | null;

  financial_id?: {
    _id: string;
    name: string;
  } | null;

  title: string;
  content: string;
  views: number;
  reply_count: number;

  last_reply_by?: {
    _id: string;
    name: string;
    profile_image?: string;
  };

  createdAt: string;
  updatedAt: string;
}


export interface PostReply {
  _id: string;

  user_id?: {
    _id: string;
    name: string;
    profile_image?: string;
  } | null;

  seller_id?: {
    _id: string;
    business_name: string;
    shop_logo?: string;
  } | null;

  financial_id?: {
    _id: string;
    name: string;
  } | null;

  post_id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
