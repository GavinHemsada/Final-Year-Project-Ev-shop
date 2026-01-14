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
  // Financial Products Management
  getAllFinancialProducts: async () => {
    const response = await axiosPrivate.get("/financial/products");
    return response.data?.products || response.data || [];
  },
  createFinancialProduct: async (productData: any) => {
    const response = await axiosPrivate.post("/financial/products", productData);
    return response.data;
  },
  updateFinancialProduct: async (productId: string, productData: any) => {
    const response = await axiosPrivate.put(`/financial/products/${productId}`, productData);
    return response.data;
  },
  deleteFinancialProduct: async (productId: string) => {
    const response = await axiosPrivate.delete(`/financial/products/${productId}`);
    return response.data;
  },
  // Financial Applications Management
  getAllFinancialApplications: async () => {
    try {
      // Try to get all applications - if endpoint doesn't exist, fetch via products
      const response = await axiosPrivate.get("/financial/applications");
      return response.data?.applications || response.data || [];
    } catch (error: any) {
      // Fallback: Get all products and their applications
      if (error.response?.status === 404) {
        try {
          const productsResponse = await axiosPrivate.get("/financial/products");
          const products = productsResponse.data?.products || productsResponse.data || [];
          const allApplications: any[] = [];
          
          for (const product of products) {
            try {
              const appResponse = await axiosPrivate.get(`/financial/applications/product/${product._id}`);
              const apps = appResponse.data?.applications || appResponse.data || [];
              allApplications.push(...apps);
            } catch (err) {
              console.error(`Failed to get applications for product ${product._id}:`, err);
            }
          }
          return allApplications;
        } catch (fallbackError) {
          console.error("Failed to fetch applications via fallback:", fallbackError);
          return [];
        }
      }
      throw error;
    }
  },
  updateFinancialApplicationStatus: async (applicationId: string, status: string, rejectionReason?: string) => {
    const response = await axiosPrivate.patch(`/financial/applications/${applicationId}/status`, {
      status,
      rejection_reason: rejectionReason
    });
    return response.data;
  },
  deleteFinancialApplication: async (applicationId: string) => {
    const response = await axiosPrivate.delete(`/financial/applications/${applicationId}`);
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
    // Set a high limit to get all posts (or remove limit to get all)
    queryParams.append("limit", "1000");
    queryParams.append("page", "1");
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
  getAllComplaints: async (userType?: string) => {
    const params = userType ? { user_type: userType } : {};
    const response = await axiosPrivate.get("/complaint", { params });
    // Backend returns the complaints array directly (not wrapped)
    // Check if response.data is an array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // Fallback: check if it's wrapped in { success: true, complaints: [...] }
    if (response.data?.success && Array.isArray(response.data?.complaints)) {
      return response.data.complaints;
    }
    // Return empty array if no valid data found
    return [];
  },
  deleteComplaint: async (id: string) => {
    const response = await axiosPrivate.delete(`/complaint/${id}`);
    return response.data;
  },
  resolveComplaint: async (id: string) => {
    const response = await axiosPrivate.put(`/complaint/${id}`, { status: "Resolved" });
    return response.data;
  },

  // Contact Message Management
  getAllContactMessages: async (isRead?: boolean) => {
    const params = isRead !== undefined ? { isRead: isRead.toString() } : {};
    const response = await axiosPrivate.get("/contact-message", { params });
    // Backend returns the contact messages array directly (not wrapped)
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // Fallback: check if it's wrapped in { success: true, contactMessages: [...] }
    if (response.data?.success && Array.isArray(response.data?.contactMessages)) {
      return response.data.contactMessages;
    }
    return [];
  },
  getContactMessageStats: async () => {
    const response = await axiosPrivate.get("/contact-message/stats");
    return response.data?.stats || response.data;
  },
  getContactMessageById: async (id: string) => {
    const response = await axiosPrivate.get(`/contact-message/${id}`);
    return response.data;
  },
  updateContactMessage: async (id: string, data: { isRead?: boolean; isReplied?: boolean }) => {
    const response = await axiosPrivate.put(`/contact-message/${id}`, data);
    return response.data;
  },
  deleteContactMessage: async (id: string) => {
    const response = await axiosPrivate.delete(`/contact-message/${id}`);
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

