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
import { History, Plus, Sparkles } from "lucide-react";
import { ID, Permission, Query, Role } from "appwrite";
import { Products, WishlistProducts } from "@/lib/appwrite/types";
import { Ref, useState } from "react";
import { databaseId, tableIds } from "@/lib/appwrite/const";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

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
  const {
    data,
    fetchNextPage: fetchNextDeleted,
    hasNextPage: hasMoreDeleted,
    isFetching: isFetchingDeleted,
  } = useInfiniteQuery({
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

  const {
    data: productsData,
    fetchNextPage: fetchNextProducts,
    hasNextPage: hasMoreProducts,
    isFetching: isFetchingProducts,
  } = useInfiniteQuery({
    queryKey: queryKeys.products(),
    queryFn: async ({ pageParam }) => {
      const queries = [
        Query.equal("userId", user!.$id),
        Query.orderAsc("name"),
        Query.limit(limit),
      ];
      if (pageParam) queries.push(Query.cursorAfter(pageParam));
      return await tables.listRows<Products>({
        databaseId,
        tableId: tableIds.products,
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
  const libraryProducts = productsData?.pages.flatMap((p) => p.rows) ?? [];

  // 1. Scroll for the Autocomplete Dropdown
  const [, autocompleteScrollRef] = useInfiniteScroll({
    hasMore: hasMoreDeleted,
    onLoadMore: fetchNextDeleted,
    isEnabled: isAutocompleteOpen,
    shouldUseLoader: false,
  });

  // 2. Scroll for the Quick-Add list at the bottom
  const [historyLoaderRef, historyScrollRef] = useInfiniteScroll({
    hasMore: hasMoreDeleted || hasMoreProducts,
    onLoadMore: () => {
      if (hasMoreDeleted && !isFetchingDeleted) {
        fetchNextDeleted();
      } else if (!hasMoreDeleted && hasMoreProducts && !isFetchingProducts) {
        fetchNextProducts();
      }
    },
    isEnabled: isOpen,
  });

  // 2. Recovery / Creation Mutation
  const { mutate: handleAdd, isPending } = useMutation({
    mutationFn: async ({
      name,
      wishlistProductId,
      productId,
    }: {
      name?: string;
      wishlistProductId?: string;
      productId?: string;
    }) => {
      if (!user?.$id) return;

      // Case 1: Restore a soft-deleted item
      if (wishlistProductId) {
        return await tables.updateRow({
          databaseId,
          tableId: tableIds.wishlist,
          rowId: wishlistProductId,
          data: { deletedAt: null },
        });
      }

      // Case 2: Create wishlist item from existing library product
      if (productId) {
        return await tables.createRow({
          databaseId,
          tableId: tableIds.wishlist,
          rowId: ID.unique(),
          data: {
            product: productId,
            userId: user.$id,
            deletedAt: null,
          },
          permissions: [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ],
        });
      }

      if (!name) return;

      // Case 3: Check for name match in soft-deleted
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

      // Case 4: Brand new custom item
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
          base: "md:max-h-[40%] bottom-2 inset-x-2 w-auto rounded-b-large",
        }}
        scrollBehavior="outside"
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
                  isLoading={isFetchingDeleted}
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
                <div className="flex flex-col gap-4 overflow-hidden h-full">
                  <div
                    ref={historyScrollRef as Ref<HTMLDivElement>}
                    className="overflow-y-auto space-y-6 pr-2"
                  >
                    {/* Section 1: Recently Removed */}
                    {deletedItems.length > 0 && (
                      <section className="space-y-3">
                        <div className="flex items-center gap-2 sticky top-0 bg-background py-1 z-10">
                          <History size={14} className="text-default-400" />
                          <p className="text-tiny font-bold text-default-400 uppercase tracking-wider">
                            Recently Removed
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {deletedItems.map((item) => (
                            <QuickAddCard
                              key={item.$id}
                              label={item.name ?? "Unknown"}
                              onPress={() =>
                                handleAdd({ wishlistProductId: item.$id })
                              }
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Section 2: From Your Library */}
                    <section className="space-y-3">
                      <div className="flex items-center gap-2 sticky top-0 bg-background py-1 z-10">
                        <Sparkles size={14} className="text-primary-400" />
                        <p className="text-tiny font-bold text-default-400 uppercase tracking-wider">
                          From Your Library
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {libraryProducts.map((product) => (
                          <QuickAddCard
                            key={product.$id}
                            label={product.name}
                            onPress={() =>
                              handleAdd({ productId: product.$id })
                            }
                          />
                        ))}
                      </div>
                    </section>

                    {(hasMoreDeleted || hasMoreProducts) && (
                      <div
                        ref={historyLoaderRef as Ref<HTMLDivElement>}
                        className="w-full flex justify-center py-4"
                      >
                        <Spinner size="sm" color="primary" />
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

function QuickAddCard({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Card
      isPressable
      className="bg-content2 border-none shadow-none hover:bg-content3 transition-colors"
      onPress={onPress}
    >
      <CardBody className="py-2 px-3 flex flex-row items-center gap-2">
        <span className="text-small font-medium">{label}</span>
        <Plus size={14} className="text-primary" />
      </CardBody>
    </Card>
  );
}
