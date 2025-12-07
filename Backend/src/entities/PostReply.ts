import { Schema, model, Document, Types } from 'mongoose';

/**
 * Represents a reply to a forum post in the database.
 */
export interface IPostReply extends Document {
  /** The unique identifier for the reply document. */
  _id: Types.ObjectId;
  /** The ID of the `User` who created the reply. */
  user_id: Types.ObjectId;
  /** The ID of the `User` who is selling an item in the post. */
  seller_id: Types.ObjectId;
  /** The ID of the `Financial` entity related to the post. */
  financial_id: Types.ObjectId;
  /** The ID of the `Post` this reply belongs to. */
  post_id: Types.ObjectId;
  /** The text content of the reply. */
  content: string;
}

/**
 * Mongoose schema for the PostReply collection.
 */
const PostReplySchema = new Schema<IPostReply>({
  /** A reference to the `User` who created the post. */
  user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  /** A reference to the `User` who is selling an item in the post. */
  seller_id: { type: Schema.Types.ObjectId, ref: 'Seller' },
  /** A reference to the related `Financial` entity. */
  financial_id: { type: Schema.Types.ObjectId, ref: 'FinancialInstitution' },
  /** A reference to the parent `Post` document. */
  post_id: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  /** The text content of the reply, which is required. */
  content: { type: String, required: true },
}, { timestamps: true });

/**
 * Creates indexes on key fields to optimize common query performance.
 * - `post_id`: To quickly find all replies for a specific post.
 * - `user_id`: To quickly find all replies made by a specific user.
 */
PostReplySchema.index({ post_id: 1 });
PostReplySchema.index({ user_id: 1 });

/**
 * The Mongoose model for the PostReply collection.
 */
export const PostReply = model<IPostReply>('PostReply', PostReplySchema);
