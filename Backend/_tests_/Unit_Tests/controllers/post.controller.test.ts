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
import mongoose from "mongoose";
import { Request, Response } from "express";
import { postController, IPostController } from "../../../src/modules/post/post.controller";
import { IPostService } from "../../../src/modules/post/post.service";
import { handleResult, handleError } from "../../../src/shared/utils/Respons.util";

jest.mock("../../../src/shared/utils/Respons.util");

describe("PostController", () => {
  let controller: IPostController;
  let mockPostService: jest.Mocked<IPostService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI!);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockPostService = {
      findPostById: jest.fn(),
      findAllPosts: jest.fn(),
      findPostsByUserId: jest.fn(),
      findPostsBySellerId: jest.fn(),
      findPostsByFinancialId: jest.fn(),
      findRepliesBySellerId: jest.fn(),
      findRepliesByFinancialId: jest.fn(),
      createPost: jest.fn(),
      updatePost: jest.fn(),
      updatePostViews: jest.fn(),
      updatePostReplyCount: jest.fn(),
      updatePostLastReplyBy: jest.fn(),
      deletePost: jest.fn(),
      findReplyById: jest.fn(),
      findRepliesByPostId: jest.fn(),
      findRepliesByUserId: jest.fn(),
      findAllReplies: jest.fn(),
      createReply: jest.fn(),
      updateReply: jest.fn(),
      deleteReply: jest.fn(),
    } as jest.Mocked<IPostService>;

    controller = postController(mockPostService);

    mockRequest = { params: {}, body: {}, query: {} };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;

    (handleResult as jest.Mock) = jest.fn((res, result, status) => res);
    (handleError as jest.Mock) = jest.fn((res, err, operation) => res);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("findPostById", () => {
    it("should call service.findPostById and return result", async () => {
      const postId = "post123";
      const mockResult = { success: true, post: {} };

      mockRequest.params = { id: postId };
      mockPostService.findPostById.mockResolvedValue(mockResult);

      await controller.findPostById(mockRequest as Request, mockResponse as Response);

      expect(mockPostService.findPostById).toHaveBeenCalledWith(postId);
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult);
    });
  });

  describe("createPost", () => {
    it("should call service.createPost and return result with 201 status", async () => {
      const postData = { title: "New Post", content: "Content", user_id: "user123", seller_id: null, financial_id: null };
      const mockResult = { success: true, post: {} };

      mockRequest.body = postData;
      mockPostService.createPost.mockResolvedValue(mockResult);

      await controller.createPost(mockRequest as Request, mockResponse as Response);

      expect(mockPostService.createPost).toHaveBeenCalledWith(postData.user_id, postData.seller_id, postData.financial_id, { title: postData.title, content: postData.content });
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });
  });

  describe("createReply", () => {
    it("should call service.createReply and return result with 201 status", async () => {
      const replyData = { post_id: "post123", content: "Reply", user_id: "user123", seller_id: null, financial_id: null };
      const mockResult = { success: true, reply: {} };

      mockRequest.body = replyData;
      mockPostService.createReply.mockResolvedValue(mockResult);

      await controller.createReply(mockRequest as Request, mockResponse as Response);

      const { user_id, seller_id, financial_id, ...replyDataOnly } = replyData;
      expect(mockPostService.createReply).toHaveBeenCalledWith(
        replyData.user_id,
        replyData.seller_id as any,
        replyData.financial_id as any,
        replyDataOnly
      );
      expect(handleResult).toHaveBeenCalledWith(mockResponse as Response, mockResult, 201);
    });
  });
});

