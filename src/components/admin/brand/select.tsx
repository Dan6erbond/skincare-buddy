"use client";

import * as queryKeys from "@/lib/query/keys";

import { Avatar, Select, SelectItem, SelectProps } from "@heroui/react";
import { databaseId, tableIds } from "@/lib/appwrite/const";

import { Brands } from "@/lib/appwrite/types";
import { CollectionElement } from "@react-types/shared";
import { Query } from "appwrite";
import { useAppwrite } from "@/contexts/appwrite";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { useState } from "react";

export default function BrandSelect(props: Omit<SelectProps, "children">) {
  const { tables } = useAppwrite();
  const [isOpen, setIsOpen] = useState(false);

  const limit = 15;

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    // Using base key for infinite scroll as per instructions
    queryKey: queryKeys.adminBrands(),
    queryFn: async ({ pageParam }) => {
      const queries = [Query.orderAsc("name"), Query.limit(limit)];

      if (pageParam) {
        queries.push(Query.cursorAfter(pageParam));
      }

      return await tables.listRows<Brands>({
        databaseId,
        tableId: tableIds.brands,
        queries,
      });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (lastPage.rows.length < limit) return undefined;
      return lastPage.rows[lastPage.rows.length - 1].$id;
    },
    enabled: isOpen,
  });

  const brands = data?.pages.flatMap((p) => p.rows) ?? [];

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
      label="Brand"
      placeholder="Select a manufacturer"
      isLoading={isFetching}
      scrollRef={scrollerRef}
      items={brands}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      {...props}
    >
      {
        ((brand: Brands) => (
          <SelectItem key={brand.$id} textValue={brand.name}>
            <div className="flex items-center gap-3">
              <Avatar
                src={brand.logoUrl || undefined}
                name={brand.name.substring(0, 1)}
                size="sm"
                radius="sm"
                className="w-6 h-6 text-[10px] bg-secondary/10 text-secondary"
                getInitials={(name) => name}
              />
              <span className="text-small">{brand.name}</span>
            </div>
          </SelectItem>
        )) as (item: object) => CollectionElement<object>
      }
    </Select>
  );
}
