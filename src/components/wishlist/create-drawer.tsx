"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  useDisclosure,
} from "@heroui/react";
import { ID, Permission, Query, Role } from "appwrite";
import { databaseId, tableIds } from "@/lib/appwrite/const";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { Plus } from "lucide-react";
import { WishlistProducts } from "@/lib/appwrite/appwrite";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { useState } from "react";

export function CreateWishlistItemDrawer() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { tables } = useAppwrite();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const limit = 10;

  // 1. Fetch soft-deleted items with names for Autocomplete
  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: queryKeys.wishlist({ isDeleted: true, hasName: true }),
    queryFn: async ({ pageParam }) => {
      const queries = [
        Query.equal("userId", user!.$id),
        Query.isNotNull("deletedAt"),
        Query.isNotNull("name"),
        Query.orderDesc("$updatedAt"),
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
    getNextPageParam: (lastPage) =>
      lastPage.rows.length < limit
        ? undefined
        : lastPage.rows[lastPage.rows.length - 1].$id,
    enabled: isOpen,
  });

  const deletedItems = data?.pages.flatMap((p) => p.rows) ?? [];
  const [, scrollerRef] = useInfiniteScroll({
    hasMore: hasNextPage,
    onLoadMore: fetchNextPage,
    isEnabled: isOpen,
  });

  // 2. Recovery / Creation Mutation
  const { mutate: handleAdd, isPending } = useMutation({
    mutationFn: async (name: string) => {
      if (!user?.$id) return;

      // 1. Check if a soft-deleted custom item with this name already exists
      const existing = await tables.listRows<WishlistProducts>({
        databaseId,
        tableId: tableIds.wishlist,
        queries: [
          Query.equal("userId", user.$id),
          Query.equal("name", name),
          Query.isNull("product"), // Ensure it's a custom item
          Query.limit(1),
        ],
      });

      if (existing.total > 0) {
        // 2. Recover the existing row
        return await tables.updateRow({
          databaseId,
          tableId: tableIds.wishlist,
          rowId: existing.rows[0].$id,
          data: { deletedAt: null },
        });
      }

      // 3. Otherwise, create a brand new one
      return await tables.createRow({
        databaseId,
        tableId: tableIds.wishlist,
        rowId: ID.unique(),
        data: {
          name,
          userId: user.$id,
          deletedAt: null,
          product: null, // Explicitly null for custom items
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
      setValue("");
      onOpenChange();
    },
  });

  return (
    <>
      <Button
        onPress={onOpen}
        color="primary"
        startContent={<Plus size={18} />}
      >
        Add Item
      </Button>
      <Drawer
        isOpen={isOpen}
        placement="bottom"
        onOpenChange={onOpenChange}
        classNames={{
          base: "max-h-[40%] bottom-2 inset-x-2 w-auto rounded-b-large",
        }}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1">
                Add to Wishlist
              </DrawerHeader>
              <DrawerBody>
                <Autocomplete
                  label="Product Name"
                  placeholder="Type a new name or select from history"
                  variant="bordered"
                  inputValue={value}
                  onInputChange={setValue}
                  items={deletedItems}
                  isLoading={isFetching}
                  scrollRef={scrollerRef}
                  allowsCustomValue
                  onSelectionChange={(key) => {
                    const item = deletedItems.find((i) => i.$id === key);
                    if (item) setValue(item.name!);
                  }}
                >
                  {(item) => (
                    <AutocompleteItem key={item.$id} textValue={item.name!}>
                      <div className="flex justify-between items-center">
                        <span>{item.name}</span>
                        <Chip size="sm" variant="dot" color="default">
                          Previous
                        </Chip>
                      </div>
                    </AutocompleteItem>
                  )}
                </Autocomplete>
              </DrawerBody>
              <DrawerFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  isLoading={isPending}
                  onPress={() => handleAdd(value)}
                  isDisabled={!value.trim()}
                >
                  Save
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
