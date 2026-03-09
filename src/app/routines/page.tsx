"use client";

import * as queryKeys from "@/lib/query/keys";

import { Beaker, ChevronRight } from "lucide-react";
import { Card, CardBody } from "@heroui/react";
import { databaseId, tableIds } from "@/lib/appwrite/const";

import { CreateRoutineModal } from "@/components/routine/create-modal";
import { LexicalRenderer } from "@/components/ui/rich-text";
import Link from "next/link";
import { Query } from "appwrite";
import { Routines } from "@/lib/appwrite/types";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { useQuery } from "@tanstack/react-query";

export default function Page() {
  const { user } = useAuth();
  const { tables } = useAppwrite();

  const { data: routines = [], isLoading: loadingRoutines } = useQuery({
    queryKey: queryKeys.routines(),
    queryFn: async () => {
      const res = await tables.listRows<Routines>({
        databaseId,
        tableId: tableIds.routines,
        queries: [Query.equal("userId", user!.$id)],
      });
      return res.rows;
    },
    enabled: !!user?.$id,
  });

  return (
    <main className="flex flex-col gap-8 p-4 md:p-8 container mx-auto w-full">
      <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-2">
            My Routines <Beaker className="text-primary" />
          </h1>
          <p className="text-default-500 italic">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-2">
          <CreateRoutineModal />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
        {routines.map((routine) => (
          <Card
            key={routine.$id}
            isPressable
            as={Link}
            href={`/routines/${routine.$id}`}
            className="hover:border-secondary transition-colors border-1 border-transparent"
          >
            <CardBody className="p-4 flex flex-row justify-between items-center">
              <div>
                <p className="font-black uppercase tracking-tight">
                  {routine.name}
                </p>
                {routine.description ? (
                  <LexicalRenderer
                    className="text-tiny text-default-500 line-clamp-1"
                    state={JSON.parse(routine.description)}
                  />
                ) : (
                  <p className="text-tiny text-default-500 line-clamp-1">
                    No description
                  </p>
                )}
              </div>
              <ChevronRight size={16} className="text-default-400" />
            </CardBody>
          </Card>
        ))}
        {routines.length === 0 && !loadingRoutines && (
          <div className="col-span-full py-12 text-center bg-default-50 rounded-2xl border-2 border-dashed border-default-200">
            <p className="text-default-400">
              No routines found. Create your first one!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
