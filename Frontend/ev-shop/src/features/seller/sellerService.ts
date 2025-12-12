import { axiosPrivate } from "@/config/config";

export const sellerService = {
  getSellerProfile: async (userId: string) => {
    const response = await axiosPrivate.get(`/seller/user/${userId}`);
    return response.data;
  },
  getSellerEvList: async (sellerId: string) => {
    const response = await axiosPrivate.get(`/ev/listings/seller/${sellerId}`);
    return response.data;
  },
  getListingForEdit: async (listingId: string) => {
    const response = await axiosPrivate.get(`/ev/listings/${listingId}`);
    // Backend's handleResult unwraps { success: true, listing: {...} } to just the listing object
    // So response.data is the listing directly
    return response.data;
  },
  getAllEvCateogry: async () => {
    const response = await axiosPrivate.get("/ev/categories");
    return response.data;
  },
  getAllEvBrand: async () => {
    const response = await axiosPrivate.get("/ev/brands");
    return response.data;
  },
  createnewModel: async (modelData: any) => {
    const response = await axiosPrivate.post("/ev/models", modelData);
    return response.data;
  },
  updateModel: async (modelId: string, modelData: any) => {
    const response = await axiosPrivate.put(`/ev/models/${modelId}`, modelData);
    return response.data;
  },
  createListing: async (listingData: any) => {
    const response = await axiosPrivate.post("/ev/listings", listingData);
    return response.data;
  },
  updateListing: async (listingId: string, listingData: any) => {
    const response = await axiosPrivate.put(
      `/ev/listings/${listingId}`,
      listingData
    );
    return response.data;
  },
  quickUpdateListing: async (
    listingId: string,
    data: { status?: string; number_of_ev?: number }
  ) => {
    const response = await axiosPrivate.patch(
      `/ev/listings/${listingId}/quick-update`,
      data
    );
    return response.data;
  },
  deleteListing: async (id: string) => {
    const response = await axiosPrivate.delete(`/ev/listings/${id}`);
    return response.data;
  },
  deleteModel: async (id: string) => {
    const response = await axiosPrivate.delete(`/ev/models/${id}`);
    return response.data;
  },

  // community operations
  getCommunityPosts: async (params?: { search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) {
      queryParams.append("search", params.search);
    }
    const url = `/post/posts${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    const response = await axiosPrivate.get(url);
    return response.data;
  },
  getCommunityPostbySeller: async (seller_id: string) => {
    const response = await axiosPrivate.get(`/post/posts/seller/${seller_id}`);
    return response.data;
  },
  createCommunityPost: async (postData: any) => {
    const response = await axiosPrivate.post(`/post/post`, postData);
    return response.data;
  },
  updateCommunityPost: async (id: string, postData: any) => {
    const response = await axiosPrivate.put(`/post/post/${id}`, postData);
    return response.data;
  },
  deleteCommunityPost: async (id: string) => {
    const response = await axiosPrivate.delete(`/post/post/${id}`);
    return response.data;
  },
  postView: async (id: string) => {
    // Atomically increment view count on the server
    const response = await axiosPrivate.patch(`/post/post/${id}/views`);
    return response.data;
  },
  replyCount: async (id: string) => {
    // Get current reply count and increment
    try {
      const postResponse = await axiosPrivate.get(`/post/post/${id}`);
      const currentCount = postResponse.data?.post?.reply_count || 0;
      const response = await axiosPrivate.patch(
        `/post/post/${id}/reply-count`,
        {
          reply_count: currentCount + 1,
        }
      );
      return response.data;
    } catch (error) {
      // If getting post fails, just try to set to 1
      const response = await axiosPrivate.patch(
        `/post/post/${id}/reply-count`,
        {
          reply_count: 1,
        }
      );
      return response.data;
    }
  },
  lastReplyBy: async (id: string, data: { last_reply_by: string }) => {
    const response = await axiosPrivate.patch(
      `/post/post/${id}/last-reply-by`,
      data
    );
    return response.data;
  },
  // replies operations
  getPostReplies: async (post_id: string) => {
    const response = await axiosPrivate.get(`/post/replies/post/${post_id}`);
    return response.data;
  },
  createPostReply: async (replyData: any) => {
    const response = await axiosPrivate.post(`/post/reply`, replyData);
    return response.data;
  },
  updatePostReply: async (id: string, replyData: any) => {
    const response = await axiosPrivate.put(`/post/reply/${id}`, replyData);
    return response.data;
  },
  deletePostReply: async (id: string) => {
    const response = await axiosPrivate.delete(`/post/reply/${id}`);
    return response.data;
  },
  getPostRepliesBySeller: async (seller_id: string) => {
    const response = await axiosPrivate.get(`/post/replies/seller/${seller_id}`);
    return response.data;
  },

  // test drive slot operations
  getTestDriveSlotsBySeller: async (sellerId: string) => {
    const response = await axiosPrivate.get(
      `/test-drive/slots/seller/${sellerId}`
    );
    return response.data;
  },
  createTestDriveSlot: async (slotData: any) => {
    const response = await axiosPrivate.post(`/test-drive/slots`, slotData);
    return response.data;
  },
  updateTestDriveSlot: async (slotId: string, slotData: any) => {
    const response = await axiosPrivate.put(
      `/test-drive/slots/${slotId}`,
      slotData
    );
    return response.data;
  },
  deleteTestDriveSlot: async (slotId: string) => {
    const response = await axiosPrivate.delete(`/test-drive/slots/${slotId}`);
    return response.data;
  },
  getAllEvModels: async () => {
    const response = await axiosPrivate.get("/ev/models");
    return response.data;
  },
  updateSellerProfile: async (
    sellerId: string,
    profileData: FormData | any
  ) => {
    const response = await axiosPrivate.put(
      `/seller/${sellerId}`,
      profileData,
      {
        headers: {
          "Content-Type":
            profileData instanceof FormData
              ? "multipart/form-data"
              : "application/json",
        },
      }
    );
    return response.data;
  },
  // Repair location operations
  getRepairLocationsBySeller: async (sellerId: string) => {
    const response = await axiosPrivate.get(
      `/repair-location/seller/${sellerId}`
    );
    return response.data;
  },
  createRepairLocation: async (locationData: { seller_id: string }) => {
    const response = await axiosPrivate.post(`/repair-location`, locationData);
    return response.data;
  },
  updateRepairLocation: async ({
    locationId,
    locationData,
  }: {
    locationId: string;
    locationData: any;
  }) => {
    const response = await axiosPrivate.put(
      `/repair-location/${locationId}`,
      locationData
    );
    return response.data;
  },
  deleteRepairLocation: async ({ locationId }: { locationId: string }) => {
    const response = await axiosPrivate.delete(
      `/repair-location/${locationId}`
    );
    return response.data;
  },
  // Order operations
  getSellerOrders: async (sellerId: string) => {
    const response = await axiosPrivate.get(`/order/seller/${sellerId}`);
    return response.data;
  },
};
