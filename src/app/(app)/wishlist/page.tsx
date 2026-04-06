"use client";

import * as queryKeys from "@/lib/query/keys";

import { Card, CardBody, Chip, Skeleton, Spinner } from "@heroui/react";
import { databaseId, tableIds } from "@/lib/appwrite/const";

import { CreateWishlistItemDrawer } from "@/components/wishlist/create-drawer";
import { Heart } from "lucide-react";
import { Query } from "appwrite";
import { Rating } from "@/components/ui/rating";
import { Ref } from "react";
import { WishlistProducts } from "@/lib/appwrite/types";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { useRemoveFromWishlist } from "@/hooks/use-remove-from-wishlist";

export default function Page() {
  const { user } = useAuth();
  const { tables } = useAppwrite();
  const limit = 12;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: queryKeys.wishlist({ isDeleted: false }),
      queryFn: async ({ pageParam }) => {
        const queries = [
          Query.equal("userId", user!.$id),
          Query.isNull("deletedAt"),
          Query.select(["*", "product.*"]),
          Query.orderDesc("$createdAt"),
          Query.limit(limit),
        ];

        if (pageParam) queries.push(Query.cursorAfter(pageParam));

        return await tables.listRows<WishlistProducts>({
          databaseId,
          tableId: tableIds.wishlist,
          queries,
        });
      },
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => {
        if (lastPage.rows.length < limit) return undefined;
        return lastPage.rows[lastPage.rows.length - 1].$id;
      },
      enabled: !!user?.$id,
    });

  const items = data?.pages.flatMap((p) => p.rows) ?? [];

  const [loaderRef, scrollerRef] = useInfiniteScroll({
    hasMore: hasNextPage,
    onLoadMore: fetchNextPage,
  });

  const { mutate: removeFromWishlist } = useRemoveFromWishlist();

  return (
    <main className="flex flex-col gap-8 p-4 md:p-8 container mx-auto w-full">
      <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-2">
            Wishlist <Heart className="text-primary fill-primary" />
          </h1>
          <p className="text-default-500 italic">Welcome back, {user?.name}</p>
        </div>
        <CreateWishlistItemDrawer />
      </header>

      <div
        ref={scrollerRef as Ref<HTMLDivElement>}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[calc(100vh-200px)] p-1"
      >
        {items.map((item) => (
          <Card
            key={item.$id}
            isPressable
            shadow="sm"
            onPress={() => removeFromWishlist(item)}
            className="border-1 border-default-200 hover:border-danger transition-colors group"
          >
            <CardBody className="p-4 flex flex-row items-center justify-between">
              <div className="flex flex-col gap-1 overflow-hidden">
                <span className="text-tiny font-bold text-danger uppercase truncate">
                  {item.product?.brand ?? "Custom Item"}
                </span>
                <h3 className="text-lg font-black leading-tight truncate">
                  {item.product?.name ?? item.name}
                </h3>
                <div className="flex gap-2 mt-1">
                  <Chip
                    size="sm"
                    variant="flat"
                    className="text-[10px] uppercase font-bold"
                  >
                    {item.product?.category ?? "Untracked"}
                  </Chip>
                  {item.product?.rating && (
                    <Rating value={item.product.rating} />
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}

        {(isLoading || isFetchingNextPage) &&
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}

        {hasNextPage && (
          <div
            ref={loaderRef as Ref<HTMLDivElement>}
            className="col-span-full flex justify-center p-4"
          >
            <Spinner />
          </div>
        )}
      </div>

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-default-50 rounded-3xl border-2 border-dashed border-default-200">
          <Heart size={48} className="text-default-300 mb-4" />
          <p className="text-default-500 font-bold uppercase tracking-widest">
            Your wishlist is empty
          </p>
        </div>
      )}
    </main>
  );
}
