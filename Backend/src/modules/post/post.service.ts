import { IPostRepository } from "./post.repository";
import { PostDTO, PostReplyDTO } from "../../dtos/post.DTO";
import { IUserRepository } from "../user/user.repository";
import CacheService from "../../shared/cache/CacheService";
import { ISellerRepository } from "../seller/seller.repository";
import { IFinancialRepository } from "../financial/financial.repository";

/**
 * Defines the interface for the post service, outlining methods for managing forum posts and replies.
 */
export interface IPostService {
  /**
   * Finds a single post by its unique ID.
   * @param id - The ID of the post to find.
   * @returns A promise that resolves to an object containing the post data or an error.
   */
  findPostById(
    id: string
  ): Promise<{ success: boolean; post?: any; error?: string }>;
  /**
   * Retrieves all posts with pagination, filtering, and search.
   *
   * @param {Object} options
   * @param {number} [options.page=1] - Current page number.
   * @param {number} [options.limit=10] - Number of posts per page.
   * @param {string} [options.search=""] - Search term for post title/content.
   * @param {string} [options.filter=""] - Optional filter (e.g. category, status).
   */
  findAllPosts(options?: {
    page?: number;
    limit?: number;
    search?: string;
    filter?: string;
  }): Promise<{
    success: boolean;
    posts?: any[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    error?: string;
  }>;
  /**
   * Finds all posts created by a specific user.
   * @param user_id - The ID of the user.
   * @returns A promise that resolves to an object containing an array of the user's posts or an error.
   */
  findPostsByUserId(
    user_id: string
  ): Promise<{ success: boolean; posts?: any[]; error?: string }>;
  /**
   * Finds all posts created by a specific seller.
   * @param seller_id - The ID of the seller.
   * @returns A promise that resolves to an object containing an array of the seller's posts or an error.
   */
  findPostsBySellerId(
    seller_id: string
  ): Promise<{ success: boolean; posts?: any[]; error?: string }>;
  /**
   * Finds all posts created by a specific financial user.
   * @param financial_id - The ID of the financial user.
   * @returns A promise that resolves to an object containing an array of the financial user's posts or an error.
   */
  findPostsByFinancialId(
    financial_id: string
  ): Promise<{ success: boolean; posts?: any[]; error?: string }>;
  /**
   * Creates a new post.
   * @param user_id - The ID of the user creating the post.
   * @param postData - The data for the new post.
   * @returns A promise that resolves to an object containing the created post or an error.
   */
  createPost(
    user_id: string | null,
    seller_id: string | null,
    financial_id: string | null,
    postData: PostDTO
  ): Promise<{ success: boolean; post?: any; error?: string }>;
  /**
   * Updates an existing post.
   * @param id - The ID of the post to update.
   * @param postData - The partial data to update the post with.
   * @returns A promise that resolves to an object containing the updated post data or an error.
   */
  updatePost(
    id: string,
    postData: Partial<PostDTO>
  ): Promise<{ success: boolean; post?: any; error?: string }>;
  /**
   * Atomically increments the view count for a specific post.
   * Only increments if the user hasn't viewed the post today.
   * @param id - The ID of the post.
   * @param user_id - The ID of the user viewing the post.
   * @param seller_id - Optional seller ID.
   * @param financial_id - Optional financial ID.
   * @returns A promise that resolves to an object containing the updated post data or an error.
   */
  updatePostViews(
    id: string,
    user_id?: string,
    seller_id?: string,
    financial_id?: string
  ): Promise<{
    success: boolean;
    post?: any;
    error?: string;
    alreadyViewed?: boolean;
  }>;
  /**
   * Updates the reply count for a specific post.
   * @param id - The ID of the post.
   * @param reply_count - The new reply count.
   * @returns A promise that resolves to an object containing the updated post data or an error.
   */
  updatePostReplyCount(
    id: string,
    reply_count: number
  ): Promise<{ success: boolean; post?: any; error?: string }>;
  /**
   * Updates the identifier for the user who made the last reply to a post.
   * @param id - The ID of the post.
   * @param last_reply_by - The ID of the user who made the last reply.
   * @returns A promise that resolves to an object containing the updated post data or an error.
   */
  updatePostLastReplyBy(
    id: string,
    last_reply_by: string
  ): Promise<{ success: boolean; post?: any; error?: string }>;
  /**
   * Deletes a post by its unique ID.
   * @param id - The ID of the post to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deletePost(id: string): Promise<{ success: boolean; error?: string }>;
  // Replies
  /**
   * Finds a single reply by its unique ID.
   * @param id - The ID of the reply to find.
   * @returns A promise that resolves to an object containing the reply data or an error.
   */
  findReplyById(
    id: string
  ): Promise<{ success: boolean; reply?: any; error?: string }>;
  /**
   * Finds all replies associated with a specific post.
   * @param post_id - The ID of the post.
   * @returns A promise that resolves to an object containing an array of replies or an error.
   */
  findRepliesByPostId(
    post_id: string
  ): Promise<{ success: boolean; replies?: any[]; error?: string }>;
  /**
   * Finds all replies created by a specific user.
   * @param user_id - The ID of the user.
   * @returns A promise that resolves to an object containing an array of the user's replies or an error.
   */
  findRepliesByUserId(
    user_id: string
  ): Promise<{ success: boolean; replies?: any[]; error?: string }>;
  /**
   * Finds all replies created by a specific seller.
   * @param seller_id - The ID of the seller.
   * @returns A promise that resolves to an object containing an array of the seller's replies or an error.
   */
  findRepliesBySellerId(
    seller_id: string
  ): Promise<{ success: boolean; replies?: any[]; error?: string }>;
  /**
   * Finds all replies created by a specific financial user.
   * @param financial_id - The ID of the financial user.
   * @returns A promise that resolves to an object containing an array of the financial user's replies or an error.
   */
  findRepliesByFinancialId(
    financial_id: string
  ): Promise<{ success: boolean; replies?: any[]; error?: string }>;
  /**
   * Retrieves all replies from the system.
   * @returns A promise that resolves to an object containing an array of all replies or an error.
   */
  findAllReplies(): Promise<{
    success: boolean;
    replies?: any[];
    error?: string;
  }>;
  /**
   * Creates a new reply to a post.
   * @param user_id - The ID of the user creating the reply.
   * @param replyData - The data for the new reply.
   * @returns A promise that resolves to an object containing the created reply or an error.
   */
  createReply(
    user_id: string,
    seller_id: string,
    financial_id: string,
    replyData: PostReplyDTO
  ): Promise<{ success: boolean; reply?: any; error?: string }>;
  /**
   * Updates an existing reply.
   * @param id - The ID of the reply to update.
   * @param replyData - The partial data to update the reply with.
   * @returns A promise that resolves to an object containing the updated reply data or an error.
   */
  updateReply(
    id: string,
    replyData: Partial<PostReplyDTO>
  ): Promise<{ success: boolean; reply?: any; error?: string }>;
  /**
   * Deletes a reply by its unique ID.
   * @param id - The ID of the reply to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  deleteReply(id: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Factory function to create an instance of the post service.
 * It encapsulates the business logic for managing forum posts and replies.
 *
 * @param postRepo - The repository for post and reply data access.
 * @param userRepo - The repository for user data access.
 * @returns An implementation of the IPostService interface.
 */
export function postService(
  postRepo: IPostRepository,
  userRepo: IUserRepository,
  sellerRepo: ISellerRepository,
  financialRepo: IFinancialRepository
): IPostService {
  return {
    // Posts
    /**
     * Finds a single post by its ID.
     */
    findPostById: async (id) => {
      try {
        const cacheKey = `post_${id}`;
        const post = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const postData = await postRepo.findPostById(id);
            return postData ?? null;
          },
          3600 // Cache for 1 hour
        );
        if (!post) return { success: false, error: "Post not found" };
        return { success: true, post };
      } catch (err) {
        return { success: false, error: "Failed to fetch post" };
      }
    },
    /**
     * Retrieves all posts.
     */
    findAllPosts: async ({
      page = 1,
      limit = 10,
      search = "",
      filter = "",
    } = {}) => {
      try {
        // Create a unique cache key for each query combination
        const cacheKey = `posts_${page}_${limit}_${search}_${filter}`;

        const result = await CacheService.getOrSet(
          cacheKey,
          async () => {
            // Fetch all posts from the database
            let allPosts = await postRepo.findAllPosts();
            if (!allPosts || allPosts.length === 0)
              return { posts: [], total: 0 };

            // --- Filtering ---
            if (filter) {
              const term = filter.toLowerCase();
              allPosts = allPosts.filter(
                (post) =>
                  post.title?.toLowerCase() === term ||
                  post.views?.toString() === term ||
                  post.reply_count?.toString() === term
              );
            }

            // --- Searching ---
            if (search) {
              const term = search.toLowerCase();
              allPosts = allPosts.filter(
                (post) =>
                  post.title?.toLowerCase().includes(term) ||
                  post.content?.toLowerCase().includes(term)
              );
            }

            // --- Pagination ---
            const total = allPosts.length;
            const startIndex = (page - 1) * limit;
            const paginatedPosts = allPosts.slice(
              startIndex,
              startIndex + limit
            );

            return {
              posts: paginatedPosts,
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
            };
          },
          3600 // Cache for 1 hour
        );

        if (!result.posts || result.posts.length === 0)
          return { success: false, error: "No posts found" };

        return { success: true, ...result };
      } catch (err) {
        return { success: false, error: "Failed to fetch posts" };
      }
    },

    /**
     * Finds all posts created by a specific user.
     */
    findPostsByUserId: async (user_id) => {
      try {
        const cacheKey = `posts_user_${user_id}`;
        const posts = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const userPosts = await postRepo.findPostsByUserId(user_id);
            return userPosts ?? [];
          },
          3600 // Cache for 1 hour
        );
        if (!posts)
          return { success: false, error: "No posts found for this user" };
        return { success: true, posts };
      } catch (err) {
        return { success: false, error: "Failed to fetch posts for this user" };
      }
    },
    /**
     * Finds all posts created by a specific seller.
     */
    findPostsBySellerId: async (seller_id) => {
      try {
        const cacheKey = `posts_seller_${seller_id}`;
        const posts = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const sellerPosts = await postRepo.findPostsBySellerId(seller_id);
            return sellerPosts ?? [];
          },
          3600 // Cache for 1 hour
        );
        if (!posts)
          return { success: false, error: "No posts found for this seller" };
        return { success: true, posts };
      } catch (err) {
        return {
          success: false,
          error: "Failed to fetch posts for this seller",
        };
      }
    },
    /**
     * Finds all posts created by a specific financial user.
     */
    findPostsByFinancialId: async (financial_id) => {
      try {
        const cacheKey = `posts_financial_${financial_id}`;
        const posts = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const financialPosts = await postRepo.findPostsByFinancialId(
              financial_id
            );
            return financialPosts ?? [];
          },
          3600 // Cache for 1 hour
        );
        if (!posts)
          return {
            success: false,
            error: "No posts found for this financial user",
          };
        return { success: true, posts };
      } catch (err) {
        return {
          success: false,
          error: "Failed to fetch posts for this financial user",
        };
      }
    },
    /**
     * Creates a new post after verifying the user exists.
     */
    createPost: async (user_id, seller_id, financial_id, postData) => {
      try {
        const checks = [
          { id: user_id, repo: userRepo, error: "User not found" },
          { id: seller_id, repo: sellerRepo, error: "Seller not found" },
          {
            id: financial_id,
            repo: financialRepo,
            error: "Financial user not found",
          },
        ];

        for (const item of checks) {
          if (item.id) {
            const exists = await item.repo.findById(item.id);
            if (!exists) return { success: false, error: item.error };
          }
        }
        const post = await postRepo.createPost({
          ...postData,
          user_id: user_id || undefined,
          seller_id: seller_id || undefined,
          financial_id: financial_id || undefined,
        });

        // Invalidate caches for all posts and the user's posts
        await Promise.all([
          CacheService.deletePattern("posts_*"),
          CacheService.delete(`posts_user_${user_id}`),
        ]);

        return { success: true, post };
      } catch (err) {
        return { success: false, error: "Failed to create post" };
      }
    },
    /**
     * Updates an existing post's data.
     */
    updatePost: async (id, postData) => {
      try {
        const post = await postRepo.updatePost(id, postData);
        if (!post) return { success: false, error: "Post not found" };

        // Invalidate all relevant post caches
        await Promise.all([
          CacheService.delete(`post_${id}`),
          CacheService.deletePattern("posts_*"),
          CacheService.delete(`posts_user_${post.user_id}`),
        ]);

        return { success: true, post };
      } catch (err) {
        return { success: false, error: "Failed to update post" };
      }
    },
    /**
     * Atomically increments the view count of a post.
     * Only increments if the user hasn't viewed the post today.
     */
    updatePostViews: async (id, user_id, seller_id, financial_id) => {
      try {
        const result = await postRepo.updatePostViews(
          id,
          user_id,
          seller_id,
          financial_id
        );

        // If result is false, user has already viewed today
        if (result === false) {
          return { success: true, alreadyViewed: true };
        }

        if (!result) return { success: false, error: "Post not found" };

        // Invalidate all relevant post caches
        await Promise.all([
          CacheService.delete(`post_${id}`),
          CacheService.deletePattern("posts_*"),
          CacheService.delete(`posts_user_${result.user_id}`),
        ]);
        return { success: true, post: result };
      } catch (err) {
        return { success: false, error: "Failed to update post views" };
      }
    },
    /**
     * Specifically updates the reply count of a post.
     */
    updatePostReplyCount: async (id, reply_count) => {
      try {
        const post = await postRepo.updatePostReplyCount(id, reply_count);
        if (!post) return { success: false, error: "Post not found" };
        // Invalidate all relevant post caches
        await Promise.all([
          CacheService.delete(`post_${id}`),
          CacheService.deletePattern("posts_*"),
          CacheService.delete(`posts_user_${post.user_id}`),
        ]);
        return { success: true, post };
      } catch (err) {
        return { success: false, error: "Failed to update reply count" };
      }
    },
    /**
     * Specifically updates the user who made the last reply to a post.
     */
    updatePostLastReplyBy: async (id, last_reply_by) => {
      try {
        const post = await postRepo.updatePostLastReplyBy(id, last_reply_by);
        if (!post) return { success: false, error: "Post not found" };
        // Invalidate all relevant post caches
        await Promise.all([
          CacheService.delete(`post_${id}`),
          CacheService.deletePattern("posts_*"),
          CacheService.delete(`posts_user_${post.user_id}`),
        ]);
        return { success: true, post };
      } catch (err) {
        return { success: false, error: "Failed to update last reply by" };
      }
    },
    /**
     * Deletes a post from the system.
     */
    deletePost: async (id) => {
      try {
        const existingPost = await postRepo.findbyid(id);
        if (!existingPost) return { success: false, error: "Post not found" };

        const success = await postRepo.deletePost(id);
        if (!success) return { success: false, error: "Post not Deleted" };

        // Invalidate all relevant post and reply caches
        const cacheDeletions = [
          CacheService.delete(`post_${id}`),
          CacheService.deletePattern("posts_*"),
          CacheService.delete(`replies_post_${id}`),
        ];

        // Invalidate user-specific caches if applicable
        if (existingPost.user_id) {
          const userId = existingPost.user_id.toString();
          cacheDeletions.push(CacheService.delete(`posts_user_${userId}`));
        }
        if (existingPost.seller_id) {
          const sellerId = existingPost.seller_id.toString();
          cacheDeletions.push(CacheService.delete(`posts_seller_${sellerId}`));
        }
        if (existingPost.financial_id) {
          const financialId = existingPost.financial_id.toString();
          cacheDeletions.push(CacheService.delete(`posts_financial_${financialId}`));
        }

        await Promise.all(cacheDeletions);

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete post" };
      }
    },

    // Replies
    /**
     * Finds a single reply by its ID.
     */
    findReplyById: async (id) => {
      try {
        const cacheKey = `reply_${id}`;
        const reply = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const replyData = await postRepo.findReplyById(id);
            return replyData ?? null;
          },
          3600 // Cache for 1 hour
        );
        if (!reply) return { success: false, error: "Reply not found" };
        return { success: true, reply };
      } catch (err) {
        return { success: false, error: "Failed to fetch reply" };
      }
    },
    /**
     * Finds all replies for a specific post.
     */
    findRepliesByPostId: async (post_id) => {
      try {
        const cacheKey = `replies_post_${post_id}`;
        const replies = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const postReplies = await postRepo.findRepliesByPostId(post_id);
            return postReplies ?? [];
          },
          3600 // Cache for 1 hour
        );
        if (!replies)
          return { success: false, error: "No replies found for this post" };
        return { success: true, replies };
      } catch (err) {
        return {
          success: false,
          error: "Failed to fetch replies for this post",
        };
      }
    },
    /**
     * Finds all replies created by a specific user.
     */
    findRepliesByUserId: async (user_id) => {
      try {
        const cacheKey = `replies_user_${user_id}`;
        const replies = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const userReplies = await postRepo.findRepliesByUserId(user_id);
            return userReplies ?? [];
          },
          3600 // Cache for 1 hour
        );
        if (!replies)
          return { success: false, error: "No replies found for this user" };
        return { success: true, replies };
      } catch (err) {
        return {
          success: false,
          error: "Failed to fetch replies for this user",
        };
      }
    },
    /**
     * Finds all replies created by a specific seller.
     */
    findRepliesBySellerId: async (seller_id) => {
      try {
        const cacheKey = `replies_seller_${seller_id}`;
        const replies = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const sellerReplies = await postRepo.findRepliesBySellerId(
              seller_id
            );
            return sellerReplies ?? [];
          },
          3600 // Cache for 1 hour
        );
        if (!replies)
          return { success: false, error: "No replies found for this seller" };
        return { success: true, replies };
      } catch (err) {
        return {
          success: false,
          error: "Failed to fetch replies for this seller",
        };
      }
    },
    /**
     * Finds all replies created by a specific financial user.
     */
    findRepliesByFinancialId: async (financial_id) => {
      try {
        const cacheKey = `replies_financial_${financial_id}`;
        const replies = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const financialReplies = await postRepo.findRepliesByFinancialId(
              financial_id
            );
            return financialReplies ?? [];
          },
          3600 // Cache for 1 hour
        );
        if (!replies)
          return {
            success: false,
            error: "No replies found for this financial user",
          };
        return { success: true, replies };
      } catch (err) {
        return {
          success: false,
          error: "Failed to fetch replies for this financial user",
        };
      }
    },
    /**
     * Retrieves all replies.
     */
    findAllReplies: async () => {
      try {
        const cacheKey = "replies";
        const replies = await CacheService.getOrSet(
          cacheKey,
          async () => {
            const allReplies = await postRepo.findAllReplies();
            return allReplies ?? [];
          },
          3600 // Cache for 1 hour
        );
        if (!replies) return { success: false, error: "No replies found" };
        return { success: true, replies };
      } catch (err) {
        return { success: false, error: "Failed to fetch replies" };
      }
    },
    /**
     * Creates a new reply after verifying the user and parent post exist.
     */
    createReply: async (
      user_id?: string,
      seller_id?: string,
      financial_id?: string,
      replyData: any = {}
    ) => {
      try {
        // Ensure checks array
        const checks = [
          { id: user_id, repo: userRepo, error: "User not found" },
          { id: seller_id, repo: sellerRepo, error: "Seller not found" },
          {
            id: financial_id,
            repo: financialRepo,
            error: "Financial user not found",
          },
        ];

        for (const item of checks) {
          if (item.id) {
            const exists = await item.repo.findById(item.id);
            if (!exists) return { success: false, error: item.error };
          }
        }

        if (!replyData || typeof replyData !== "object") {
          return { success: false, error: "Invalid reply data" };
        }

        const post = await postRepo.findbyid(replyData.post_id);
        if (!post) return { success: false, error: "Post not found" };

        const reply = await postRepo.createReply({
          ...replyData,
          user_id: user_id || null,
          seller_id: seller_id || null,
          financial_id: financial_id || null,
        });

        const currentReplyCount = post.reply_count || 0;
        await Promise.all([
          postRepo.updatePostReplyCount(
            replyData.post_id,
            currentReplyCount + 1
          ),
          postRepo.updatePostLastReplyBy(
            replyData.post_id,
            user_id || seller_id || financial_id || ""
          ),
        ]);

        // Invalidate caches for replies and posts
        const cacheKeys = [
          `replies_post_${replyData.post_id}`,
          `post_${replyData.post_id}`,
        ];

        // Add user-specific cache keys if applicable
        if (user_id) {
          cacheKeys.push(`replies_user_${user_id}`);
        }
        if (seller_id) {
          cacheKeys.push(`replies_seller_${seller_id}`);
        }
        if (financial_id) {
          cacheKeys.push(`replies_financial_${financial_id}`);
        }

        // Add post owner cache keys if applicable
        if (post.user_id) {
          cacheKeys.push(`posts_user_${post.user_id}`);
        }
        if (post.seller_id) {
          const sellerId = post.seller_id.toString();
          cacheKeys.push(`posts_seller_${sellerId}`);
        }
        if (post.financial_id) {
          const financialId = post.financial_id.toString();
          cacheKeys.push(`posts_financial_${financialId}`);
        }

        await Promise.all(cacheKeys.map((key) => CacheService.delete(key)));
        await CacheService.deletePattern("posts_*");
        await CacheService.deletePattern("replies_*");

        return { success: true, reply };
      } catch (err) {
        console.error("createReply error:", err);
        return { success: false, error: "Failed to create reply" };
      }
    },

    /**
     * Updates an existing reply's data.
     */
    updateReply: async (id, replyData) => {
      try {
        const existingReply = await postRepo.findReplyById(id);
        if (!existingReply) return { success: false, error: "Reply not found" };

        const reply = await postRepo.updateReply(id, replyData);
        if (!reply) return { success: false, error: "Reply not found" };

        // Invalidate all relevant reply caches
        await Promise.all([
          CacheService.delete(`reply_${id}`),
          CacheService.delete("replies"),
          CacheService.delete(`replies_post_${existingReply.post_id}`),
          CacheService.delete(`replies_user_${existingReply.user_id}`),
        ]);

        return { success: true, reply };
      } catch (err) {
        return { success: false, error: "Failed to update reply" };
      }
    },
    /**
     * Deletes a reply from the system.
     */
    deleteReply: async (id) => {
      try {
        const existingReply = await postRepo.findReplyById(id);
        if (!existingReply) return { success: false, error: "Reply not found" };

        const post = await postRepo.findPostById(
          existingReply.post_id.toString()
        );
        if (!post) return { success: false, error: "Post not found" };

        const success = await postRepo.deleteReply(id);
        if (!success) return { success: false, error: "Reply not found" };

        // Update post reply count (decrement)
        const currentReplyCount = post.reply_count || 0;
        const newReplyCount = Math.max(0, currentReplyCount - 1);
        await postRepo.updatePostReplyCount(
          existingReply.post_id.toString(),
          newReplyCount
        );

        // Invalidate all relevant reply and post caches
        await Promise.all([
          CacheService.delete(`reply_${id}`),
          CacheService.delete("replies"),
          CacheService.delete(`replies_post_${existingReply.post_id}`),
          CacheService.delete(`replies_user_${existingReply.user_id}`),
          CacheService.delete(`post_${existingReply.post_id}`),
          CacheService.deletePattern("posts_*"),
          CacheService.delete(`posts_user_${post.user_id}`),
        ]);

        return { success: true };
      } catch (err) {
        return { success: false, error: "Failed to delete reply" };
      }
    },
  };
}
