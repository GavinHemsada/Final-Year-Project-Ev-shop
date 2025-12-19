import { axiosPrivate } from "@/config/config";

export const adminService = {
  // Statistics (Aggregated Client-Side)
  // We will fetch lists and count them in the component since /admin/dashboard/stats doesn't exist

  // User Management
  getAllUsers: async () => {
    const response = await axiosPrivate.get("/user");
    return response.data;
  },
  getUserById: async (userId: string) => {
    const response = await axiosPrivate.get(`/user/${userId}`);
    return response.data;
  },
  updateUser: async (userId: string, userData: any) => {
    const response = await axiosPrivate.put(`/user/${userId}`, userData);
    return response.data;
  },
  deleteUser: async (userId: string) => {
    const response = await axiosPrivate.delete(`/user/${userId}`);
    return response.data;
  },

  // Order Management
  getAllOrders: async () => {
    const response = await axiosPrivate.get("/order");
    return response.data;
  },
  getOrderById: async (orderId: string) => {
    const response = await axiosPrivate.get(`/order/${orderId}`);
    return response.data;
  },
  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await axiosPrivate.put(`/order/${orderId}`, {
      order_status: status,
    });
    return response.data;
  },

  // EV Listings Management
  getAllListings: async () => {
    const response = await axiosPrivate.get("/ev/listings");
    return response.data;
  },
  getListingById: async (listingId: string) => {
    const response = await axiosPrivate.get(`/ev/listings/${listingId}`);
    return response.data;
  },
  deleteListing: async (listingId: string) => {
    const response = await axiosPrivate.delete(`/ev/listings/${listingId}`);
    return response.data;
  },
  updateListing: async (listingId: string, listingData: any) => {
    const response = await axiosPrivate.put(
      `/ev/listings/${listingId}`,
      listingData
    );
    return response.data;
  },

  // Seller Management
  getAllSellers: async () => {
    const response = await axiosPrivate.get("/seller");
    return response.data;
  },
  getSellerById: async (sellerId: string) => {
    const response = await axiosPrivate.get(`/seller/${sellerId}`);
    return response.data;
  },
  updateSeller: async (sellerId: string, sellerData: any) => {
    const response = await axiosPrivate.put(`/seller/${sellerId}`, sellerData);
    return response.data;
  },
  deleteSeller: async (sellerId: string) => {
    const response = await axiosPrivate.delete(`/seller/${sellerId}`);
    return response.data;
  },

  // Financial Institution Management
  getAllFinancialInstitutions: async () => {
    const response = await axiosPrivate.get("/financial/institutions"); // Corrected endpoint
    return response.data;
  },
  getFinancialById: async (financialId: string) => {
    const response = await axiosPrivate.get(`/financial/institutions/${financialId}`);
    return response.data;
  },
  updateFinancial: async (financialId: string, financialData: any) => {
    const response = await axiosPrivate.put(
      `/financial/institutions/${financialId}`,
      financialData
    );
    return response.data;
  },
  deleteFinancial: async (financialId: string) => {
    const response = await axiosPrivate.delete(`/financial/institutions/${financialId}`);
    return response.data;
  },

  // Reviews Management
  getAllReviews: async () => {
    const response = await axiosPrivate.get("/review/reviews"); // Corrected endpoint
    return response.data;
  },
  getReviewById: async (reviewId: string) => {
    const response = await axiosPrivate.get(`/review/review/${reviewId}`);
    return response.data;
  },
  deleteReview: async (reviewId: string) => {
    const response = await axiosPrivate.delete(`/review/review/${reviewId}`);
    return response.data;
  },

  // Payment Management
  getAllPayments: async () => {
    const response = await axiosPrivate.get("/payment");
    return response.data;
  },
  getPaymentById: async (paymentId: string) => {
    const response = await axiosPrivate.get(`/payment/${paymentId}`);
    return response.data;
  },

  // Community Management
  getAllCommunityPosts: async (params?: { search?: string }) => {
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
  deleteCommunityPost: async (id: string) => {
    const response = await axiosPrivate.delete(`/post/post/${id}`);
    return response.data;
  },
  getPostReplies: async (postId: string) => {
    const response = await axiosPrivate.get(`/post/replies/post/${postId}`);
    return response.data;
  },
  deletePostReply: async (id: string) => {
    const response = await axiosPrivate.delete(`/post/reply/${id}`);
    return response.data;
  },

  // User Complaint Management
  getAllComplaints: async () => {
    // Assuming backend endpoint /admin/complaints exists or using mock for now if 404
    try {
      const response = await axiosPrivate.get("/admin/complaints");
      return response.data;
    } catch (error) {
      console.warn("Backend endpoint /admin/complaints not found, returning empty list/mock.");
      // Return mock data if backend not implemented
      return []; 
    }
  },
  deleteComplaint: async (id: string) => {
    const response = await axiosPrivate.delete(`/admin/complaint/${id}`);
    return response.data;
  },
  resolveComplaint: async (id: string) => {
    const response = await axiosPrivate.put(`/admin/complaint/${id}/resolve`);
    return response.data;
  },

  // Test Drive Management
  getAllTestDriveBookings: async () => {
    try {
      const response = await axiosPrivate.get("/test-drive/bookings");
      return response.data?.bookings || response.data;
    } catch (error) {
       console.error("Failed to fetch bookings", error);
       return [];
    }
  },
  getAllTestDriveSlots: async () => {
     try {
      const response = await axiosPrivate.get("/test-drive/slots");
      return response.data?.slots || response.data;
    } catch (error) {
       console.error("Failed to fetch slots", error);
       return [];
    }
  },
  cancelTestDriveBooking: async (id: string) => {
    // Admin force cancel
    const response = await axiosPrivate.put(`/admin/test-drives/booking/${id}/cancel`);
    return response.data;
  },
  deleteTestDriveSlot: async (id: string) => {
    const response = await axiosPrivate.delete(`/admin/test-drives/slot/${id}`);
    return response.data;
  },

  // Analytics (Mocked or Client-Side Aggregation mostly)
  // We keep these signatures but they might fail if endpoints don't exist.
  // For now, we will rely on getAllOrders/Users in the components.
  // ML Testing
  testBatteryHealth: async (data: any) => {
    try {
      const response = await axiosPrivate.post("/ml-test/battery-health", data);
      return response.data;
    } catch (error) {
      console.error("Error testing battery health:", error);
      throw error;
    }
  },

  testRepairCost: async (data: any) => {
    try {
      const response = await axiosPrivate.post("/ml-test/repair-cost", data);
      return response.data;
    } catch (error) {
      console.error("Error testing repair cost:", error);
      throw error;
    }
  },
};

