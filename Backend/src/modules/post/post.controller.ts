import { Request, Response } from "express";
import { IPostService } from "./post.service";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

/**
 * Defines the contract for the post controller, specifying methods for handling HTTP requests
 * related to community forum posts and their replies.
 */
export interface IPostController {
  // Post methods
  /**
   * Handles the HTTP request to get a post by its unique ID.
   * @param req - The Express request object, containing the post ID in `req.params`.
   * @param res - The Express response object.
   */
  findPostById(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to retrieve all posts.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  findAllPosts(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all posts created by a specific user.
   * @param req - The Express request object, containing the user ID in `req.params`.
   * @param res - The Express response object.
   */
  findPostsByUserId(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to create a new post.
   * @param req - The Express request object, containing post data in the body.
   * @param res - The Express response object.
   */
  createPost(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update an existing post.
   * @param req - The Express request object, containing the post ID and update data.
   * @param res - The Express response object.
   */
  updatePost(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update the view count of a post.
   * @param req - The Express request object, containing the post ID and new view count.
   * @param res - The Express response object.
   */
  updatePostViews(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update the reply count of a post.
   * @param req - The Express request object, containing the post ID and new reply count.
   * @param res - The Express response object.
   */
  updatePostReplyCount(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update the 'last replied by' information on a post.
   * @param req - The Express request object, containing the post ID and user info.
   * @param res - The Express response object.
   */
  updatePostLastReplyBy(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete a post.
   * @param req - The Express request object, containing the post ID in `req.params`.
   * @param res - The Express response object.
   */
  deletePost(req: Request, res: Response): Promise<Response>;

  // Reply methods
  /**
   * Handles the HTTP request to get a reply by its unique ID.
   * @param req - The Express request object, containing the reply ID in `req.params`.
   * @param res - The Express response object.
   */
  findReplyById(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all replies for a specific post.
   * @param req - The Express request object, containing the post ID in `req.params`.
   * @param res - The Express response object.
   */
  findRepliesByPostId(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to get all replies created by a specific user.
   * @param req - The Express request object, containing the user ID in `req.params`.
   * @param res - The Express response object.
   */
  findRepliesByUserId(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to retrieve all replies across all posts.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  findAllReplies(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to create a new reply to a post.
   * @param req - The Express request object, containing reply data in the body.
   * @param res - The Express response object.
   */
  createReply(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to update an existing reply.
   * @param req - The Express request object, containing the reply ID and update data.
   * @param res - The Express response object.
   */
  updateReply(req: Request, res: Response): Promise<Response>;
  /**
   * Handles the HTTP request to delete a reply.
   * @param req - The Express request object, containing the reply ID in `req.params`.
   * @param res - The Express response object.
   */
  deleteReply(req: Request, res: Response): Promise<Response>;
}

/**
 * Factory function to create an instance of the post controller.
 * It encapsulates the logic for handling API requests related to forum posts and replies.
 *
 * @param postService - The post service dependency that contains the business logic.
 * @returns An implementation of the IPostController interface.
 */
export function postController(postService: IPostService): IPostController {
  return {
    /**
     * Retrieves a single post by its ID.
     */
    findPostById: async (req, res) => {
      const id = req.params.id;
      try {
        const result = await postService.findPostById(id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "fetching post by id");
      }
    },
    /**
     * Retrieves a list of all posts.
     */
    findAllPosts: async (req, res) => {
      try {
        const { page, limit, search, filter } = req.query;
        const result = await postService.findAllPosts({
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
          search: typeof search === "string" ? search : undefined,
          filter: typeof filter === "string" ? filter : "",
        });
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "fetching all posts");
      }
    },
    /**
     * Retrieves all posts created by a specific user.
     */
    findPostsByUserId: async (req, res) => {
      const user_id = req.params.user_id;
      try {
        const result = await postService.findPostsByUserId(user_id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "fetching posts by user id");
      }
    },
    /**
     * Creates a new post.
     */
    createPost: async (req, res) => {
      const user_id = req.body.user_id;
      const postData = req.body;
      try {
        const result = await postService.createPost(user_id, postData);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "creating post");
      }
    },
    /**
     * Updates an existing post.
     */
    updatePost: async (req, res) => {
      const id = req.params.id;
      const postData = req.body;
      try {
        const result = await postService.updatePost(id, postData);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updating post");
      }
    },
    /**
     * Atomically increments the view count for a specific post.
     * Only increments if the user hasn't viewed the post today.
     */
    updatePostViews: async (req, res) => {
      const id = req.params.id;
      const user_id = req.user?.userId; // Get user_id from JWT token (set by protectJWT middleware)
      if (!user_id) {
        return res.status(401).json({ success: false, error: "User not authenticated" });
      }
      try {
        const result = await postService.updatePostViews(id, user_id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updating post views");
      }
    },
    /**
     * Updates the reply count for a specific post.
     */
    updatePostReplyCount: async (req, res) => {
      const id = req.params.id;
      const reply_count = req.body.reply_count;
      try {
        const result = await postService.updatePostReplyCount(id, reply_count);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updating post reply count");
      }
    },
    /**
     * Updates the user information for the last reply on a post.
     */
    updatePostLastReplyBy: async (req, res) => {
      const id = req.params.id;
      const last_reply_by = req.body.last_reply_by;
      try {
        const result = await postService.updatePostLastReplyBy(
          id,
          last_reply_by
        );
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updating post last reply by");
      }
    },
    /**
     * Deletes a post by its ID.
     */
    deletePost: async (req, res) => {
      const id = req.params.id;
      try {
        const result = await postService.deletePost(id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "deleting post");
      }
    },
    // Reply methods
    /**
     * Retrieves a single reply by its ID.
     */
    findReplyById: async (req, res) => {
      const id = req.params.id;
      try {
        const result = await postService.findReplyById(id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "fetching reply by id");
      }
    },
    /**
     * Retrieves all replies associated with a specific post.
     */
    findRepliesByPostId: async (req, res) => {
      const post_id = req.params.post_id;
      try {
        const result = await postService.findRepliesByPostId(post_id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "fetching replies by post id");
      }
    },
    /**
     * Retrieves all replies created by a specific user.
     */
    findRepliesByUserId: async (req, res) => {
      const user_id = req.params.user_id;
      try {
        const result = await postService.findRepliesByUserId(user_id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "fetching replies by user id");
      }
    },
    /**
     * Retrieves a list of all replies from all posts.
     */
    findAllReplies: async (req, res) => {
      try {
        const result = await postService.findAllReplies();
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "fetching all replies");
      }
    },
    /**
     * Creates a new reply for a post.
     */
    createReply: async (req, res) => {
      const user_id = req.body.user_id;
      const replyData = req.body;
      try {
        const result = await postService.createReply(user_id, replyData);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "creating reply");
      }
    },
    /**
     * Updates an existing reply.
     */
    updateReply: async (req, res) => {
      const id = req.params.id;
      const replyData = req.body;
      try {
        const result = await postService.updateReply(id, replyData);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updating reply");
      }
    },
    /**
     * Deletes a reply by its ID.
     */
    deleteReply: async (req, res) => {
      const id = req.params.id;
      try {
        const result = await postService.deleteReply(id);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "deleting reply");
      }
    },
  };
}
