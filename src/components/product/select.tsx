"use client";

import * as queryKeys from "@/lib/query/keys";

import { Select, SelectItem, SelectProps, User } from "@heroui/react";
import { databaseId, tableIds } from "@/lib/appwrite/const";

import { CollectionElement } from "@react-types/shared";
import { Products } from "@/lib/appwrite/types";
import { Query } from "appwrite";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { useState } from "react";

export default function ProductSelect(props: Omit<SelectProps, "children">) {
  const { tables } = useAppwrite();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const limit = 10;

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: queryKeys.products(),
    queryFn: async ({ pageParam }) => {
      const queries = [
        Query.equal("userId", user!.$id),
        Query.orderAsc("name"),
        Query.orderAsc("brand"),
        Query.limit(limit),
      ];

      // Use the cursor if we have one
      if (pageParam) {
        queries.push(Query.cursorAfter(pageParam));
      }

      return await tables.listRows<Products>({
        databaseId,
        tableId: tableIds.products,
        queries,
      });
    },
    initialPageParam: null as string | null,
    // The last row's $id becomes our cursor for the next fetch
    getNextPageParam: (lastPage) => {
      if (lastPage.rows.length < limit) return undefined;
      return lastPage.rows[lastPage.rows.length - 1].$id;
    },
    enabled: isOpen && !!user?.$id,
  });

  const products = data?.pages.flatMap((p) => p.rows) ?? [];

  const [, scrollerRef] = useInfiniteScroll({
    hasMore: hasNextPage,
    isEnabled: isOpen,
    shouldUseLoader: false,
    onLoadMore: () => {
      if (!isFetching) fetchNextPage();
    },
  });

  return (
    <Select
      label="Products"
      placeholder="Select formulas..."
      isLoading={isFetching}
      scrollRef={scrollerRef}
      items={products}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      {...props}
    >
      {
        ((product: Products) => (
          <SelectItem
            key={product.$id}
            textValue={`${product.brand} ${product.name}`}
          >
            <User
              name={product.name}
              description={product.brand}
              avatarProps={{
                src:
                  (product.catalogProduct?.imageUrl ??
                    product.catalogBrand?.logoUrl) ||
                  undefined,
                radius: "md",
                color: "primary",
                size: "sm",
                className: "shrink-0 rounded-full",
              }}
            />
          </SelectItem>
        )) as (item: object) => CollectionElement<object>
      }
    </Select>
  );
}
