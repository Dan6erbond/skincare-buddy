"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  Autocomplete,
  AutocompleteItem,
  AutocompleteProps,
  Avatar,
} from "@heroui/react";
import { databaseId, tableIds } from "@/lib/appwrite/const";
import { useMemo, useState } from "react";

import { CatalogProducts } from "@/lib/appwrite/types";
import { CollectionElement } from "@react-types/shared";
import { Query } from "appwrite";
import { useAppwrite } from "@/contexts/appwrite";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";

interface ProductAutocompleteProps extends Omit<
  AutocompleteProps,
  "children" | "onSelectionChange"
> {
  brandId?: string;
  category?: string;
  onProductSelect?: (product: CatalogProducts) => void;
}

export default function ProductAutocomplete({
  brandId,
  category,
  onProductSelect,
  ...props
}: ProductAutocompleteProps) {
  const { tables } = useAppwrite();
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState("");

  const limit = 20;

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    // Include brandId in the key so the query resets when the brand changes
    queryKey: queryKeys.adminCatalog({ brandId, category, search: filterText }),
    queryFn: async ({
      pageParam,
      queryKey: [_, __, { brandId, category, search }],
    }) => {
      const queries = [
        Query.orderAsc("name"),
        Query.limit(limit),
        Query.select(["*", "brand.*"]),
      ];

      // Filter by brand if provided
      if (brandId) {
        queries.push(Query.equal("brand", brandId));
      }

      if (category) {
        queries.push(Query.equal("category", category));
      }

      if (search) {
        queries.push(Query.search("name", search));
      }

      if (pageParam) {
        queries.push(Query.cursorAfter(pageParam));
      }

      return await tables.listRows<CatalogProducts>({
        databaseId,
        tableId: tableIds.catalogProducts,
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

  const products = useMemo(
    () => data?.pages.flatMap((p) => p.rows) ?? [],
    [data],
  );

  const [, scrollerRef] = useInfiniteScroll({
    hasMore: hasNextPage,
    isEnabled: isOpen,
    shouldUseLoader: false,
    onLoadMore: () => {
      if (!isFetching) fetchNextPage();
    },
  });

  const handleSelectionChange = (key: string | number | null) => {
    if (!key) return;

    const selectedProduct = products.find((p) => p.$id === key);
    if (selectedProduct && onProductSelect) {
      onProductSelect(selectedProduct);
    }
  };

  return (
    <Autocomplete
      label="Product"
      placeholder="Search products..."
      isLoading={isFetching}
      scrollRef={scrollerRef}
      defaultItems={products}
      onOpenChange={setIsOpen}
      onInputChange={(v) => {
        setFilterText(v);
        props.onInputChange?.(v);
      }}
      onSelectionChange={handleSelectionChange}
      isDisabled={props.isDisabled || (!brandId && !props.allowsCustomValue)}
      {...props}
    >
      {
        ((p: CatalogProducts) => (
          <AutocompleteItem key={p.$id} textValue={p.name}>
            <div className="flex items-center gap-3">
              <Avatar
                src={p.imageUrl || undefined}
                name={p.name[0]}
                size="sm"
                radius="sm"
                className="w-8 h-8 bg-default-100"
              />
              <div className="flex flex-col">
                <span className="text-small font-medium">{p.name}</span>
                <span className="text-tiny text-default-400 capitalize">
                  {p.category}
                </span>
              </div>
            </div>
          </AutocompleteItem>
        )) as (item: object) => CollectionElement<object>
      }
    </Autocomplete>
  );
}
