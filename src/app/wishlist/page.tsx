"use client";

import * as queryKeys from "@/lib/query/keys";

import { Beaker, Heart } from "lucide-react";
import { Card, CardBody, Chip, Skeleton, addToast } from "@heroui/react";
import { databaseId, tableIds } from "@/lib/appwrite/const";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CreateProductModal } from "@/components/product/create-modal";
import { Query } from "appwrite";
import { Rating } from "@/components/ui/rating";
import { WishlistProducts } from "@/lib/appwrite/appwrite";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";

export default function Page() {
  const { user } = useAuth();
  const { tables } = useAppwrite();
  const queryClient = useQueryClient();

  const { data: wishlist = [], isLoading: loadingWishlist } = useQuery({
    queryKey: queryKeys.wishlist(),
    queryFn: async () => {
      const res = await tables.listRows<WishlistProducts>({
        databaseId,
        tableId: tableIds.wishlist,
        queries: [
          Query.equal("userId", user!.$id),
          Query.select(["*", "product.*"]),
          Query.orderDesc("$updatedAt"),
          Query.orderDesc("$createdAt"),
        ],
      });
      return res.rows;
    },
    enabled: !!user?.$id,
  });

  const { mutate: removeFromWishlist } = useMutation({
    mutationFn: async (wishlistId: string) => {
      return await tables.deleteRow({
        databaseId,
        tableId: tableIds.wishlist,
        rowId: wishlistId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist() });
      addToast({
        title: "Removed",
        description: "Product removed from wishlist.",
        color: "warning",
      });
    },
  });

  return (
    <main className="flex flex-col gap-8 p-4 md:p-8 container mx-auto w-full">
      <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-2">
            My Routines <Beaker className="text-primary" />
          </h1>
          <p className="text-default-500 italic">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-2">
          <CreateProductModal />
        </div>
      </header>

      <div className="py-4">
        {loadingWishlist ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-default-50 rounded-3xl border-2 border-dashed border-default-200">
            <Heart size={48} className="text-default-300 mb-4" />
            <p className="text-default-500 font-bold uppercase tracking-widest">
              Your wishlist is empty
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist.map((item) => (
              <Card
                key={item.$id}
                isPressable
                shadow="sm"
                onPress={() => removeFromWishlist(item.$id)}
                className="border-1 border-default-200 hover:border-danger transition-colors group"
              >
                <CardBody className="p-4 flex flex-row items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-tiny font-bold text-danger uppercase tracking-tighter">
                      {item.product.brand}
                    </span>
                    <h3 className="text-lg font-black leading-tight truncate">
                      {item.product.name}
                    </h3>
                    <div className="flex gap-2 mt-1">
                      <Chip
                        size="sm"
                        variant="flat"
                        className="text-[10px] uppercase font-bold"
                      >
                        {item.product.category}
                      </Chip>
                      {item.product.rating && (
                        <Rating value={item.product.rating ?? 0} />
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
