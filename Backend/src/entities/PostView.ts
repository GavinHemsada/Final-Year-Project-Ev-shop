import { Schema, model, Document, Types } from 'mongoose';

/**
 * Represents a post view record in the database.
 * Tracks which users have viewed which posts on which dates.
 * This prevents duplicate view counts from the same user on the same day.
 */
export interface IPostView extends Document {
  /** The unique identifier for the view record. */
  _id: Types.ObjectId;
  /** The ID of the `Post` that was viewed. */
  post_id: Types.ObjectId;
  /** The ID of the `User` who viewed the post. */
  user_id: Types.ObjectId;
  /** The date when the post was viewed (stored as YYYY-MM-DD format). */
  view_date: string;
}

/**
 * Mongoose schema for the PostView collection.
 */
const PostViewSchema = new Schema<IPostView>({
  /** A reference to the `Post` that was viewed. */
  post_id: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  /** A reference to the `User` who viewed the post. */
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  /** The date when the post was viewed (YYYY-MM-DD format). */
  view_date: { type: String, required: true },
}, { timestamps: true });

/**
 * Creates a unique compound index on post_id, user_id, and view_date.
 * This ensures that a user can only have one view record per post per day.
 */
PostViewSchema.index({ post_id: 1, user_id: 1, view_date: 1 }, { unique: true });

/**
 * Creates an index on post_id for quick lookups of all views for a post.
 */
PostViewSchema.index({ post_id: 1 });

/**
 * Creates an index on user_id for quick lookups of all posts viewed by a user.
 */
PostViewSchema.index({ user_id: 1 });

/**
 * The Mongoose model for the PostView collection.
 */
export const PostView = model<IPostView>('PostView', PostViewSchema);

