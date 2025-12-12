import { validateDto } from "../../shared/middlewares/DtoValidator.middleware";
import { Router } from "express";
import { IPostController } from "./post.controller";
import { PostDTO, PostReplyDTO, PostUpdateReplyDTO } from "../../dtos/post.DTO";
import { container } from "../../di/container";

/**
 * Factory function that creates and configures the router for forum post-related endpoints.
 * It resolves the post controller from the dependency injection container and maps
 * controller methods to specific API routes for posts and replies.
 *
 * @returns The configured Express Router for forum posts.
 */
/**
 * @swagger
 * tags:
 *   - name: Posts
 *     description: Forum post management
 *   - name: Replies
 *     description: Management of replies to forum posts
 */
export const postRouter = (): Router => {
  const router = Router();
  // Resolve the post controller from the DI container.
  const postController = container.resolve<IPostController>("PostController");

  // --- Post Routes ---
  /**
   * @swagger
   * /post/posts:
   *   get:
   *     summary: Get all posts
   *     description: Retrieves a list of all forum posts, with optional filtering and pagination.
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *         description: Page number for pagination.
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 10 }
   *         description: Number of items per page.
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *         description: Search term to filter posts by title or content.
   *       - in: query
   *         name: filter
   *         schema: { type: string }
   *         description: Filter criteria for posts.
   *     responses:
   *       '200':
   *         description: A paginated list of posts.
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/posts", (req, res) => postController.findAllPosts(req, res));

  /**
   * @swagger
   * /post/post:
   *   post:
   *     summary: Create a new post
   *     description: Creates a new forum post. Requires user authentication.
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PostDTO'
   *     responses:
   *       '201':
   *         description: Post created successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.post("/post", validateDto(PostDTO), (req, res) =>
    postController.createPost(req, res)
  );

  /**
   * @swagger
   * /post/posts/user/{user_id}:
   *   get:
   *     summary: Get posts by user ID
   *     description: Retrieves all posts created by a specific user.
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user whose posts are to be retrieved.
   *     responses:
   *       '200':
   *         description: A list of the user's posts.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: User not found or no posts found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/posts/user/:user_id", (req, res) =>
    postController.findPostsByUserId(req, res)
  );

  /**
   * @swagger
   * /post/posts/seller/{seller_id}:
   *   get:
   *     summary: Get posts by seller ID
   *     description: Retrieves all posts created by a specific seller.
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: seller_id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the seller whose posts are to be retrieved.
   *     responses:
   *       '200':
   *         description: A list of the seller's posts.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Seller not found or no posts found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/posts/seller/:seller_id", (req, res) =>
    postController.findPostsBySellerId(req, res)
  );

  /**
   * @swagger
   * /post/posts/financial/{financial_id}:
   *   get:
   *     summary: Get posts by financial ID
   *     description: Retrieves all posts created by a specific financial user.
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: financial_id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the financial user whose posts are to be retrieved.
   *     responses:
   *       '200':
   *         description: A list of the financial user's posts.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Financial user not found or no posts found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/posts/financial/:financial_id", (req, res) =>
    postController.findPostsByFinancialId(req, res)
  );

  /**
   * @swagger
   * /post/post/{id}:
   *   get:
   *     summary: Get post by ID
   *     description: Retrieves a single forum post by its unique ID, including its replies.
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the post to retrieve.
   *     responses:
   *       '200':
   *         description: Post details including author and replies.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Post not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/post/:id", (req, res) => postController.findPostById(req, res));

  /**
   * @swagger
   * /post/post/{id}:
   *   put:
   *     summary: Update a post
   *     description: Updates an existing forum post. Requires ownership or admin privileges.
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the post to update.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PostDTO'
   *     responses:
   *       '200':
   *         description: Post updated successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Post not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put("/post/:id", validateDto(PostDTO), (req, res) =>
    postController.updatePost(req, res)
  );

  /**
   * @swagger
   * /post/post/{id}/views:
   *   patch:
   *     summary: Increment post view count
   *     description: Atomically increments the view count of a post by 1. Typically called when a post is viewed.
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the post to update.
   *     responses:
   *       '200':
   *         description: View count incremented successfully.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Post not found.
   *       '500':
   *         description: Internal server error.
   */
  router.patch("/post/:id/views", (req, res) =>
    postController.updatePostViews(req, res)
  );

  /**
   * @swagger
   * /post/post/{id}/reply-count:
   *   patch:
   *     summary: Update post reply count
   *     description: Updates the reply count of a post. Typically called internally when a reply is added or deleted.
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the post to update.
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reply_count:
   *                 type: number
   *                 description: The new reply count.
   *     responses:
   *       '200':
   *         description: Reply count updated successfully.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Post not found.
   *       '500':
   *         description: Internal server error.
   */
  router.patch("/post/:id/reply-count", (req, res) =>
    postController.updatePostReplyCount(req, res)
  );

  /**
   * @swagger
   * /post/post/{id}/last-reply-by:
   *   patch:
   *     summary: Update post's last reply author
   *     description: Updates the user who made the last reply on a post. Typically called internally when a reply is added.
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the post to update.
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               last_reply_by:
   *                 type: string
   *                 description: The ID of the user who made the last reply.
   *     responses:
   *       '200':
   *         description: Last reply author updated successfully.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Post not found.
   *       '500':
   *         description: Internal server error.
   */
  router.patch("/post/:id/last-reply-by", (req, res) =>
    postController.updatePostLastReplyBy(req, res)
  );

  /**
   * @swagger
   * /post/post/{id}:
   *   delete:
   *     summary: Delete a post
   *     description: Deletes a post by its unique ID. Requires ownership or admin privileges.
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the post to delete.
   *     responses:
   *       '200':
   *         description: Post deleted successfully.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Post not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete("/post/:id", (req, res) => postController.deletePost(req, res));

  // --- Reply Routes ---

  /**
   * @swagger
   * /post/replies:
   *   get:
   *     summary: Get all replies
   *     description: Retrieves a list of all replies across all posts.
   *     tags: [Replies]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: A list of all replies.
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/replies", (req, res) => postController.findAllReplies(req, res));

  /**
   * @swagger
   * /post/reply:
   *   post:
   *     summary: Create a new reply
   *     description: Creates a new reply to a post. Requires user authentication.
   *     tags: [Replies]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PostReplyDTO'
   *     responses:
   *       '201':
   *         description: Reply created successfully.
   *       '400':
   *         description: Bad request (validation error, post not found).
   *       '401':
   *         description: Unauthorized.
   *       '500':
   *         description: Internal server error.
   */
  router.post("/reply", validateDto(PostReplyDTO), (req, res) =>
    postController.createReply(req, res)
  );

  /**
   * @swagger
   * /post/replies/post/{post_id}:
   *   get:
   *     summary: Get replies by post ID
   *     description: Retrieves all replies for a specific post.
   *     tags: [Replies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: post_id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the post to retrieve replies for.
   *     responses:
   *       '200':
   *         description: A list of replies for the specified post.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Post not found or no replies found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/replies/post/:post_id", (req, res) =>
    postController.findRepliesByPostId(req, res)
  );

  /**
   * @swagger
   * /post/replies/user/{user_id}:
   *   get:
   *     summary: Get replies by user ID
   *     description: Retrieves all replies created by a specific user.
   *     tags: [Replies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user whose replies are to be retrieved.
   *     responses:
   *       '200':
   *         description: A list of the user's replies.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: User not found or no replies found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/replies/user/:user_id", (req, res) =>
    postController.findRepliesByUserId(req, res)
  );

  /**
   * @swagger
   * /post/replies/seller/{seller_id}:
   *   get:
   *     summary: Get replies by seller ID
   *     description: Retrieves all replies created by a specific seller.
   *     tags: [Replies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: seller_id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the seller whose replies are to be retrieved.
   *     responses:
   *       '200':
   *         description: A list of the seller's replies.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Seller not found or no replies found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/replies/seller/:seller_id", (req, res) =>
    postController.findRepliesBySellerId(req, res)
  );

  /**
   * @swagger
   * /post/replies/financial/{financial_id}:
   *   get:
   *     summary: Get replies by financial ID
   *     description: Retrieves all replies created by a specific financial user.
   *     tags: [Replies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: financial_id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the financial user whose replies are to be retrieved.
   *     responses:
   *       '200':
   *         description: A list of the financial user's replies.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Financial user not found or no replies found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/replies/financial/:financial_id", (req, res) =>
    postController.findRepliesByFinancialId(req, res)
  );

  /**
   * @swagger
   * /post/reply/{id}:
   *   get:
   *     summary: Get reply by ID
   *     description: Retrieves a single reply by its unique ID.
   *     tags: [Replies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the reply to retrieve.
   *     responses:
   *       '200':
   *         description: Reply details.
   *       '401':
   *         description: Unauthorized.
   *       '404':
   *         description: Reply not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/reply/:id", (req, res) =>
    postController.findReplyById(req, res)
  );

  /**
   * @swagger
   * /post/reply/{id}:
   *   put:
   *     summary: Update a reply
   *     description: Updates an existing reply. Requires ownership or admin privileges.
   *     tags: [Replies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the reply to update.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PostReplyDTO'
   *     responses:
   *       '200':
   *         description: Reply updated successfully.
   *       '400':
   *         description: Bad request (validation error).
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Reply not found.
   *       '500':
   *         description: Internal server error.
   */
  router.put("/reply/:id", validateDto(PostUpdateReplyDTO), (req, res) =>
    postController.updateReply(req, res)
  );

  /**
   * @swagger
   * /post/reply/{id}:
   *   delete:
   *     summary: Delete a reply
   *     description: Deletes a reply by its unique ID. Requires ownership or admin privileges.
   *     tags: [Replies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the reply to delete.
   *     responses:
   *       '200':
   *         description: Reply deleted successfully.
   *       '401':
   *         description: Unauthorized.
   *       '403':
   *         description: Forbidden.
   *       '404':
   *         description: Reply not found.
   *       '500':
   *         description: Internal server error.
   */
  router.delete("/reply/:id", (req, res) =>
    postController.deleteReply(req, res)
  );

  return router;
};
