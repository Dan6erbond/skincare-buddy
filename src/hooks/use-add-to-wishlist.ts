import * as queryKeys from "@/lib/query/keys";

import { ID, Permission, Role } from "appwrite";
import { databaseId, tableIds } from "@/lib/appwrite/const";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Products } from "@/lib/appwrite/appwrite";
import { addToast } from "@heroui/react";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";

export const useAddToWishlist = ({
  product,
  onSuccess,
}: {
  product?: Products;
  onSuccess?(): void;
}) => {
  const { tables } = useAppwrite();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await tables.createRow({
        databaseId,
        tableId: tableIds.wishlist,
        rowId: ID.unique(),
        data: {
          product: product!.$id, // Linking the product ID
          userId: user!.$id,
        },
        permissions: [
          Permission.read(Role.user(user!.$id)),
          Permission.update(Role.user(user!.$id)),
          Permission.delete(Role.user(user!.$id)),
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist() });
      addToast({
        title: "Added to Wishlist",
        description: `${product!.name} is now on your shopping list.`,
        color: "success",
      });
      onSuccess?.();
    },
    onError: () => {
      addToast({
        title: "Error",
        description: "Could not add to wishlist. Try again later.",
        color: "danger",
      });
    },
  });
};
