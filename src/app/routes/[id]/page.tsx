"use client";

import { Button, Chip, Spinner, Tab, Tabs } from "@heroui/react";
import { Calendar, CheckCircle2, Save } from "lucide-react";
import { Regiments, Routines } from "@/lib/appwrite/appwrite";

import { use } from "react";
import { useAppwrite } from "@/contexts/appwrite";
import { useQuery } from "@tanstack/react-query";

export default function Page({ params }: PageProps<"/routines/[id]">) {
  const { id } = use(params);
  const { tables } = useAppwrite();

  // 1. Fetch Routine with nested Regiments and Steps
  const { data: routine, isLoading } = useQuery({
    queryKey: ["routine", id],
    queryFn: async () => {
      return await tables.getRow<Routines>({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_ROUTINES_TABLE_ID!,
        rowId: id,
      });
    },
  });

  if (isLoading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  if (!routine) return <div>Routine not found.</div>;

  return (
    <div className="container mx-auto px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">
              {routine.name}
            </h1>
            <Chip
              color="secondary"
              variant="flat"
              size="sm"
              className="font-bold"
            >
              ROUTINE
            </Chip>
          </div>
          <p className="text-default-500 font-medium">
            Manage your regiments and product steps
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-success text-tiny font-bold flex items-center gap-1">
              <CheckCircle2 size={14} /> SAVED
            </span>
          )}
          <Button
            isIconOnly
            variant="flat"
            isLoading={saving}
            color={saved ? "success" : "default"}
          >
            <Save size={18} />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Description / Rich Text */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-1 bg-default-50 rounded-2xl border-1 border-default-200">
            <div className="p-4 border-b-1 border-default-200 flex justify-between items-center">
              <span className="text-tiny font-black uppercase tracking-widest text-default-400">
                Notes & Guidance
              </span>
            </div>
            {/* Pass your editor here */}
            <RoutineDescriptionEditor
              initialState={initialDescription}
              onSave={saveDescription}
            />
          </div>
        </div>

        {/* Right: Regiments & Steps */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Calendar size={22} className="text-secondary" /> Regiments
            </h2>
            <Button
              size="sm"
              color="secondary"
              variant="flat"
              className="font-bold uppercase"
            >
              Add Regiment
            </Button>
          </div>

          <Tabs
            aria-label="Regiments"
            color="secondary"
            variant="bordered"
            classNames={{ tabList: "border-1 border-default-200" }}
          >
            {routine.regiment?.map((reg) => (
              <Tab key={reg.$id} title={reg.type.toUpperCase()}>
                <RegimentManager regiment={reg} />
              </Tab>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function RegimentManager({ regiment }: { regiment: Regiments }) {
  return (
    <div className="py-4 space-y-4">
      {regiment.steps
        ?.sort((a, b) => a.order - b.order)
        .map((step, idx) => (
          <div
            key={step.$id}
            className="group flex items-center gap-4 p-4 rounded-2xl bg-default-50 border-1 border-default-200 hover:border-secondary transition-all"
          >
            <div className="flex-none w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-black text-sm">
              {idx + 1}
            </div>

            <div className="flex-1">
              <h4 className="font-bold uppercase text-small">{step.name}</h4>
              <div className="flex gap-2 mt-1">
                {step.products?.map((p) => (
                  <Chip
                    key={p.$id}
                    size="sm"
                    variant="flat"
                    className="text-[10px] h-5"
                  >
                    {p.brand} {p.name}
                  </Chip>
                ))}
              </div>
            </div>

            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="opacity-0 group-hover:opacity-100"
            >
              <Settings2 size={16} />
            </Button>
          </div>
        ))}

      <Button
        fullWidth
        variant="dashed"
        className="border-2 border-dashed border-default-200 h-16 text-default-400 font-bold uppercase"
      >
        Add Step
      </Button>
    </div>
  );
}
