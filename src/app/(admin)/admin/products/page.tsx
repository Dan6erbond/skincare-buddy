"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  User,
} from "@heroui/react";
import { Library, MoreHorizontal, Search, Tag } from "lucide-react";
import { databaseId, tableIds } from "@/lib/appwrite/const";

import { CatalogProductModal } from "@/components/admin/product/modal";
import { CatalogProducts } from "@/lib/appwrite/types";
import { DeleteCatalogProductModal } from "@/components/admin/product/delete-modal";
import { Query } from "appwrite";
import { useAppwrite } from "@/contexts/appwrite";
import { useDebounceValue } from "usehooks-ts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function CatalogPage() {
  const { tables } = useAppwrite();
  const [search, setSearch] = useDebounceValue("", 500);
  const [page, setPage] = useState(1);
  const perPage = 25;

  const { data: { rows: products = [], total = 0 } = {}, isLoading } = useQuery(
    {
      queryKey: queryKeys.adminCatalog({ search, page, perPage }),
      queryFn: async ({ queryKey: [_, __, { search, page, perPage }] }) => {
        return await tables.listRows<CatalogProducts>({
          databaseId,
          tableId: tableIds.catalogProducts,
          queries: [
            Query.select(["*", "brand.*"]),
            ...(search ? [Query.search("name", search)] : []),
            Query.orderAsc("name"),
            Query.limit(perPage),
            Query.offset((page - 1) * perPage),
          ],
        });
      },
    },
  );

  const columns = [
    { key: "product", label: "Product", icon: <Library size={16} /> },
    { key: "category", label: "Category", icon: <Tag size={16} /> },
    { key: "actions", label: "Actions", icon: <MoreHorizontal size={16} /> },
  ];

  return (
    <main className="flex flex-col gap-8 p-4 md:p-8 container mx-auto w-full">
      <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-2">
            Catalog <Library className="text-secondary" />
          </h1>
          <p className="text-default-500 italic">
            Master library of all skincare products
          </p>
        </div>
        <CatalogProductModal />
      </header>

      <div className="space-y-4">
        <div className="flex justify-between items-center bg-default-50 p-3 rounded-xl border border-divider">
          <div className="text-small text-default-500 font-medium">
            Total Products:{" "}
            <span className="text-secondary font-bold">{total}</span>
          </div>
          <Input
            isClearable
            className="w-full sm:max-w-[33%]"
            placeholder="Search catalog..."
            startContent={<Search className="text-default-300" size={18} />}
            onValueChange={setSearch}
            size="sm"
          />
        </div>

        <Table
          aria-label="Product Catalog"
          bottomContent={
            total > perPage && (
              <div className="flex w-full justify-center">
                <Pagination
                  isCompact
                  showControls
                  color="secondary"
                  page={page}
                  total={Math.ceil(total / perPage)}
                  onChange={setPage}
                />
              </div>
            )
          }
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key}>
                <div className="flex items-center gap-2">
                  {column.icon}
                  {column.label}
                </div>
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={products}
            isLoading={isLoading}
            emptyContent="No products found."
          >
            {(product) => (
              <TableRow key={product.$id}>
                <TableCell>
                  <User
                    name={product.name}
                    description={product.brand?.name}
                    avatarProps={{
                      src:
                        (product.imageUrl ?? product.brand?.logoUrl) ||
                        undefined,
                      name: product.name[0],
                      radius: "sm",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <span className="capitalize py-1 px-2 bg-default-100 rounded text-tiny font-bold">
                    {product.category || "Uncategorized"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <CatalogProductModal product={product} />
                    <DeleteCatalogProductModal product={product} />
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
