"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  Chip,
  Input,
  Listbox,
  ListboxItem,
  ListboxProps,
  ScrollShadow,
  Spinner,
  User,
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
    queryKey: queryKeys.products({ search: searchValue }),
    queryFn: async ({ pageParam, queryKey: [_, { search }] }) => {
      const queries = [
        Query.equal("userId", user!.$id),
        Query.select([
          "*",
          "catalogProduct.*",
          "catalogBrand.*",
        ]),
        Query.orderAsc("name"),
        Query.orderAsc("$updatedAt"),
        Query.orderAsc("$createdAt"),
        Query.limit(limit),
      ];

      if (search) {
        queries.push(
          Query.or([
            Query.search("name", search),
            Query.search("brand", search),
            Query.search("category", search),
          ]),
        );
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
        {(product) => (
          <ListboxItem key={product.$id} textValue={product.name}>
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
          </ListboxItem>
        )}
      </Listbox>
    </div>
  );
}
