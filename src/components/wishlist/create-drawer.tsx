"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Card,
  CardBody,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { History, Plus } from "lucide-react";
import { ID, Permission, Query, Role } from "appwrite";
import { Ref, useState } from "react";
import { databaseId, tableIds } from "@/lib/appwrite/const";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { WishlistProducts } from "@/lib/appwrite/appwrite";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";

export function CreateWishlistItemDrawer() {
  const { tables } = useAppwrite();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
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

  // 1. Scroll for the Autocomplete Dropdown
  const [, autocompleteScrollRef] = useInfiniteScroll({
    hasMore: hasNextPage,
    onLoadMore: fetchNextPage,
    isEnabled: isAutocompleteOpen,
    shouldUseLoader: false,
  });

  // 2. Scroll for the Quick-Add list at the bottom
  const [historyLoaderRef, historyScrollRef] = useInfiniteScroll({
    hasMore: hasNextPage,
    onLoadMore: fetchNextPage,
    isEnabled: isOpen,
  });

  // 2. Recovery / Creation Mutation
  const { mutate: handleAdd, isPending } = useMutation({
    mutationFn: async ({
      name,
      wishlistProductId,
    }: {
      name?: string;
      wishlistProductId?: string;
    }) => {
      if (!user?.$id) return;

      // Case 1: Direct restore via ID (from the history cards)
      if (wishlistProductId) {
        return await tables.updateRow({
          databaseId,
          tableId: tableIds.wishlist,
          rowId: wishlistProductId,
          data: { deletedAt: null },
        });
      }

      if (!name) return;

      // Case 2: Check if name typed matches a soft-deleted item
      const existing = await tables.listRows<WishlistProducts>({
        databaseId,
        tableId: tableIds.wishlist,
        queries: [
          Query.equal("userId", user.$id),
          Query.equal("name", name),
          Query.isNull("product"),
          Query.limit(1),
        ],
      });

      if (existing.total > 0) {
        return await tables.updateRow({
          databaseId,
          tableId: tableIds.wishlist,
          rowId: existing.rows[0].$id,
          data: { deletedAt: null },
        });
      }

      // Case 3: Brand new custom item
      return await tables.createRow({
        databaseId,
        tableId: tableIds.wishlist,
        rowId: ID.unique(),
        data: { name, userId: user.$id, deletedAt: null },
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
                  label="Search or Add New"
                  placeholder="e.g. Silk Pillowcase"
                  variant="bordered"
                  inputValue={value}
                  onInputChange={setValue}
                  items={deletedItems}
                  isLoading={isFetching}
                  scrollRef={autocompleteScrollRef}
                  onOpenChange={setIsAutocompleteOpen}
                  allowsCustomValue
                  onSelectionChange={(key) => {
                    const item = deletedItems.find((i) => i.$id === key);
                    if (item) handleAdd({ wishlistProductId: item.$id });
                  }}
                >
                  {(item) => (
                    <AutocompleteItem key={item.$id} textValue={item.name!}>
                      {item.name}
                    </AutocompleteItem>
                  )}
                </Autocomplete>

                {/* History Quick-Add Section */}
                <div className="flex flex-col gap-3 h-full overflow-hidden">
                  <div className="flex items-center gap-2">
                    <History size={14} className="text-default-400" />
                    <p className="text-tiny font-bold text-default-400 uppercase tracking-wider">
                      Recently Removed
                    </p>
                  </div>

                  <div
                    ref={historyScrollRef as Ref<HTMLDivElement>}
                    className="flex flex-wrap gap-2 overflow-y-auto max-h-40 p-1 content-start"
                  >
                    {deletedItems.map((item) => (
                      <Card
                        key={item.$id}
                        isPressable
                        className="bg-content2 border-none shadow-none hover:bg-content3 transition-colors"
                        onPress={() =>
                          handleAdd({ wishlistProductId: item.$id })
                        }
                      >
                        <CardBody className="py-2 px-3 flex flex-row items-center gap-2">
                          <span className="text-small font-medium">
                            {item.name}
                          </span>
                          <Plus size={14} className="text-primary" />
                        </CardBody>
                      </Card>
                    ))}

                    {hasNextPage && (
                      <div
                        ref={historyLoaderRef as Ref<HTMLDivElement>}
                        className="w-full flex justify-center py-2"
                      >
                        <Spinner size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  isLoading={isPending}
                  onPress={() => handleAdd({ name: value })}
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
