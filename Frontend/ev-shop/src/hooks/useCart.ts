import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buyerService } from "@/features/buyer/buyerService";
import { queryKeys } from "@/config/queryKeys";

interface CartItem {
  _id: string;
  listing_id: any;
  quantity: number;
}

interface Cart {
  _id: string;
  user_id: string;
  items: CartItem[];
}

/**
 * Hook to fetch user's cart
 */
export const useCart = (userId: string | null) => {
  return useQuery<Cart>({
    queryKey: queryKeys.cart(userId || ""),
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      const response = await buyerService.getUserCart(userId);
      // handleResult unwraps the response
      if (response && response.items) {
        return response;
      } else if (Array.isArray(response)) {
        return { items: response } as Cart;
      }
      return { _id: "", user_id: userId, items: [] } as Cart;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds - cart can change frequently
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Refetch when component mounts
  });
};

/**
 * Hook to get cart item count
 */
export const useCartCount = (userId: string | null) => {
  const { data: cart } = useCart(userId);
  return cart?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
};

/**
 * Hook to add item to cart
 */
export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      listingId,
      quantity = 1,
    }: {
      userId: string;
      listingId: string;
      quantity?: number;
    }) => {
      // handleResult unwraps { success: true, item: {...} } to just return the item object
      // On error, it returns { message: "error message" }
      const response = await buyerService.addToCart(userId, listingId, quantity);
      
      // If response has a message property and no _id (meaning it's an error, not an item)
      if (response && typeof response === 'object' && 'message' in response && !('_id' in response)) {
        throw new Error(response.message as string);
      }
      
      // Return the item object
      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch cart
      queryClient.invalidateQueries({
        queryKey: queryKeys.cart(variables.userId),
      });
    },
    onError: (error) => {
      console.error("Add to cart error:", error);
    },
  });
};

/**
 * Hook to remove item from cart
 */
export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      userId,
    }: {
      itemId: string;
      userId: string;
    }) => {
      return await buyerService.removeCartItem(itemId);
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch cart
      queryClient.invalidateQueries({
        queryKey: queryKeys.cart(variables.userId),
      });
    },
  });
};

/**
 * Hook to update cart item quantity
 */
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      quantity,
      userId,
    }: {
      itemId: string;
      quantity: number;
      userId: string;
    }) => {
      return await buyerService.updateCartItem(itemId, quantity);
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch cart
      queryClient.invalidateQueries({
        queryKey: queryKeys.cart(variables.userId),
      });
    },
  });
};

/**
 * Hook to clear cart
 */
export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return await buyerService.clearCart(userId);
    },
    onSuccess: (_, userId) => {
      // Invalidate and refetch cart
      queryClient.invalidateQueries({
        queryKey: queryKeys.cart(userId),
      });
    },
  });
};

