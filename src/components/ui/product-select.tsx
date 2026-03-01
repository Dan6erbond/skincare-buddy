import * as queryKeys from "@/lib/query/keys";

import { Select, SelectItem, SelectProps } from "@heroui/react";

import { CollectionElement } from "@react-types/shared";
import { Products } from "@/lib/appwrite/appwrite";
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

  const {
    data: { pages } = {},
    fetchNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: queryKeys.products(),
    queryFn: async ({ pageParam }) => {
      const res = await tables.listRows<Products>({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_PRODUCTS_TABLE_ID!,
        queries: [
          Query.equal("userId", user!.$id),
          Query.orderAsc("name"),
          Query.orderAsc("brand"),
          Query.offset(pageParam * limit),
          Query.limit(limit),
        ],
      });
      return res;
    },
    initialPageParam: 0,
    getNextPageParam: ({ total }, _, lastPage) =>
      lastPage + 1 * limit > total ? lastPage : lastPage + 1,
    enabled: isOpen,
  });

  const products = pages?.flatMap((p) => p.rows) ?? [];

  const hasMore = products.length < (pages?.[0]?.total ?? 0);

  const [, scrollerRef] = useInfiniteScroll({
    hasMore,
    isEnabled: isOpen,
    shouldUseLoader: false,
    onLoadMore: () => {
      console.log("onLoadMore");
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
        ((p: Products) => (
          <SelectItem key={p.$id} textValue={`${p.brand} ${p.name}`}>
            <div className="flex flex-col">
              <span className="text-small font-bold">{p.name}</span>
              <span className="text-tiny text-default-400">{p.brand}</span>
            </div>
          </SelectItem>
        )) as (item: object) => CollectionElement<object>
      }
    </Select>
  );
}
