import { Types } from "mongoose";
import { IPost, Post } from "../../entities/Post";
import { IPostReply, PostReply } from "../../entities/PostReply";
import { PostDTO, PostReplyDTO } from "../../dtos/post.DTO";
import { withErrorHandling } from "../../shared/utils/CustomException";
import { PostView } from "../../entities/PostView";

/**
 * Defines the contract for the post repository, specifying the methods for data access operations
 * related to forum posts and their replies.
 */
export interface IPostRepository {
  // Post methods

  /** @deprecated Use findPostById instead. */
  findbyid: (id: string) => Promise<IPost | null>;
  /**
   * Finds a single post by its unique ID, including its replies.
   * @param id - The ID of the post to find.
   * @returns A promise that resolves to the post document (with replies) or null if not found.
   */
  findPostById(id: string): Promise<IPost | null>;
  /**
   * Retrieves all posts, including their replies, sorted by creation date.
   * @returns A promise that resolves to an array of post documents or null.
   */
  findAllPosts(): Promise<IPost[] | null>;
  /**
   * Finds all posts created by a specific user, including their replies.
   * @param user_id - The ID of the user.
   * @returns A promise that resolves to an array of post documents or null.
   */
  findPostsByUserId(user_id: string): Promise<IPost[] | null>;
  /**
   * Finds all posts created by a specific seller, including their replies.
   * @param seller_id - The ID of the seller.
   * @returns A promise that resolves to an array of post documents or null.
   */
  findPostsBySellerId(seller_id: string): Promise<IPost[] | null>;
  /**
   * Finds all posts created by a specific financial user, including their replies.
   * @param financial_id - The ID of the financial user.
   * @returns A promise that resolves to an array of post documents or null.
   */
  findPostsByFinancialId(financial_id: string): Promise<IPost[] | null>;
  /**
   * Creates a new forum post.
   * @param data - The DTO containing the details for the new post.
   * @returns A promise that resolves to the created post document or null.
   */
  createPost(data: PostDTO): Promise<IPost | null>;
  /**
   * Updates an existing forum post.
   * @param id - The ID of the post to update.
   * @param data - The partial DTO containing the fields to update.
   * @returns A promise that resolves to the updated post document or null.
   */
  updatePost(id: string, data: Partial<PostDTO>): Promise<IPost | null>;
  /**
   * Checks if a user has already viewed a post today.
   * @param post_id - The ID of the post.
   * @param user_id - The ID of the user.
   * @param view_date - The date in YYYY-MM-DD format.
   * @returns A promise that resolves to true if the view exists, false otherwise.
   */
  hasUserViewedPostToday(
    post_id: string,
    view_date: string,
    user_id?: string,
    seller_id?: string,
    financial_id?: string
  ): Promise<boolean | null>;
  /**
   * Records a view for a post by a user on a specific date.
   * @param post_id - The ID of the post.
   * @param user_id - The ID of the user.
   * @param view_date - The date in YYYY-MM-DD format.
   * @returns A promise that resolves to the created view record or null.
   */
  createPostView(
    post_id: string,
    user_id: string,
    view_date: string
  ): Promise<any>;
  /**
   * Atomically increments the view count for a post by 1.
   * Only increments if the user hasn't viewed the post today.
   * @param id - The ID of the post to update.
   * @param user_id - Optional ID of the user viewing the post.
   * @param seller_id - Optional ID of the seller viewing the post.
   * @param financial_id - Optional ID of the financial user viewing the post.
   * @returns A promise that resolves to the updated post document or null, or false if already viewed today.
   */
  updatePostViews(
    id: string,
    user_id?: string,
    seller_id?: string,
    financial_id?: string
  ): Promise<IPost | null | false>;
  /**
   * Updates the reply count for a post.
   * @param id - The ID of the post to update.
   * @param reply_count - The new reply count.
   * @returns A promise that resolves to the updated post document or null.
   */
  updatePostReplyCount(id: string, reply_count: number): Promise<IPost | null>;
  /**
   * Updates the 'last replied by' user for a post.
   * @param id - The ID of the post to update.
   * @param last_reply_by - The ID of the user who made the last reply.
   * @returns A promise that resolves to the updated post document or null.
   */
  updatePostLastReplyBy(
    id: string,
    last_reply_by: string
  ): Promise<IPost | null>;
  /**
   * Deletes a post by its unique ID.
   * @param id - The ID of the post to delete.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  deletePost(id: string): Promise<boolean | null>;

  // Reply methods
  /**
   * Finds a single reply by its unique ID.
   * @param id - The ID of the reply to find.
   * @returns A promise that resolves to the reply document or null if not found.
   */
  findReplyById(id: string): Promise<IPostReply | null>;
  /**
   * Finds all replies for a specific post.
   * @param post_id - The ID of the parent post.
   * @returns A promise that resolves to an array of reply documents or null.
   */
  findRepliesByPostId(post_id: string): Promise<IPostReply[] | null>;
  /**
   * Finds all replies created by a specific user.
   * @param user_id - The ID of the user.
   * @returns A promise that resolves to an array of reply documents or null.
   */
  findRepliesByUserId(user_id: string): Promise<IPostReply[] | null>;
  /**
   * Finds all replies created by a specific seller.
   * @param seller_id - The ID of the seller.
   * @returns A promise that resolves to an array of reply documents or null.
   */
  findRepliesBySellerId(seller_id: string): Promise<IPostReply[] | null>;
  /**
   * Finds all replies created by a specific financial user.
   * @param financial_id - The ID of the financial user.
   * @returns A promise that resolves to an array of reply documents or null.
   */
  findRepliesByFinancialId(financial_id: string): Promise<IPostReply[] | null>;
  /**
   * Retrieves all replies from the database.
   * @returns A promise that resolves to an array of all reply documents or null.
   */
  findAllReplies(): Promise<IPostReply[] | null>;
  /**
   * Creates a new reply for a post.
   * @param data - The DTO containing the details for the new reply.
   * @returns A promise that resolves to the created reply document or null.
   */
  createReply(data: PostReplyDTO): Promise<IPostReply | null>;
  /**
   * Updates an existing reply.
   * @param id - The ID of the reply to update.
   * @param data - The partial DTO containing the fields to update.
   * @returns A promise that resolves to the updated reply document or null.
   */
  updateReply(
    id: string,
    data: Partial<PostReplyDTO>
  ): Promise<IPostReply | null>;
  /**
   * Deletes a reply by its unique ID.
   * @param id - The ID of the reply to delete.
   * @returns A promise that resolves to true if deletion was successful, otherwise false.
   */
  deleteReply(id: string): Promise<boolean | null>;
}

