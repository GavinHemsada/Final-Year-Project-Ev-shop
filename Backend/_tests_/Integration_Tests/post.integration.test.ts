import dotenv from "dotenv";
dotenv.config({ quiet: true });
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import mongoose, { Types } from "mongoose";
import { setupTestDB, teardownTestDB, clearDatabase } from "./setup/testSetup";
import { postService } from "../../src/modules/post/post.service";
import { PostRepository } from "../../src/modules/post/post.repository";
import { UserRepository } from "../../src/modules/user/user.repository";
import { User } from "../../src/entities/User";
import { UserRole } from "../../src/shared/enum/enum";

jest.mock("../../src/shared/cache/CacheService", () => ({
  default: {
    getOrSet: jest.fn(async (key, fetchFunction) => fetchFunction()),
    delete: jest.fn(),
    deletePattern: jest.fn().mockResolvedValue(0),
  },
  getOrSet: jest.fn(async (key, fetchFunction) => fetchFunction()),
  delete: jest.fn(),
  deletePattern: jest.fn().mockResolvedValue(0),
}));

describe("Post Integration Tests", () => {
  let service: ReturnType<typeof postService>;
  let postRepo: typeof PostRepository;
  let userRepo: typeof UserRepository;
  let testUserId: string;

  beforeAll(async () => {
    await setupTestDB();
    postRepo = PostRepository;
    userRepo = UserRepository;
    const sellerRepo = {} as any;
    const financialRepo = {} as any;
    const notificationService = {} as any;
    service = postService(postRepo, userRepo, sellerRepo, financialRepo, notificationService);
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();

    // Create test user
    const user = new User({
      email: "postuser@example.com",
      password: "hashedPassword",
      name: "Post User",
      phone: "1234567890",
      role: [UserRole.USER],
    });
    await user.save();
    testUserId = user._id.toString();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Post Operations", () => {
    it("should create a new post", async () => {
      const postData = {
        user_id: testUserId,
        title: "Test Post",
        content: "This is a test post content",
      };

      const mockUser = {
        _id: new Types.ObjectId(testUserId),
        email: "postuser@example.com",
        name: "Post User",
      };
      const mockPost = {
        _id: new Types.ObjectId(),
        ...postData,
        user_id: testUserId,
      };

      jest.spyOn(userRepo, "findById").mockResolvedValue(mockUser as any);
      jest.spyOn(postRepo, "createPost").mockResolvedValue(mockPost as any);

      const result = await service.createPost(testUserId, null, null, postData);

      expect(result.success).toBe(true);
      expect(result.post).toBeDefined();
      expect(result.post?.title).toBe(postData.title);
    });

    it("should get all posts", async () => {
      jest.spyOn(postRepo, "findAllPosts").mockResolvedValue([
        {
          _id: new Types.ObjectId(),
          title: "Post 1",
          content: "Content 1",
        },
        {
          _id: new Types.ObjectId(),
          title: "Post 2",
          content: "Content 2",
        },
      ] as any);

      const result = await service.findAllPosts();

      expect(result.success).toBe(true);
      expect(result.posts?.length).toBeGreaterThanOrEqual(2);
    });

    it("should get post by ID", async () => {
      const postId = new Types.ObjectId().toString();
      jest.spyOn(postRepo, "findPostById").mockResolvedValue({
        _id: new Types.ObjectId(postId),
        title: "Test Post",
        content: "Test Content",
      } as any);

      const result = await service.findPostById(postId);

      expect(result.success).toBe(true);
      expect(result.post).toBeDefined();
    });
  });
});

