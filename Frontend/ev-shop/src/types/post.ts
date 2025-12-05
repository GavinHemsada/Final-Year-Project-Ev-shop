export interface Post {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    profile_image?: string;
  };
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
  user_id: {
    _id: string;
    name: string;
    profile_image?: string;
  };
  post_id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}