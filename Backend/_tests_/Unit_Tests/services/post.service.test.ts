import dotenv from "dotenv";
dotenv.config({ quiet: true });
import {
  describe,
  it,
  expect,
  jest,
  beforeAll,
  beforeEach,
  afterAll,
} from "@jest/globals";
import mongoose, { Types } from "mongoose";
import { postService, IPostService } from "../../../src/modules/post/post.service";
import { IPostRepository } from "../../../src/modules/post/post.repository";
import { IUserRepository } from "../../../src/modules/user/user.repository";
import { PostDTO, PostReplyDTO } from "../../../src/dtos/post.DTO";
import CacheService from "../../../src/shared/cache/CacheService";

// Mock CacheService
jest.mock("../../../src/shared/cache/CacheService");

describe("PostService", () => {
  let service: IPostService;
  let mockPostRepo: jest.Mocked<IPostRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockSellerRepo: jest.Mocked<any>;
  let mockFinancialRepo: jest.Mocked<any>;
  let mockNotificationService: jest.Mocked<any>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockPostRepo = {
      findbyid: jest.fn(),
      findPostById: jest.fn(),
      findAllPosts: jest.fn(),
      findPostsByUserId: jest.fn(),
      findPostsBySellerId: jest.fn(),
      findPostsByFinancialId: jest.fn(),
      hasUserViewedPostToday: jest.fn(),
      createPostView: jest.fn(),
      createPost: jest.fn(),
      updatePost: jest.fn(),
      updatePostViews: jest.fn(),
      updatePostReplyCount: jest.fn(),
      updatePostLastReplyBy: jest.fn(),
      deletePost: jest.fn(),
      findReplyById: jest.fn(),
      findRepliesByPostId: jest.fn(),
      findRepliesByUserId: jest.fn(),
      findRepliesBySellerId: jest.fn(),
      findRepliesByFinancialId: jest.fn(),
      findAllReplies: jest.fn(),
      createReply: jest.fn(),
      updateReply: jest.fn(),
      deleteReply: jest.fn(),
    } as jest.Mocked<IPostRepository>;

    mockUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    mockSellerRepo = {} as jest.Mocked<any>;
    mockFinancialRepo = {} as jest.Mocked<any>;
    mockNotificationService = {
      create: jest.fn(),
    } as any;
    (mockNotificationService.create as jest.MockedFunction<any>).mockResolvedValue({ success: true, notification: {} });
    service = postService(mockPostRepo, mockUserRepo, mockSellerRepo, mockFinancialRepo, mockNotificationService);

    (CacheService.getOrSet as any) = jest.fn(
      async (key, fetchFunction: any) => {
        return fetchFunction();
      }
    );

    (CacheService.delete as any) = jest.fn();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("findPostById", () => {
    it("should return post by id", async () => {
      const postId = new Types.ObjectId().toString();
      const mockPost = { _id: new Types.ObjectId(postId), title: "Test Post" };

      mockPostRepo.findPostById.mockResolvedValue(mockPost as any);

      const result = await service.findPostById(postId);

      expect(result.success).toBe(true);
      expect(result.post).toEqual(mockPost);
    });

    it("should return error if post not found", async () => {
      const postId = new Types.ObjectId().toString();

      mockPostRepo.findPostById.mockResolvedValue(null);

      const result = await service.findPostById(postId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Post not found");
    });
  });

  describe("findAllPosts", () => {
    it("should return paginated posts", async () => {
      const mockPosts = [
        { _id: new Types.ObjectId(), title: "Post 1" },
        { _id: new Types.ObjectId(), title: "Post 2" },
      ];

      mockPostRepo.findAllPosts.mockResolvedValue(mockPosts as any);

      const result = await service.findAllPosts({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.posts).toBeDefined();
    });
  });

  describe("createPost", () => {
    it("should create a new post", async () => {
      const userId = new Types.ObjectId().toString();
      const postData: PostDTO = {
        user_id: userId,
        title: "New Post",
        content: "Post content",
      };
      const mockUser = { _id: new Types.ObjectId(userId) };
      const mockPost = { _id: new Types.ObjectId(), ...postData };

      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockPostRepo.createPost.mockResolvedValue(mockPost as any);

      const result = await service.createPost(userId, null, null, postData);

      expect(result.success).toBe(true);
      expect(result.post).toEqual(mockPost);
    });

    it("should return error if user not found", async () => {
      const userId = new Types.ObjectId().toString();
      const postData: PostDTO = { user_id: userId, title: "New Post", content: "Content" };

      mockUserRepo.findById.mockResolvedValue(null);

      const result = await service.createPost(userId, null, null, postData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });
  });

  describe("updatePost", () => {
    it("should update post successfully", async () => {
      const postId = new Types.ObjectId().toString();
      const updateData: Partial<PostDTO> = { title: "Updated Title" };
      const mockPost = { _id: new Types.ObjectId(postId), ...updateData };

      mockPostRepo.updatePost.mockResolvedValue(mockPost as any);

      const result = await service.updatePost(postId, updateData);

      expect(result.success).toBe(true);
      expect(result.post).toEqual(mockPost);
    });
  });

  describe("deletePost", () => {
    it("should delete post successfully", async () => {
      const postId = new Types.ObjectId().toString();
      const mockPost = { _id: new Types.ObjectId(postId), user_id: new Types.ObjectId() };

      mockPostRepo.findbyid.mockResolvedValue(mockPost as any);
      mockPostRepo.deletePost.mockResolvedValue(true);

      const result = await service.deletePost(postId);

      expect(result.success).toBe(true);
    });
  });

  describe("createReply", () => {
    it("should create a new reply", async () => {
      const userId = new Types.ObjectId().toString();
      const postId = new Types.ObjectId().toString();
      const replyData: PostReplyDTO = {
        user_id: userId,
        post_id: postId,
        content: "Reply content",
      };
      const mockUser = { _id: new Types.ObjectId(userId) };
      const mockPost = { _id: new Types.ObjectId(postId) };
      const mockReply = { _id: new Types.ObjectId(), ...replyData };

      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockPostRepo.findbyid.mockResolvedValue(mockPost as any);
      mockPostRepo.createReply.mockResolvedValue(mockReply as any);
      mockPostRepo.updatePostReplyCount.mockResolvedValue(mockPost as any);
      // Mock notification service
      mockNotificationService.create.mockResolvedValue({ success: true, notification: {} });

      const result = await service.createReply(userId, "", "", replyData);

      expect(result.success).toBe(true);
      expect(result.reply).toEqual(mockReply);
    });
  });
});

