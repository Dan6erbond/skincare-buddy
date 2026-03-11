"use client";

import * as queryKeys from "@/lib/query/keys";

import { Globe, MoreHorizontal, Search, Tags } from "lucide-react";
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
import { databaseId, tableIds } from "@/lib/appwrite/const";

import { BrandModal } from "@/components/admin/brand/modal";
import { Brands } from "@/lib/appwrite/types";
import { DeleteBrandModal } from "@/components/admin/brand/delete-modal";
import { Query } from "appwrite";
import { useAppwrite } from "@/contexts/appwrite";
import { useDebounceValue } from "usehooks-ts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function BrandsPage() {
  const { tables } = useAppwrite();
  const [search, setSearch] = useDebounceValue("", 500);
  const [page, setPage] = useState(1);
  const perPage = 25;

  const { data: { rows: brands = [], total = 0 } = {}, isLoading } = useQuery({
    queryKey: queryKeys.adminBrands({ search, page, perPage }),
    queryFn: async ({ queryKey: [_, __, { search, page, perPage }] }) => {
      return await tables.listRows<Brands>({
        databaseId,
        tableId: tableIds.brands,
        queries: [
          ...(search ? [Query.search("name", search)] : []),
          Query.orderAsc("name"),
          Query.limit(perPage),
          Query.offset((page - 1) * perPage),
        ],
      });
    },
  });

  const columns = [
    { key: "brand", label: "Brand", icon: <Tags size={16} /> },
    { key: "website", label: "Website", icon: <Globe size={16} /> },
    { key: "actions", label: "Actions", icon: <MoreHorizontal size={16} /> },
  ];

  return (
    <main className="flex flex-col gap-8 p-4 md:p-8 container mx-auto w-full">
      <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-2">
            Brand Manager <Tags className="text-secondary" />
          </h1>
          <p className="text-default-500 italic">
            Manage the global catalog manufacturers
          </p>
        </div>
        <div className="flex gap-2">
          <BrandModal />
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex justify-between items-center bg-default-50 p-3 rounded-xl border border-divider">
          <div className="text-small text-default-500 font-medium">
            Total Brands:{" "}
            <span className="text-secondary font-bold">{total}</span>
          </div>
          <Input
            isClearable
            className="w-full sm:max-w-[33%]"
            placeholder="Search brands..."
            startContent={<Search className="text-default-300" size={18} />}
            onValueChange={setSearch}
            size="sm"
          />
        </div>

        <Table
          aria-label="Brands Table"
          bottomContent={
            total > perPage && (
              <div className="flex w-full justify-center">
                <Pagination
                  isCompact
                  showControls
                  showShadow
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
            items={brands}
            isLoading={isLoading}
            emptyContent="No brands found."
          >
            {(brand) => (
              <TableRow key={brand.$id}>
                <TableCell>
                  <User
                    name={brand.name}
                    avatarProps={{
                      src: brand.logoUrl || undefined,
                      name: brand.name[0],
                      radius: "sm",
                      className: "bg-secondary/10 text-secondary",
                    }}
                  />
                </TableCell>
                <TableCell>
                  {brand.website ? (
                    <a
                      href={brand.website}
                      target="_blank"
                      className="text-primary hover:underline text-sm"
                    >
                      Visit Site
                    </a>
                  ) : (
                    <span className="text-default-300 text-sm">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <BrandModal brand={brand} />
                    <DeleteBrandModal brand={brand} />
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