/**
 * The concrete implementation of the IPostRepository interface.
 * Each method is wrapped with a higher-order function `withErrorHandling` to ensure
 * consistent error management across the repository.
 */
export const PostRepository: IPostRepository = {
  // Posts
  /** @deprecated Use findPostById instead. */
  findbyid: withErrorHandling(async (id: string) => {
    return await Post.findById(id);
  }),
  /** Finds a single post by ID and uses replies and seller info. */
  findPostById: withErrorHandling(async (id: string) => {
    const objectId = new Types.ObjectId(id);

    const result = await Post.aggregate([
      { $match: { _id: objectId } },

      // --- Populate user_id ---
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user_id",
          pipeline: [{ $project: { name: 1, profile_image: 1 } }],
        },
      },
      { $unwind: "$user_id" },

      // --- Populate seller_id ---
      {
        $lookup: {
          from: "sellers",
          localField: "seller_id",
          foreignField: "_id",
          as: "seller_id",
          pipeline: [{ $project: { business_name: 1, shop_logo: 1 } }],
        },
      },
      { $unwind: { path: "$seller_id", preserveNullAndEmptyArrays: true } },

      // --- Populate financial_id ---
      {
        $lookup: {
          from: "financialinstitutions",
          localField: "financial_id",
          foreignField: "_id",
          as: "financial_id",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: { path: "$financial_id", preserveNullAndEmptyArrays: true } },

      // --- Load all replies for this post (JOIN PostReply → replies[] ) ---
      {
        $lookup: {
          from: "postreplies",
          localField: "_id",
          foreignField: "post_id",
          as: "replies",

          pipeline: [
            // Populate reply.user_id
            {
              $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user_id",
                pipeline: [{ $project: { name: 1, profile_image: 1 } }],
              },
            },
            { $unwind: { path: "$user_id", preserveNullAndEmptyArrays: true } },

            // Populate reply.seller_id
            {
              $lookup: {
                from: "sellers",
                localField: "seller_id",
                foreignField: "_id",
                as: "seller_id",
                pipeline: [{ $project: { business_name: 1, shop_logo: 1 } }],
              },
            },
            {
              $unwind: { path: "$seller_id", preserveNullAndEmptyArrays: true },
            },

            // Populate reply.financial_id
            {
              $lookup: {
                from: "financialinstitutions",
                localField: "financial_id",
                foreignField: "_id",
                as: "financial_id",
                pipeline: [{ $project: { name: 1 } }],
              },
            },
            {
              $unwind: {
                path: "$financial_id",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
        },
      },
    ]);

    return result?.[0] ?? null;
  }),

  /** Retrieves all posts, sorted by creation date, and populates author details with seller info. */
  findAllPosts: withErrorHandling(async () => {
    return await Post.find()
      .sort({ createdAt: -1 })
      .populate("user_id", "name profile_image")
      .populate("seller_id", "business_name shop_logo")
      .populate("financial_id", "name")
      .populate("last_reply_by", "name profile_image");
  }),
  /** Retrieves all posts by a specific user, sorted by creation date, and populates author details with seller info. */
  findPostsByUserId: withErrorHandling(async (user_id: string) => {
    return await Post.find({ user_id: new Types.ObjectId(user_id) })
      .sort({ createdAt: -1 })
      .populate("user_id", "name profile_image role")
      .populate("last_reply_by", "name profile_image");
  }),
  /** Retrieves all posts by a specific seller, sorted by creation date, and populates author details. */
  findPostsBySellerId: withErrorHandling(async (seller_id: string) => {
    return await Post.find({ seller_id: new Types.ObjectId(seller_id) })
      .sort({ createdAt: -1 })
      .populate("seller_id", "business_name shop_logo")
      .populate("last_reply_by", "name profile_image");
  }),
  /** Retrieves all posts by a specific financial user, sorted by creation date, and populates author details. */
  findPostsByFinancialId: withErrorHandling(async (financial_id: string) => {
    return await Post.find({ financial_id: new Types.ObjectId(financial_id) })
      .sort({ createdAt: -1 })
      .populate("financial_id", "name")
      .populate("last_reply_by", "name profile_image");
  }),
  /** Creates a new Post document. */
  createPost: withErrorHandling(async (data: PostDTO) => {
    return await Post.create(data);
  }),
  /** Finds a post by ID and updates it with new data. */
  updatePost: withErrorHandling(async (id: string, data: Partial<PostDTO>) => {
    return await Post.findByIdAndUpdate(id, data, { new: true });
  }),
  /** Checks if a user has already viewed a post today. */
  hasUserViewedPostToday: withErrorHandling(
    async (
      post_id: string,
      view_date: string,
      user_id?: string,
      seller_id?: string,
      financial_id?: string
    ): Promise<boolean | null> => {
      const query: any = { post_id, view_date };

      if (user_id) query.user_id = user_id;
      if (seller_id) query.seller_id = seller_id;
      if (financial_id) query.financial_id = financial_id;

      const view = await PostView.findOne(query);

      return view !== null;
    }
  ),

  /** Records a view for a post by a user on a specific date. */
  createPostView: withErrorHandling(
    async (
      post_id: string,
      view_date: string,
      user_id?: string,
      seller_id?: string,
      financial_id?: string
    ) => {
      try {
        const query: any = { post_id, view_date };
        if (user_id) query.user_id = user_id;
        if (seller_id) query.seller_id = seller_id;
        if (financial_id) query.financial_id = financial_id;
        return await PostView.create(query);
      } catch (error: any) {
        // If duplicate key error (unique index violation), return null
        if (error.code === 11000) {
          return null;
        }
        throw error;
      }
    }
  ),

  /** Finds a post by ID and atomically increments its view count if user hasn't viewed today. */
  updatePostViews: withErrorHandling(
    async (
      id: string,
      user_id?: string,
      seller_id?: string,
      financial_id?: string
    ) => {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];
      const query: any = { post_id: id, view_date: today };
      if (user_id) query.user_id = user_id;
      if (seller_id) query.seller_id = seller_id;
      if (financial_id) query.financial_id = financial_id;
      // Check if user has already viewed this post today
      const hasViewed = await PostView.findOne(query);
      if (hasViewed) {
        // User has already viewed today, don't increment
        return false;
      }

      // Create the view record first (this will fail if duplicate due to unique index)
      try {
        await PostView.create(query);
      } catch (error: any) {
        // If duplicate key error, another request already created it, so don't increment
        if (error.code === 11000) {
          return false;
        }
        throw error;
      }

      // If view record was created successfully, increment the post's view count
      return await Post.findByIdAndUpdate(
        id,
        { $inc: { views: 1 } },
        { new: true }
      );
    }
  ),
  /** Finds a post by ID and updates its reply count. */
  updatePostReplyCount: withErrorHandling(
    async (id: string, reply_count: number) => {
      return await Post.findByIdAndUpdate(id, { reply_count }, { new: true });
    }
  ),
  /** Finds a post by ID and updates the user who made the last reply. */
  updatePostLastReplyBy: withErrorHandling(
    async (id: string, last_reply_by: string) => {
      return await Post.findByIdAndUpdate(id, { last_reply_by }, { new: true });
    }
  ),
  /** Deletes a post by its document ID. */
  deletePost: withErrorHandling(async (id: string) => {
    const objectId = new Types.ObjectId(id);
    // Concurrently delete the post, its replies, and its views
    const [deletePostResult] = await Promise.all([
      Post.findByIdAndDelete(objectId),
      PostReply.deleteMany({ post_id: objectId }),
      PostView.deleteMany({ post_id: objectId }),
    ]);
    return deletePostResult !== null;
  }),

  // Replies
  /** Finds a single reply by its document ID and populates the author's details. */
  findReplyById: withErrorHandling(async (id: string) => {
    return await PostReply.findById(id)
      .populate("user_id", "name profile_image")
      .populate("seller_id", "business_name shop_logo")
      .populate("financial_id", "name");
  }),
  /** Finds all replies for a specific post, sorted by creation date, and populates author details. */
  findRepliesByPostId: withErrorHandling(async (post_id: string) => {
    return await PostReply.find({ post_id })
      .sort({ createdAt: -1 })
      .populate("user_id", "name profile_image")
      .populate("seller_id", "business_name shop_logo")
      .populate("financial_id", "name");
  }),
  /** Finds all replies by a specific user, sorted by creation date. */
  findRepliesByUserId: withErrorHandling(async (user_id: string) => {
    return await PostReply.find({ user_id }).sort({ createdAt: -1 });
  }),
  /** Finds all replies by a specific seller, sorted by creation date. */
  findRepliesBySellerId: withErrorHandling(async (seller_id: string) => {
    return await PostReply.find({ seller_id }).sort({ createdAt: -1 });
  }),
  /** Finds all replies by a specific financial user, sorted by creation date. */
  findRepliesByFinancialId: withErrorHandling(async (financial_id: string) => {
    return await PostReply.find({ financial_id }).sort({ createdAt: -1 });
  }),
  /** Retrieves all replies across all posts, sorted by creation date. */
  findAllReplies: withErrorHandling(async () => {
    return await PostReply.find()
      .sort({ createdAt: -1 })
      .populate("user_id", "name profile_image")
      .populate("seller_id", "business_name shop_logo")
      .populate("financial_id", "name");
  }),
  /** Creates a new PostReply document. */
  createReply: withErrorHandling(async (data: PostReplyDTO) => {
    return await PostReply.create(data);
  }),
  /** Finds a reply by ID and updates it with new data. */
  updateReply: withErrorHandling(
    async (id: string, data: Partial<PostReplyDTO>) => {
      return await PostReply.findByIdAndUpdate(id, data, { new: true });
    }
  ),
  /** Deletes a reply by its document ID. */
  deleteReply: withErrorHandling(async (id: string) => {
    const result = await PostReply.findByIdAndDelete(id);
    return result !== null;
  }),
};
