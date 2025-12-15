import { axiosPrivate } from "@/config/config";

export const buyerService = {
  // user profile operations
  updateUserProfile: async (id: string, formdata: FormData) => {
    const response = await axiosPrivate.put(`/user/${id}`, formdata);
    return response.data;
  },
  getUserProfile: async (id: string) => {
    const response = await axiosPrivate.get(`/user/${id}`);
    return response.data;
  },

  // cart operations
  addToCart: async (
    userId: string,
    listingId: string,
    quantity: number = 1
  ) => {
    const response = await axiosPrivate.post(`/cart/items`, {
      user_id: userId,
      listing_id: listingId,
      quantity,
    });
    return response.data;
  },
  getUserCart: async (userId: string) => {
    const response = await axiosPrivate.get(`/cart/${userId}`);
    return response.data;
  },
  updateCartItem: async (itemId: string, quantity: number) => {
    const response = await axiosPrivate.put(`/cart/items/${itemId}`, {
      quantity,
    });
    return response.data; 
  },
  removeCartItem: async (itemId: string) => {
    const response = await axiosPrivate.delete(`/cart/items/${itemId}`);
    return response.data;
  },
  clearCart: async (userId: string) => {
    const response = await axiosPrivate.delete(`/cart/${userId}`);
    return response.data;
  },

  // orders operations
  placeOrder: async (orderData: any) => {
    const response = await axiosPrivate.post(`/order`, orderData);
    return response.data;
  },
  getUserOrders: async (userId: string) => {
    const response = await axiosPrivate.get(`/order/user/${userId}`);
    return response.data;
  },
  cancelOrder: async (id: string) => {
    const response = await axiosPrivate.delete(`/order/${id}/cancel`);
    return response.data;
  },

  // payment operations
  createPayment: async (paymentData: {
    order_id: string;
    payment_type: string;
    amount: number;
    returnUrl: string;
    cancelUrl: string;
    tax_amount?: number;
  }) => {
    const response = await axiosPrivate.post(`/payment`, paymentData);
    return response.data;
  },
  getPaymentByOrderId: async (orderId: string) => {
    const response = await axiosPrivate.get(`/payment/order/${orderId}`);
    return response.data;
  },
  getPaymentStatus: async (paymentId: string) => {
    const response = await axiosPrivate.get(
      `/payment/payment-status/${paymentId}`
    );
    return response.data;
  },

  // ev list operations
  getEVList: async () => {
    const response = await axiosPrivate.get(`/ev/listings`);
    return response.data;
  },
  getVehicleById: async (id: string) => {
    const response = await axiosPrivate.get(`/ev/listings/${id}`);
    return response.data;
  },
  becomeaSeller: async (sellerData: any) => {
    const response = await axiosPrivate.post(`/seller`, sellerData);
    return response.data;
  },

  // chatbot operations
  sendMessageToChatbot: async (question: string) => {
    const response = await axiosPrivate.post(`/chatbot/ask`, { question });
    return response.data;
  },

  // financing operations
  getFinancingTypes: async () => {
    const response = await axiosPrivate.get(`/financial/institutions`);
    return response.data;
  },
  getFinancingOptions: async () => {
    const response = await axiosPrivate.get(`/financial/products`);
    return response.data;
  },
  getUserFinancingApplications: async (userId: string) => {
    const response = await axiosPrivate.get(
      `/financial/applications/user/${userId}`
    );
    return response.data;
  },
  submitFinancingApplication: async (applicationData: any) => {
    const response = await axiosPrivate.post(
      `/financial/applications`,
      applicationData
    );
    return response.data;
  },
  updateFinancingApplication: async (id: string, applicationData: any) => {
    const response = await axiosPrivate.put(
      `/financial/applications/${id}`,
      applicationData
    );
    return response.data;
  },
  deleteFinancingApplication: async (id: string) => {
    const response = await axiosPrivate.delete(`/financial/applications/${id}`);
    return response.data;
  },
  becomeaFinancing: async (financingData: any) => {
    const response = await axiosPrivate.post(
      `/financial/institutions`,
      financingData
    );
    return response.data;
  },

  // services operations
  getAvailableServices: async () => {
    const response = await axiosPrivate.get(`/maintenance-records`);
    return response.data;
  },
  // repair locations operations
  getAllRepairLocations: async () => {
    const response = await axiosPrivate.get(`/repair-location/active`);
    return response.data;
  },

  // notifications operations
  getUserNotifications: async (userId: string) => {
    const response = await axiosPrivate.get(`/notification/user/${userId}`);
    return response.data;
  },
  markNotificationAsRead: async (id: string) => {
    const response = await axiosPrivate.patch(`/notification/${id}/read`);
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
  getCommunityPostbyUser: async (user_id: string) => {
    const response = await axiosPrivate.get(`/post/posts/user/${user_id}`);
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
  getPostRepliesByUser: async (user_id: string) => {
    const response = await axiosPrivate.get(`/post/replies/user/${user_id}`);
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

  // test drive operations
  getTestDriveSlots: async () => {
    const response = await axiosPrivate.get(`/test-drive/slots/active`);
    return response.data;
  },
  getTestDriveByCustomer: async (customerId: string) => {
    const response = await axiosPrivate.get(
      `/test-drive/bookings/customer/${customerId}`
    );
    return response.data;
  },
  scheduleTestDrive: async (testDriveData: any) => {
    const response = await axiosPrivate.post(
      `/test-drive/bookings`,
      testDriveData
    );
    return response.data;
  },
  updateTestDrive: async (id: string, testDriveData: any) => {
    const response = await axiosPrivate.put(
      `/test-drive/bookings/${id}`,
      testDriveData
    );
    return response.data;
  },
  cancelTestDrive: async (id: string) => {
    const response = await axiosPrivate.delete(`/test-drive/bookings/${id}`);
    return response.data;
  },
  rateTestDrive: async (ratingData: any) => {
    const response = await axiosPrivate.post(`/test-drive/ratings`, ratingData);
    return response.data;
  },
  updateTestDriveRating: async (id: string, ratingData: any) => {
    const response = await axiosPrivate.put(
      `/test-drive/ratings${id}`,
      ratingData
    );
    return response.data;
  },
  deleteTestDriveRating: async (id: string) => {
    const response = await axiosPrivate.delete(`/test-drive/ratings${id}`);
    return response.data;
  },

  // reviews operations
  getUserReviews: async (reviewerId: string) => {
    const response = await axiosPrivate.get(
      `/review/reviews/reviewer/${reviewerId}`
    );
    return response.data;
  },
  createReview: async (reviewData: any) => {
    const response = await axiosPrivate.post(`/review/review`, reviewData);
    return response.data;
  },
  updateReview: async (id: string, reviewData: any) => {
    const response = await axiosPrivate.put(`/review/review/${id}`, reviewData);
    return response.data;
  },
  deleteReview: async (id: string) => {
    const response = await axiosPrivate.delete(`/review/review/${id}`);
    return response.data;
  },

  // saved vehicles operations
  getSavedVehicles: async (userId: string) => {
    const response = await axiosPrivate.get(`/saved-vehicle/${userId}`);
    return response.data;
  },
  saveVehicle: async (userId: string, listingId: string) => {
    const response = await axiosPrivate.post(`/saved-vehicle`, {
      user_id: userId,
      listing_id: listingId,
    });
    return response.data;
  },
  removeSavedVehicle: async (userId: string, listingId: string) => {
    const response = await axiosPrivate.delete(
      `/saved-vehicle/${userId}/${listingId}`
    );
    return response.data;
  },
  checkIfVehicleSaved: async (userId: string, listingId: string) => {
    const response = await axiosPrivate.get(
      `/saved-vehicle/${userId}/${listingId}/check`
    );
    return response.data;
  },
};
