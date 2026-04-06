"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  ArrowDownUp,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Calendar,
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
  Spinner,
} from "@heroui/react";
import { Ref, useMemo, useState } from "react";
import { bucketId, databaseId, tableIds } from "@/lib/appwrite/const";

import { JournalEntries } from "@/lib/appwrite/types";
import { JournalEntryModal } from "@/components/journal/modal";
import { LexicalRenderer } from "@/components/ui/rich-text";
import { Query } from "appwrite";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";

const LIMIT = 12;

export default function JournalPage() {
  const { user } = useAuth();
  const { tables, storage } = useAppwrite();

  const [sortDirections, setSortDirections] = useState<
    Record<string, "asc" | "desc">
  >({
    occurredAt: "desc",
  });

  const sortOptions = useMemo(
    () => [
      {
        key: "occurredAt",
        label: "Date",
        icon: <Calendar size={16} />,
        defaultDesc: true,
      },
      {
        key: "$createdAt",
        label: "Created",
        icon: <Clock size={16} />,
        defaultDesc: true,
      },
    ],
    [],
  );

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: queryKeys.journal({ sortDirections }),
      queryFn: async ({ pageParam }) => {
        const orderQueries = Object.entries(sortDirections).map(([key, dir]) =>
          dir === "desc" ? Query.orderDesc(key) : Query.orderAsc(key),
        );

        const queries = [
          Query.equal("userId", user!.$id),
          ...orderQueries,
          Query.limit(LIMIT),
        ];

        if (pageParam) queries.push(Query.cursorAfter(pageParam));

        return await tables.listRows<JournalEntries>({
          databaseId,
          tableId: tableIds.journalEntries,
          queries,
        });
      },
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) =>
        lastPage.rows.length < LIMIT
          ? undefined
          : lastPage.rows[lastPage.rows.length - 1].$id,
      enabled: !!user?.$id,
    });

  const entries = data?.pages.flatMap((p) => p.rows) ?? [];
  const [loaderRef, scrollerRef] = useInfiniteScroll({
    hasMore: hasNextPage,
    onLoadMore: fetchNextPage,
  });

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 container mx-auto w-full">
      <header className="flex flex-wrap gap-4 justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            Skin Journal
          </h1>
          <p className="text-default-500 text-sm">
            Track your progress and reactions
          </p>
        </div>
        <div className="flex gap-2">
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="flat"
                size="sm"
                isLoading={isFetching && !isFetchingNextPage}
                startContent={
                  !(isFetching && !isFetchingNextPage) && (
                    <ArrowDownUp size={16} />
                  )
                }
                className="font-bold uppercase"
              >
                Sort ({Object.keys(sortDirections).length})
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Sort selection"
              closeOnSelect={false}
              selectionMode="multiple"
              selectedKeys={new Set(Object.keys(sortDirections))}
              onAction={(key) => {
                const opt = sortOptions.find((o) => o.key === key)!;
                setSortDirections((prev) => {
                  if (key in prev) {
                    if (opt.defaultDesc && prev[key as string] === "desc")
                      return { ...prev, [key]: "asc" as const };
                    if (!opt.defaultDesc && prev[key as string] === "asc")
                      return { ...prev, [key]: "desc" as const };
                    const next = { ...prev };
                    delete next[key as string];
                    return next;
                  }
                  return {
                    ...prev,
                    [key]: opt.defaultDesc
                      ? ("desc" as const)
                      : ("asc" as const),
                  };
                });
              }}
            >
              {sortOptions.map((item) => (
                <DropdownItem
                  key={item.key}
                  startContent={item.icon}
                  endContent={
                    item.key in sortDirections ? (
                      sortDirections[item.key] === "desc" ? (
                        <ArrowUpNarrowWide size={16} className="text-primary" />
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
                >
                  {item.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <JournalEntryModal />
        </div>
      </header>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        ref={scrollerRef as Ref<HTMLDivElement>}
      >
        {entries.map((entry) => (
          <Card
            key={entry.$id}
            className="bg-content1 border-1 border-transparent hover:border-secondary transition-all"
          >
            <CardBody className="p-0">
              {entry.imageId ? (
                <Image
                  src={`/api/files/${entry.imageId}`}
                  alt="Progress"
                  className="w-full aspect-4/3 object-cover rounded-none"
                />
              ) : (
                <div className="w-full aspect-4/3 bg-default-100 flex flex-col items-center justify-center text-default-400">
                  <ImageIcon size={32} strokeWidth={1} />
                  <span className="text-tiny uppercase font-bold mt-2">
                    No Photo
                  </span>
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">
                    {new Date(entry.occurredAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <JournalEntryModal entry={entry} />
                </div>
                {entry.description ? (
                  <LexicalRenderer
                    state={JSON.parse(entry.description)}
                    className="text-sm text-default-600 line-clamp-3"
                  />
                ) : (
                  <p className="text-sm text-default-400 italic">
                    No notes recorded...
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div
        ref={loaderRef as Ref<HTMLDivElement>}
        className="w-full flex justify-center py-8"
      >
        {isFetchingNextPage || (isFetching && entries.length === 0) ? (
          <div className="flex flex-col items-center gap-2">
            <Spinner color="primary" size="sm" />
            <span className="text-tiny font-bold uppercase text-default-400 tracking-widest">
              Loading Entries
            </span>
          </div>
        ) : !hasNextPage && entries.length > 0 ? (
          <p className="text-tiny font-bold uppercase text-default-300 tracking-widest">
            End of the road
          </p>
        ) : null}
      </div>
    </div>
  );
}
