"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  ActivityIcon,
  AlertCircle,
  Archive,
  ArrowDownUp,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Beaker,
  Bookmark,
  Box,
  DollarSign,
  FlaskConical,
  MoreHorizontal,
  Package,
  Search,
  Sparkles,
  Star,
  Tag,
  Type,
} from "lucide-react";
import {
  Button,
  ButtonGroup,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Pagination,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  User,
} from "@heroui/react";
import { ComponentType, ReactNode, useMemo, useState } from "react";
import { Models, Query } from "appwrite";
import { databaseId, tableIds } from "@/lib/appwrite/const";

import { AIExportButton } from "@/components/ui/ai-export-button";
import { AddToWishlistModal } from "@/components/wishlist/add-modal";
import { CreateProductModal } from "@/components/product/create-modal";
import Link from "next/link";
import { Products } from "@/lib/appwrite/types";
import { Rating } from "@/components/ui/rating";
import { getExpiryDate } from "@/lib/product/utils";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { useDebounceValue } from "usehooks-ts";
import { useProfile } from "@/hooks/use-profile";
import { useQuery } from "@tanstack/react-query";

type ColumnDef = {
  key: string;
  label: string;
  icon: ReactNode;
  Cell: ComponentType<{ product: Products }>;
};

export default function Page() {
  const { user } = useAuth();
  const { tables } = useAppwrite();
  const now = useMemo(() => new Date(), []);

  const { profile } = useProfile();

  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useDebounceValue("", 500);

  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);

  const [sortDirections, setSortDirections] = useState<
    Record<string, "asc" | "desc">
  >({});

  const sortOptions = useMemo(
    () =>
      [
        { key: "brand", label: "Brand", icon: <Bookmark size={16} /> },
        { key: "name", label: "Name", icon: <Type size={16} /> },
        { key: "category", label: "Category", icon: <Tag size={16} /> },
        { key: "price", label: "Price", icon: <DollarSign size={16} /> },
        {
          key: "rating",
          label: "Rating",
          icon: <Star size={16} />,
          defaultDesc: true,
        },
        {
          key: "archivedAt",
          label: "Archived at",
          icon: <Archive size={16} />,
        },
      ].filter(({ key }) => (showArchived ? true : key !== "archivedAt")),
    [showArchived],
  );

  const activeColumns = useMemo(() => {
    const columns: ColumnDef[] = [
      {
        key: "formula",
        label: "Formula",
        icon: <FlaskConical size={16} />,
        Cell: ({ product }) => (
          <User
            name={product.name}
            description={product.brand}
            avatarProps={{
              radius: "md",
              color: "primary",
              size: "sm",
              className: "shrink-0 rounded-full",
            }}
          />
        ),
      },
      {
        key: "category",
        label: "Category",
        icon: <Tag size={16} />,
        Cell: ({ product }) => (
          <Chip
            size="sm"
            variant="flat"
            color="secondary"
            className="uppercase font-bold"
          >
            {product.category}
          </Chip>
        ),
      },
      {
        key: "inventory",
        label: "Inventory",
        icon: <Box size={16} />,
        Cell: ({ product }) => {
          const activeUnits = product.units?.filter((u) => !u.finishedAt) || [];

          return (
            <div className="flex items-center gap-2">
              <Package size={14} className="text-default-400" />
              <span className="font-semibold">{activeUnits.length} Units</span>
            </div>
          );
        },
      },
      {
        key: "status",
        label: "Status",
        icon: <ActivityIcon size={16} />,
        Cell: ({ product }) => {
          const activeUnits = product.units?.filter((u) => !u.finishedAt) || [];
          const openedUnit = activeUnits.find((u) => u.openedAt);
          const urgentDate = activeUnits.reduce(
            (earliest: Date | null, unit) => {
              const exp = getExpiryDate(unit);

              if (!earliest || (exp && exp < earliest)) return exp;
              return earliest;
            },
            null,
          );

          return (
            <div className="flex gap-2">
              {openedUnit ? (
                <Chip
                  size="sm"
                  color="success"
                  variant="dot"
                  className="uppercase"
                >
                  In Use
                </Chip>
              ) : (
                <Chip
                  size="sm"
                  color="warning"
                  variant="flat"
                  className="uppercase"
                >
                  Stockpiled
                </Chip>
              )}
              {urgentDate && urgentDate < now && (
                <Chip
                  size="sm"
                  color="danger"
                  startContent={<AlertCircle size={12} />}
                  className="uppercase"
                >
                  Expired
                </Chip>
              )}
            </div>
          );
        },
      },
      {
        key: "rating",
        label: "Rating",
        icon: <Star size={16} />,
        Cell: ({ product }) => <Rating value={product.rating ?? 0} />,
      },
      {
        key: "price",
        label: "Price",
        icon: <DollarSign size={16} />,
        Cell: ({ product }) => <p>{product.price.toLocaleString()}</p>,
      },
      {
        key: "actions",
        label: "Actions",
        icon: <MoreHorizontal size={16} />,
        Cell: ({ product }) => <AddToWishlistModal product={product} />,
      },
      {
        key: "archivedAt",
        label: "Archived at",
        icon: <Archive size={16} />,
        Cell: ({ product }) => (
          <p>
            {product.archivedAt &&
              new Date(product.archivedAt).toLocaleDateString()}
          </p>
        ),
      },
    ];

    return columns.filter(({ key }) =>
      showArchived ? true : key !== "archivedAt",
    );
  }, [showArchived, now]);

  const { data: { rows: products = [], total = 0 } = {}, isLoading } = useQuery(
    {
      queryKey: queryKeys.products({
        sortDirections,
        page,
        perPage,
        search,
        showArchived,
      }),
      queryFn: async ({
        queryKey: [_, { sortDirections, page, perPage, search, showArchived }],
      }) => {
        if (!user?.$id) return {} as Models.RowList<Products>;

        const orderQueries = Object.entries(sortDirections).map(([key, dir]) =>
          dir === "desc" ? Query.orderDesc(key) : Query.orderAsc(key),
        );

        const res = await tables.listRows<Products>({
          databaseId,
          tableId: tableIds.products,
          queries: [
            Query.equal("userId", user.$id),
            ...(showArchived ? [] : [Query.isNull("archivedAt")]),
            ...(search
              ? [
                  Query.or([
                    Query.search("name", search),
                    Query.search("brand", search),
                    Query.search("category", search),
                  ]),
                ]
              : []),
            Query.select(["*", "units.*"]),
            ...orderQueries,
            Query.orderAsc("$updatedAt"),
            Query.orderAsc("$createdAt"),
            Query.offset((page - 1) * perPage),
            Query.limit(perPage),
          ],
        });

        return res;
      },
      enabled: !!user?.$id,
    },
  );

  const finalClipboardText = useMemo(() => {
    if (!products.length) {
      return;
    }

    let profileSection =
      "### User Skin Profile\n*No profile details provided.*\n\n";

    if (profile) {
      const skinType = profile.skinType || "Not specified";
      const sensitivity = profile.hasSensitiveSkin ? "Yes (Sensitive)" : "No";
      const concerns = profile.skinIssues?.length
        ? profile.skinIssues.join(", ")
        : "None listed";

      profileSection =
        `### User Skin Profile\n` +
        `- **Skin Type:** ${skinType}\n` +
        `- **Sensitive:** ${sensitivity}\n` +
        `- **Concerns:** ${concerns}\n\n`;
    }

    const header =
      `### Skincare Inventory Analysis Request\n` +
      `*User Shelf Export - ${new Date().toLocaleDateString()}*\n\n` +
      `Please review my current products. Focus on ingredient synergies, potential irritation risks, and routine optimization.\n\n---\n`;

    const inventoryHeader = `### Current Inventory\n`;

    const inventoryBody = products
      .map((p) => {
        const rating = p.rating ? "★".repeat(p.rating) : "No rating";
        const activeUnits = p.units?.filter((u) => !u.finishedAt).length || 0;

        return `**${p.brand}: ${p.name}** (${p.category})
  - Status: ${activeUnits} units in stock
  - My Rating: ${rating}`;
      })
      .join("\n\n");

    return header + profileSection + inventoryHeader + inventoryBody;
  }, [products, profile]);

  return (
    <main className="flex flex-col gap-8 p-4 md:p-8 container mx-auto w-full">
      <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-2">
            My Vanity <Beaker className="text-primary" />
          </h1>
          <p className="text-default-500 italic">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-2">
          <CreateProductModal />
        </div>
      </header>

      <div className="space-y-4">
        {/* Action Bar */}
        <div className="flex justify-between items-center bg-default-50 p-3 rounded-xl border border-divider">
          <div className="text-small text-default-500 font-medium">
            Total Items:{" "}
            <span className="text-primary font-bold">{products.length}</span>
          </div>
          {finalClipboardText && (
            <AIExportButton
              size="sm"
              color="secondary"
              variant="flat"
              clipboardText={finalClipboardText}
              startContent={<Sparkles className="size-4" />}
            >
              Export for AI
            </AIExportButton>
          )}
        </div>

        <Table
          topContent={
            <div className="flex justify-end items-end gap-4">
              <Input
                label="Search..."
                labelPlacement="outside"
                startContent={<Search className="size-5 text-default-400" />}
                size="sm"
                onValueChange={setSearch}
                className="max-w-xs"
              />
              <Switch
                size="sm"
                color="secondary"
                isSelected={showArchived}
                onValueChange={(show) => {
                  setShowArchived(show);
                  if (show) {
                    setSortDirections((prev) => ({
                      ...prev,
                      archivedAt: "desc",
                    }));
                  }
                }}
                thumbIcon={({ isSelected, className }) =>
                  isSelected ? (
                    <div className={className}>
                      <Archive className="size-3" />
                    </div>
                  ) : (
                    <div className={className}>
                      <Package className="size-3" />
                    </div>
                  )
                }
              >
                <span className="text-tiny uppercase font-bold text-default-500">
                  {showArchived ? "Viewing Archive" : "Show Archived"}
                </span>
              </Switch>

              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="flat"
                    size="sm"
                    startContent={<ArrowDownUp size={16} />}
                    className="font-bold uppercase"
                  >
                    Sort ({Object.keys(sortDirections).length})
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Multiple Sort Selection"
                  variant="flat"
                  closeOnSelect={false}
                  selectionMode="multiple"
                  selectedKeys={new Set(Object.keys(sortDirections))}
                  onAction={(key) => {
                    const sortOption = sortOptions.find(
                      (opt) => opt.key === key,
                    )!;

                    if (key in sortDirections) {
                      if (
                        sortOption.defaultDesc &&
                        sortDirections[key] === "desc"
                      ) {
                        setSortDirections((prev) => ({
                          ...prev,
                          [key]: "asc" as const,
                        }));
                      } else if (
                        !sortOption.defaultDesc &&
                        sortDirections[key] === "asc"
                      ) {
                        setSortDirections((prev) => ({
                          ...prev,
                          [key]: "desc" as const,
                        }));
                      } else {
                        setSortDirections(
                          Object.fromEntries(
                            Object.entries(sortDirections).filter(
                              ([k]) => k !== key,
                            ),
                          ),
                        );
                      }
                    } else {
                      setSortDirections((prev) => ({
                        ...prev,
                        [key]: sortOption.defaultDesc
                          ? ("desc" as const)
                          : ("asc" as const),
                      }));
                    }
                  }}
                >
                  {sortOptions.map((item) => {
                    const isSelected = item.key in sortDirections;
                    const direction = sortDirections[item.key];

                    return (
                      <DropdownItem
                        key={item.key}
                        startContent={item.icon}
                        endContent={
                          isSelected ? (
                            direction === "desc" ? (
                              <ArrowUpNarrowWide
                                size={16}
                                className="text-primary"
                              />
                            ) : (
                              <ArrowDownWideNarrow
                                size={16}
                                className="text-primary"
                              />
                            )
                          ) : (
                            <ArrowDownUp
                              size={16}
                              className="text-default-300 opacity-50"
                            />
                          )
                        }
                        className={
                          isSelected ? "text-primary" : "text-default-500"
                        }
                      >
                        {item.label}
                      </DropdownItem>
                    );
                  })}
                </DropdownMenu>
              </Dropdown>
            </div>
          }
          bottomContent={
            <div className="flex justify-between w-full min-w-0 flex-1">
              <div>
                {Math.ceil(total / perPage) > 1 && (
                  <Pagination
                    total={Math.ceil(total / perPage)}
                    page={page}
                    onChange={setPage}
                  />
                )}
              </div>
              <div className="flex gap-2 items-center">
                <p>Per page</p>
                <ButtonGroup variant="ghost" size="sm">
                  <Button
                    variant={perPage === 10 ? "faded" : undefined}
                    onPress={() => setPerPage(10)}
                  >
                    10
                  </Button>
                  <Button
                    variant={perPage === 25 ? "faded" : undefined}
                    onPress={() => setPerPage(25)}
                  >
                    25
                  </Button>
                  <Button
                    variant={perPage === 100 ? "faded" : undefined}
                    onPress={() => setPerPage(100)}
                  >
                    100
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          }
          aria-label="Inventory"
        >
          <TableHeader columns={activeColumns}>
            {({ key, icon, label }) => (
              <TableColumn key={key} className="uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  {icon}
                  {label}
                </div>
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={products}
            isLoading={isLoading}
            emptyContent="Shelf is empty."
          >
            {(product) => (
              <TableRow
                key={product.$id}
                className="border-b border-divider last:border-none cursor-pointer hover:bg-content2"
                as={Link}
                href={`/products/${product.$id}`}
              >
                {activeColumns.map(({ key, Cell }) => (
                  <TableCell key={key}>
                    <Cell product={product} />
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
