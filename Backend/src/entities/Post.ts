import { Schema, model, Document, Types } from 'mongoose';

/**
 * Represents a forum post in the database.
 * This is the main entity for the community discussion feature.
 */
export interface IPost extends Document {
  /** The unique identifier for the post document. */
  _id: Types.ObjectId;
  /** The ID of the `User` who created the post. */
  user_id: Types.ObjectId;
  /** The ID of the `User` who is selling an item in the post. */
  seller_id: Types.ObjectId;
  /** The ID of the `Financial` entity related to the post. */
  financial_id: Types.ObjectId;
  /** The title of the post. */
  title: string;
  /** The main content/body of the post. */
  content: string;
  /** The number of times the post has been viewed. */
  views: number;
  /** The number of replies the post has received. */
  reply_count: number;
  /** The ID of the `User` who made the most recent reply. This field is optional. */
  last_reply_by?: Types.ObjectId;
}

/**
 * Mongoose schema for the Post collection.
 */
const PostSchema = new Schema<IPost>({
  /** A reference to the `User` who created the post. */
  user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  /** A reference to the `User` who is selling an item in the post. */
  seller_id: { type: Schema.Types.ObjectId, ref: 'Seller' },
  /** A reference to the related `Financial` entity. */
  financial_id: { type: Schema.Types.ObjectId, ref: 'FinancialInstitution' },
  /** The title of the post, which is required. */
  title: { type: String, required: true },  
  /** The main content of the post, which is required. */
  content: { type: String, required: true },
  /** The view count, which defaults to 0. */
  views: { type: Number, default: 0 },
  /** The reply count, which defaults to 0. */
  reply_count: { type: Number, default: 0 },
  /** An optional reference to the `User` who last replied. */
  last_reply_by: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

/**
 * Creates indexes on key fields to optimize common query performance.
 * - `user_id`: To quickly find all posts by a specific user.
 * - `title`: To enable text searching on post titles.
 */
PostSchema.index({ user_id: 1 });
PostSchema.index({ title: 'text', content: 'text' });

/**
 * The Mongoose model for the Post collection.
 */
export const Post = model<IPost>('Post', PostSchema);
