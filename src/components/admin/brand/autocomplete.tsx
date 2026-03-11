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

import { Brands } from "@/lib/appwrite/types";
import { CollectionElement } from "@react-types/shared";
import { Query } from "appwrite";
import { useAppwrite } from "@/contexts/appwrite";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";

interface BrandAutocompleteProps extends Omit<
  AutocompleteProps,
  "children" | "onSelectionChange"
> {
  onBrandSelect?: (brand: Brands) => void;
}

export default function BrandAutocomplete({
  onBrandSelect,
  ...props
}: BrandAutocompleteProps) {
  const { tables } = useAppwrite();
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState("");

  const limit = 15;

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: queryKeys.adminBrands({ search: filterText }),
    queryFn: async ({ pageParam, queryKey: [_, __, { search }] }) => {
      const queries = [Query.orderAsc("name"), Query.limit(limit)];

      if (search) {
        queries.push(Query.search("name", search));
      }

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

  const brands = useMemo(
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

    const selectedBrand = brands.find((b) => b.$id === key);
    if (selectedBrand && onBrandSelect) {
      onBrandSelect(selectedBrand);
    }
  };

  return (
    <Autocomplete
      label="Brand"
      placeholder="Search for a brand..."
      isLoading={isFetching}
      scrollRef={scrollerRef}
      defaultItems={brands}
      onOpenChange={setIsOpen}
      onInputChange={(v) => {
        setFilterText(v);
        props.onInputChange?.(v);
      }}
      onSelectionChange={handleSelectionChange}
      {...props}
    >
      {
        ((brand: Brands) => (
          <AutocompleteItem key={brand.$id} textValue={brand.name}>
            <div className="flex items-center gap-3">
              <Avatar
                src={brand.logoUrl || undefined}
                name={brand.name[0]}
                size="sm"
                radius="sm"
                className="w-6 h-6 text-[10px] bg-secondary/10 text-secondary"
              />
              <span className="text-small">{brand.name}</span>
            </div>
          </AutocompleteItem>
        )) as (item: object) => CollectionElement<object>
      }
    </Autocomplete>
  );
}
