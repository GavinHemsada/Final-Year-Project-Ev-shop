import { axiosPrivate } from "@/config/config";

export const financialService = {
  // Financial Institution Operations
  getFinancialInstitutionProfile: async (userId: string) => {
    // Get all institutions and find the one matching user_id
    const response = await axiosPrivate.get(`/financial/institutions/user/${userId}`);
    return response.data;
  },
  getFinancialInstitutionById: async (institutionId: string) => {
    const response = await axiosPrivate.get(`/financial/institutions/${institutionId}`);
    return response.data;
  },
  updateFinancialInstitution: async (institutionId: string, data: any) => {
    const response = await axiosPrivate.put(`/financial/institutions/${institutionId}`, data);
    return response.data;
  },

  // Financial Product Operations
  getProductsByInstitution: async (institutionId: string) => {
    const response = await axiosPrivate.get(`/financial/products/institution/${institutionId}`);
    return response.data;
  },
  createProduct: async (productData: any) => {
    const response = await axiosPrivate.post(`/financial/products`, productData);
    return response.data;
  },
  updateProduct: async (productId: string, productData: any) => {
    const response = await axiosPrivate.put(`/financial/products/${productId}`, productData);
    return response.data;
  },
  deleteProduct: async (productId: string) => {
    const response = await axiosPrivate.delete(`/financial/products/${productId}`);
    return response.data;
  },
  getProductById: async (productId: string) => {
    const response = await axiosPrivate.get(`/financial/products/${productId}`);
    return response.data;
  },

  // Financing Application Operations
  getApplicationsByInstitution: async (institutionId: string) => {
    // Get all products for this institution, then get applications for each product
    // For now, we'll get all applications and filter by product's institution_id
    // TODO: Add backend route /financial/applications/institution/:institutionId
    const productsResponse = await axiosPrivate.get(`/financial/products/institution/${institutionId}`);
    const products = productsResponse.data?.products || [];
    const productIds = products.map((p: any) => p._id);
    
    // Get applications for each product
    const allApplications: any[] = [];
    for (const productId of productIds) {
      try {
        const appResponse = await axiosPrivate.get(`/financial/applications/product/${productId}`);
        const apps = appResponse.data?.applications || [];
        allApplications.push(...apps);
      } catch (error) {
        console.error(`Failed to get applications for product ${productId}:`, error);
      }
    }
    
    return { success: true, applications: allApplications };
  },
  getApplicationById: async (applicationId: string) => {
    const response = await axiosPrivate.get(`/financial/applications/${applicationId}`);
    return response.data;
  },
  updateApplicationStatus: async (applicationId: string, status: string) => {
    const response = await axiosPrivate.patch(`/financial/applications/${applicationId}/status`, { status });
    return response.data;
  },
  updateApplication: async (applicationId: string, applicationData: any) => {
    const response = await axiosPrivate.put(`/financial/applications/${applicationId}`, applicationData);
    return response.data;
  },
  deleteApplication: async (applicationId: string) => {
    const response = await axiosPrivate.delete(`/financial/applications/${applicationId}`);
    return response.data;
  },

  // Community & Post Operations
  getCommunityPosts: async (params: any) => {
    const response = await axiosPrivate.get(`post/posts`, { params });
    return response.data;
  },
  getCommunityPostbyFinancial: async (financialId: string) => {
    const response = await axiosPrivate.get(`/post/posts/financial/${financialId}`);
    return response.data;
  },
  createCommunityPost: async (postData: {
    financial_id: string;
    title: string;
    content: string;
  }) => {
    const response = await axiosPrivate.post(`/post/post`, postData);
    return response.data;
  },
  updateCommunityPost: async (
    postId: string,
    postData: { financial_id: string; title: string; content: string }
  ) => {
    const response = await axiosPrivate.put(`/post/post/${postId}`, postData);
    return response.data;
  },
  deleteCommunityPost: async (postId: string) => {
    const response = await axiosPrivate.delete(`/post/post/${postId}`);
    return response.data;
  },
  getPostReplies: async (postId: string) => {
    const response = await axiosPrivate.get(`/post/replies/post/${postId}`);
    return response.data;
  },
  createPostReply: async (replyData: {
    financial_id: string;
    post_id: string;
    content: string;
  }) => {
    const response = await axiosPrivate.post(`/post/reply`, replyData);
    return response.data;
  },
  updatePostReply: async (replyId: string, replyData: { content: string }) => {
    const response = await axiosPrivate.put(`/post/reply/${replyId}`, replyData);
    return response.data;
  },
  deletePostReply: async (replyId: string) => {
    const response = await axiosPrivate.delete(`/post/reply/${replyId}`);
    return response.data;
  },
  postView: async (postId: string) => {
    const response = await axiosPrivate.patch(`/post/post/${postId}/views`);
    return response.data;
  },
};