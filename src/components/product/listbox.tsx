"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  Avatar,
  Chip,
  Input,
  Listbox,
  ListboxItem,
  ListboxProps,
  ScrollShadow,
  Spinner,
} from "@heroui/react";
import { Ref, useMemo } from "react";
import { databaseId, tableIds } from "@/lib/appwrite/const";

import { Products } from "@/lib/appwrite/types";
import { Query } from "appwrite";
import { SearchIcon } from "lucide-react";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { useDebounceValue } from "usehooks-ts";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";

// Omit the props we are managing internally to keep the API clean
export interface ProductListboxProps extends Omit<
  ListboxProps<Products>,
  "children" | "items" | "topContent" | "scrollRef"
> {
  showSearch?: boolean;
}

export default function ProductListbox({
  showSearch = true,
  selectedKeys,
  ...props
}: ProductListboxProps) {
  const { tables } = useAppwrite();
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useDebounceValue("", 300);

  const limit = 3;

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: [...queryKeys.products({ search: searchValue })],
    queryFn: async ({ pageParam }) => {
      const queries = [
        Query.equal("userId", user!.$id),
        Query.orderAsc("name"),
        Query.limit(limit),
      ];

      if (searchValue) {
        queries.push(Query.search("name", searchValue));
      }

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
    getNextPageParam: (lastPage) => {
      if (lastPage.rows.length < limit) return undefined;
      return lastPage.rows[lastPage.rows.length - 1].$id;
    },
    enabled: !!user?.$id,
  });

  const products = useMemo(
    () => data?.pages.flatMap((p) => p.rows) ?? [],
    [data],
  );

  const [loaderRef, scrollerRef] = useInfiniteScroll({
    hasMore: hasNextPage,
    isEnabled: true,
    shouldUseLoader: true,
    onLoadMore: () => {
      if (!isFetching) fetchNextPage();
    },
  });

  const topContent = useMemo(() => {
    const selectedArray = Array.from((selectedKeys as Set<string>) || []);

    return (
      <div className="flex flex-col gap-2 w-full px-2 pt-2">
        {showSearch && (
          <Input
            isClearable
            placeholder="Search products..."
            size="sm"
            startContent={<SearchIcon className="text-default-400" size={16} />}
            onValueChange={setSearchValue}
            onClear={() => setSearchValue("")}
          />
        )}
        {selectedArray.length > 0 && (
          <ScrollShadow
            hideScrollBar
            className="w-full flex py-0.5 gap-1"
            orientation="horizontal"
          >
            {selectedArray.map((id) => {
              const product = products.find((p) => p.$id === id);
              return (
                <Chip key={id} size="sm" variant="flat" className="shrink-0">
                  {product?.name || id}
                </Chip>
              );
            })}
          </ScrollShadow>
        )}
      </div>
    );
  }, [selectedKeys, products, setSearchValue, showSearch]);

  const bottomContent = useMemo(() => {
    if (!hasNextPage) return null;
    return (
      <div
        ref={loaderRef as Ref<HTMLDivElement>}
        className="flex w-full justify-center py-2"
      >
        <Spinner color="primary" size="sm" />
      </div>
    );
  }, [hasNextPage, loaderRef]);

  return (
    <div
      ref={scrollerRef as React.RefObject<HTMLDivElement>}
      className="w-full border-small rounded-small border-default-200 dark:border-default-100 max-h-87.5 overflow-y-auto"
    >
      <Listbox
        aria-label="Product selection"
        items={products}
        selectedKeys={selectedKeys}
        topContent={topContent}
        bottomContent={bottomContent}
        {...props}
      >
        {(item: Products) => (
          <ListboxItem key={item.$id} textValue={item.name}>
            <div className="flex gap-2 items-center">
              <Avatar
                alt={item.name}
                className="shrink-0"
                size="sm"
                radius="md"
                color="primary"
                src={
                  (item.catalogProduct?.imageUrl ??
                    item.catalogBrand?.logoUrl) ||
                  undefined
                }
              />
              <div className="flex flex-col">
                <span className="text-small font-medium">{item.name}</span>
                <span className="text-tiny text-default-400">{item.brand}</span>
              </div>
            </div>
          </ListboxItem>
        )}
      </Listbox>
    </div>
  );
}
