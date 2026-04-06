import * as queryKeys from "@/lib/query/keys";

import { ID, Permission, Role } from "appwrite";
import { databaseId, tableIds } from "@/lib/appwrite/const";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Products } from "@/lib/appwrite/types";
import { addToast } from "@heroui/react";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";

interface AddToWishlistProps {
  product?: Products;
  name?: string;
  onSuccess?(): void;
}

export const useAddToWishlist = ({
  product,
  name,
  onSuccess,
}: AddToWishlistProps) => {
  const { tables } = useAppwrite();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      props?: Pick<AddToWishlistProps, "name" | "product">,
    ) => {
      if (!user?.$id) throw new Error("User not authenticated");

      return await tables.createRow({
        databaseId,
        tableId: tableIds.wishlist,
        rowId: ID.unique(),
        data: {
          product: product?.$id || null,
          name: name || null,
          userId: user.$id,
        },
        permissions: [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products() });
      addToast({
        title: "Added to Wishlist",
        description: `${product?.name || name} is now on your list.`,
        color: "success",
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error(error);
      addToast({
        title: "Error",
        description: "Could not add to wishlist. Try again later.",
        color: "danger",
      });
    },
  });
};
