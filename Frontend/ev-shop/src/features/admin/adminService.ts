import { axiosPrivate } from "@/config/config";

export const adminService = {
  // Dashboard Statistics
  getDashboardStats: async () => {
    const response = await axiosPrivate.get("/admin/dashboard/stats");
    return response.data;
  },

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
    const response = await axiosPrivate.get("/financial");
    return response.data;
  },
  getFinancialById: async (financialId: string) => {
    const response = await axiosPrivate.get(`/financial/${financialId}`);
    return response.data;
  },
  updateFinancial: async (financialId: string, financialData: any) => {
    const response = await axiosPrivate.put(
      `/financial/${financialId}`,
      financialData
    );
    return response.data;
  },
  deleteFinancial: async (financialId: string) => {
    const response = await axiosPrivate.delete(`/financial/${financialId}`);
    return response.data;
  },

  // Reviews Management
  getAllReviews: async () => {
    const response = await axiosPrivate.get("/review");
    return response.data;
  },
  getReviewById: async (reviewId: string) => {
    const response = await axiosPrivate.get(`/review/${reviewId}`);
    return response.data;
  },
  deleteReview: async (reviewId: string) => {
    const response = await axiosPrivate.delete(`/review/${reviewId}`);
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

  // Analytics
  getRevenueAnalytics: async (period: string = "monthly") => {
    const response = await axiosPrivate.get(
      `/admin/analytics/revenue?period=${period}`
    );
    return response.data;
  },
  getUserAnalytics: async () => {
    const response = await axiosPrivate.get("/admin/analytics/users");
    return response.data;
  },
  getOrderAnalytics: async () => {
    const response = await axiosPrivate.get("/admin/analytics/orders");
    return response.data;
  },
};

