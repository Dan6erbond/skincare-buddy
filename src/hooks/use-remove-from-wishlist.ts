import * as queryKeys from "@/lib/query/keys";

import { databaseId, tableIds } from "@/lib/appwrite/const";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { WishlistProducts } from "@/lib/appwrite/types";
import { addToast } from "@heroui/react";
import { useAppwrite } from "@/contexts/appwrite";

interface UseRemoveFromWishlistProps {
  wishlistItem?: WishlistProducts;
  onSuccess?: () => void;
}

export function useRemoveFromWishlist({
  wishlistItem,
  onSuccess,
}: UseRemoveFromWishlistProps = {}) {
  const { tables } = useAppwrite();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wishlistItem1?: WishlistProducts) => {
      const item = (wishlistItem ?? wishlistItem1)!;

      // If it has a linked product, hard delete.
      // If it's a custom item (has a name), soft delete.
      if (item.product?.$id) {
        return await tables.deleteRow({
          databaseId,
          tableId: tableIds.wishlist,
          rowId: item.$id,
        });
      }

      return await tables.updateRow({
        databaseId,
        tableId: tableIds.wishlist,
        rowId: item.$id,
        data: {
          deletedAt: new Date().toISOString(),
        },
      });
    },
    onSuccess: (_, wishlistItem1) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products() });

      const item = (wishlistItem ?? wishlistItem1)!;

      addToast({
        title: "Removed from Wishlist",
        description: item.product.$id
          ? `${item.product.name} has been removed.`
          : "Moved to history",
        color: "success",
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error(error);
      addToast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        color: "danger",
      });
    },
  });
}
