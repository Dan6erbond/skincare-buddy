"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  Button,
  Card,
  CardBody,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Skeleton,
  Spinner,
  Tab,
  Tabs,
  addToast,
  useDisclosure,
} from "@heroui/react";
import {
  Calendar,
  Clock,
  FlaskConical,
  GripVertical,
  History,
  Minus,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { CreateStepSchema, CreateStepValues } from "@/lib/schema";
import { ID, Permission, Query, Role } from "appwrite";
import {
  Products,
  Regiments,
  RegimentsType,
  Routines,
  Steps,
  StepsHistory,
} from "@/lib/appwrite/types";
import { Reorder, useDragControls } from "framer-motion";
import { databaseId, tableIds } from "@/lib/appwrite/const";
import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";
import { use, useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { AIExportButton } from "@/components/ui/ai-export-button";
import { ModelCreate } from "@/lib/appwrite/utils";
import ProductListbox from "@/components/product/listbox";
import ProductSelect from "@/components/product/select";
import { RoutineDescription } from "./description";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/hooks/use-profile";
import { zodResolver } from "@hookform/resolvers/zod";

export default function Page({ params }: PageProps<"/routines/[id]">) {
  const { id } = use(params);
  const { tables } = useAppwrite();

  const { profile } = useProfile();

  // 1. Fetch Routine with nested Regiments and Steps
  const { data: routine, isLoading } = useQuery({
    queryKey: queryKeys.routine(id),
    queryFn: async () => {
      return await tables.getRow<Routines>({
        databaseId,
        tableId: tableIds.routines,
        rowId: id,
        // Ensure we select the relationship fields to populate the arrays
        queries: [
          Query.select([
            "*",
            "regiment.*",
            "regiment.steps.*",
            "regiment.steps.products.*",
          ]),
        ],
      });
    },
  });

  const stepResults = useQueries({
    queries:
      routine?.regiment
        ?.flatMap((r) => r.steps)
        .map((step) => ({
          queryKey: queryKeys.step(step.$id),
          queryFn: async () => {
            return await tables.getRow<Steps>({
              databaseId,
              tableId: tableIds.steps,
              rowId: step.$id,
              queries: [
                Query.select([
                  "*",
                  "products.*",
                  "histories.*",
                  "histories.products.*",
                ]),
              ],
            });
          },
        })) ?? [],
  });

  const routineAnalysisText = useMemo(() => {
    if (!routine) return;

    // 1. Format Profile Context
    const profileSection = profile
      ? `### Target Skin Profile\n` +
        `- **Type:** ${profile.skinType || "Unspecified"}\n` +
        `- **Sensitivity:** ${profile.hasSensitiveSkin ? "High/Sensitive" : "Normal"}\n` +
        `- **Primary Concerns:** ${profile.skinIssues?.length ? profile.skinIssues.join(", ") : "General maintenance"}\n\n`
      : `### Target Skin Profile\n*No profile provided.*\n\n`;

    const header =
      `### Routine Analysis: ${routine.name}\n` +
      `*Generated on: ${new Date().toLocaleDateString()}*\n\n` +
      `Please analyze this skincare routine for the skin profile provided above. Check for:\n` +
      `1. Ingredient conflicts (e.g., actives that shouldn't mix).\n` +
      `2. Proper order of application (thin-to-thick, pH considerations).\n` +
      `3. Compatibility with the user's specific skin type and concerns.\n\n---\n\n`;

    // 2. Map through regiments (Morning/Night/etc)
    const regimentsBody = routine.regiment
      ?.map((reg) => {
        const stepsMarkdown = reg.steps
          .map((step, index) => {
            // Use stepResults if available to get the most hydrated product data
            const currentStepData =
              stepResults.find((r) => r.data?.$id === step.$id)?.data ?? step;

            const productList =
              currentStepData.products
                ?.map((p) => `    - ${p.brand}: ${p.name} (${p.category})`)
                .join("\n") || "    - No product assigned";

            return `${index + 1}. **${step.name}**\n${productList}${step.description ? `\n    - *Note: ${step.description}*` : ""}`;
          })
          .join("\n\n");

        return `## ${reg.type.toUpperCase()} REGIMENT\n${stepsMarkdown || "No steps added yet."}`;
      })
      .join("\n\n---\n\n");

    // Combine: Profile first, then Header/Instructions, then the Routine data
    return profileSection + header + regimentsBody;
  }, [routine, stepResults, profile]);

  if (isLoading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  if (!routine) return <div>Routine not found.</div>;

  return (
    <div className="container mx-auto px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="flex flex-col md:flex-row gap-4 justify-between items-start">
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

        <div className="flex gap-2">
          {routineAnalysisText && (
            <AIExportButton
              variant="shadow"
              color="secondary"
              size="md"
              clipboardText={routineAnalysisText}
              startContent={<Sparkles className="size-4" />}
            >
              AI Analysis
            </AIExportButton>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Right: Regiments & Steps */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Calendar size={22} className="text-secondary" /> Regiments
            </h2>

            {/* ADD MODAL HERE */}
            <CreateRegimentModal routineId={id} />
          </div>

          <Tabs
            aria-label="Regiments"
            color="secondary"
            variant="bordered"
            className="mb-2 max-w-full"
            classNames={{ tabList: "border-1 border-default-200" }}
          >
            {routine.regiment?.map((reg) => (
              <Tab key={reg.$id} title={reg.type.toUpperCase()}>
                <RegimentManager regiment={reg} routineId={id} />
              </Tab>
            ))}
          </Tabs>
        </div>

        {/* Left: Description / Rich Text */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-1 bg-default-50 rounded-2xl border-1 border-default-200">
            <div className="p-4 border-b-1 border-default-200 flex justify-between items-center">
              <span className="text-tiny font-black uppercase tracking-widest text-default-400">
                Notes & Guidance
              </span>
            </div>
            {/* Pass your editor here */}
            <RoutineDescription routine={routine} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RegimentManager({
  regiment,
  routineId,
}: {
  regiment: Regiments;
  routineId: string;
}) {
  const { tables } = useAppwrite();
  const queryClient = useQueryClient();

  // Local state for smooth dragging
  const [items, setItems] = useState(regiment.steps || []);

  // Keep local state in sync with server data
  useEffect(() => {
    const sortedSteps = [...(regiment.steps || [])].sort((a, b) => {
      if (a.order && b.order) return a.order.localeCompare(b.order);
      return 0; // Fallback to default Appwrite order if keys aren't set yet
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(sortedSteps);
  }, [regiment.steps]);

  const { mutate: updateStepOrder } = useMutation({
    mutationFn: async ({ id, order }: { id: string; order: string }) => {
      return await tables.updateRow({
        databaseId,
        tableId: tableIds.steps,
        rowId: id,
        data: { order },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routine(routineId) });
    },
  });

  const handleReorder = async (newOrder: Steps[]) => {
    // 1. Identify what moved
    const movedIndex = newOrder.findIndex(
      (item, i) => item.$id !== items[i]?.$id,
    );
    if (movedIndex === -1) return;

    const movedItem = newOrder[movedIndex];

    // 2. Check if initialization is needed (any null orders)
    const needsInitialization = newOrder.some((s) => !s.order);

    if (needsInitialization) {
      const keys = generateNKeysBetween(null, null, newOrder.length);

      addToast({
        title: "Order Initialized",
        description:
          "An initial order was set. You may need to refresh if changes don't appear.",
        color: "warning",
      });

      // Update all items in the background
      await Promise.all(
        newOrder.map((s, i) =>
          tables.updateRow({
            databaseId,
            tableId: tableIds.steps,
            rowId: s.$id,
            data: { order: keys[i] },
          }),
        ),
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.routine(routineId) });
      return;
    }

    // 3. Normal Fractional Indexing
    const before = newOrder[movedIndex - 1]?.order; // null if first
    const after = newOrder[movedIndex + 1]?.order; // null if last
    const newKey = generateKeyBetween(before, after);

    // Optimistic UI update
    setItems(newOrder);

    // Server update
    updateStepOrder({ id: movedItem.$id, order: newKey });
  };

  return (
    <div className="space-y-4">
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={handleReorder}
        className="space-y-3"
      >
        {items.map((step, idx) => (
          <StepManager
            key={step.$id}
            step={step}
            index={idx}
            routineId={routineId}
          />
        ))}
      </Reorder.Group>

      <CreateStepModal
        regimentId={regiment.$id}
        routineId={routineId}
        lastOrder={items[items.length - 1]?.order ?? null}
      />
    </div>
  );
}

function CreateRegimentModal({ routineId }: { routineId: string }) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { tables } = useAppwrite();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [type, setType] = useState<RegimentsType>(RegimentsType.MORNING);

  const { mutate: createRegiment, isPending } = useMutation({
    mutationFn: async () => {
      return await tables.createRow<
        Omit<ModelCreate<Regiments>, "routine"> & { routine: string }
      >({
        databaseId,
        tableId: tableIds.regiments,
        rowId: ID.unique(),
        data: {
          type,
          routine: routineId, // Now correctly accepted as a string
        },
        permissions: [
          Permission.read(Role.user(user!.$id)),
          Permission.update(Role.user(user!.$id)),
          Permission.delete(Role.user(user!.$id)),
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routine(routineId) });
      onClose();
    },
  });

  return (
    <>
      <Button
        onPress={onOpen}
        size="sm"
        color="secondary"
        variant="flat"
        className="font-bold uppercase"
        startContent={<Plus size={16} />}
      >
        Add Regiment
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader className="uppercase font-black flex items-center gap-2">
            <Clock className="text-secondary" size={20} /> New Regiment
          </ModalHeader>
          <ModalBody>
            <Select
              label="Select Time of Day"
              variant="bordered"
              selectedKeys={[type]}
              onSelectionChange={(keys) =>
                setType(Array.from(keys)[0] as RegimentsType)
              }
            >
              <SelectItem key={RegimentsType.MORNING}>Morning</SelectItem>
              <SelectItem key={RegimentsType.NIGHT}>Night</SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="secondary"
              onPress={() => createRegiment()}
              isLoading={isPending}
              className="font-bold"
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

interface CreateStepModalProps {
  regimentId: string;
  routineId: string;
  lastOrder: string | null;
}

function CreateStepModal({
  regimentId,
  routineId,
  lastOrder,
}: CreateStepModalProps) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { tables } = useAppwrite();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<CreateStepValues>({
    resolver: zodResolver(CreateStepSchema),
    defaultValues: { name: "", description: "", productIds: [] },
    mode: "onChange",
  });

  const { mutate: createStep, isPending } = useMutation({
    mutationFn: async (values: CreateStepValues) => {
      // Generate the new key: (lastOrder, null) puts it at the end
      const newOrder = generateKeyBetween(lastOrder, null);

      return await tables.createRow<
        Omit<ModelCreate<Steps>, "regiment" | "products"> & {
          regiment: string;
          products: string[];
          order: string;
        }
      >({
        databaseId,
        tableId: tableIds.steps,
        rowId: ID.unique(),
        data: {
          name: values.name,
          description: values.description ?? null,
          regiment: regimentId,
          products: values.productIds,
          order: newOrder,
        },
        permissions: [
          Permission.read(Role.user(user!.$id)),
          Permission.update(Role.user(user!.$id)),
          Permission.delete(Role.user(user!.$id)),
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routine(routineId) });
      onClose();
      form.reset();
    },
  });

  return (
    <>
      <Button
        fullWidth
        variant="ghost"
        onPress={onOpen}
        className="border-2 border-dashed border-default-200 h-16 text-default-400 font-bold uppercase hover:bg-default-100 hover:border-default-400 transition-all"
        startContent={<Plus size={20} />}
      >
        Add Step
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
        <ModalContent>
          <form onSubmit={form.handleSubmit((data) => createStep(data))}>
            <ModalHeader className="uppercase font-black flex items-center gap-2">
              <FlaskConical size={20} className="text-secondary" /> New Step
            </ModalHeader>
            <ModalBody>
              <Input
                {...form.register("name")}
                label="Step Name"
                placeholder="e.g., Double Cleanse"
                variant="bordered"
                isInvalid={!!form.formState.errors.name}
                errorMessage={form.formState.errors.name?.message}
              />

              <Controller
                name="productIds"
                control={form.control}
                render={({
                  field: { value, onChange, ...field },
                  fieldState: { invalid, error },
                }) => (
                  <div className="flex flex-col gap-2">
                    {/* Label for the Listbox since it doesn't have a built-in one like Select */}
                    <span className="text-small font-medium text-default-700">
                      Formulas in this step
                    </span>

                    <ProductListbox
                      variant="bordered"
                      selectionMode="multiple"
                      selectedKeys={new Set(value)}
                      onSelectionChange={(keys) => {
                        // If HeroUI selection is 'all', you might need to handle that,
                        // but for standard multi-select, Array.from(keys) is perfect.
                        onChange(Array.from(keys));
                      }}
                      // Listbox doesn't have isInvalid/errorMessage props by default,
                      // so we apply styling or helper text manually or via classNames.
                      className={invalid ? "border-danger" : ""}
                      {...field}
                    />

                    {invalid && (
                      <span className="text-tiny text-danger">
                        {error?.message}
                      </span>
                    )}
                  </div>
                )}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="secondary"
                type="submit"
                isLoading={isPending}
                className="font-bold"
              >
                Create Step
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}

function StepManager({
  index,
  routineId,
  step: initialStep,
}: {
  index: number;
  routineId: string;
  step: Steps;
}) {
  const { tables } = useAppwrite();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const controls = useDragControls();

  const { data: step, isLoading } = useQuery({
    queryKey: queryKeys.step(initialStep.$id),
    queryFn: async () => {
      return await tables.getRow<Steps>({
        databaseId,
        tableId: tableIds.steps,
        rowId: initialStep.$id,
        queries: [
          Query.select([
            "*",
            "products.*",
            "histories.*",
            "histories.products.*",
          ]),
        ],
      });
    },
  });

  if (isLoading) return <Skeleton className="h-24 w-full rounded-2xl" />;

  return (
    <Reorder.Item
      value={initialStep}
      dragListener={false}
      dragControls={controls}
      className="list-none"
    >
      <Card
        fullWidth
        isHoverable
        className="group border-1 border-default-200 hover:border-secondary transition-colors"
        shadow="sm"
      >
        <CardBody className="flex flex-row items-center gap-4 p-4">
          {/* Drag Handle using Lucide and Tailwind */}
          <div
            className="cursor-grab active:cursor-grabbing p-1 text-default-400 hover:text-secondary transition-colors"
            onPointerDown={(e) => controls.start(e)}
          >
            <GripVertical size={20} />
          </div>

          <div className="flex-none w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-black text-sm">
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold uppercase text-medium text-foreground">
              {initialStep.name}
            </h4>
            <div className="flex gap-2 mt-1 flex-wrap">
              {step?.products?.map((p) => (
                <Chip
                  key={p.$id}
                  variant="flat"
                  size="sm"
                  classNames={{ content: "truncate" }}
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
            onPress={onOpen}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Settings2 size={18} className="text-default-500" />
          </Button>
        </CardBody>
      </Card>

      {step && (
        <StepSettingsDrawer
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          step={step}
          routineId={routineId}
        />
      )}
    </Reorder.Item>
  );
}

const getProductDiff = (
  current: Products[] = [],
  historical: Products[] = [],
) => {
  // Ensure we have arrays to work with
  const safeCurrent = current ?? [];
  const safeHistorical = historical ?? [];

  const currentIds = new Set(safeCurrent.map((p) => p.$id));
  const historicalIds = new Set(safeHistorical.map((p) => p.$id));

  return {
    removed: safeHistorical.filter((p) => !currentIds.has(p.$id)),
    added: safeCurrent.filter((p) => !historicalIds.has(p.$id)),
    unchanged: safeCurrent.filter((p) => historicalIds.has(p.$id)),
  };
};

function StepSettingsDrawer({
  isOpen,
  onOpenChange,
  step,
  routineId,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  step: Steps;
  routineId: string;
}) {
  const { user } = useAuth();
  const { tables } = useAppwrite();
  const queryClient = useQueryClient();

  const { control, handleSubmit } = useForm<CreateStepValues>({
    resolver: zodResolver(CreateStepSchema),
    defaultValues: {
      name: step.name,
      description: step.description ?? "",
      productIds: step.products?.map((p) => p.$id) ?? [],
    },
  });

  // 1. Update Mutation
  const { mutate: updateStep, isPending: isUpdating } = useMutation({
    mutationFn: async (values: CreateStepValues) => {
      // A. Create the history entry using the CURRENT state of the step
      await tables.createRow<
        Omit<ModelCreate<StepsHistory>, "products"> & {
          products: string[];
        }
      >({
        databaseId,
        tableId: tableIds.stepsHistory,
        rowId: ID.unique(),
        data: {
          step: step.$id,
          products: step.products.map((p) => p.$id),
        },
        permissions: [Permission.read(Role.user(user!.$id))],
      });

      // B. Update the actual step with NEW values
      return await tables.updateRow<
        Omit<ModelCreate<Steps>, "regiment" | "products"> & {
          products: string[];
        }
      >({
        databaseId,
        tableId: tableIds.steps,
        rowId: step.$id,
        data: {
          name: values.name,
          description: values.description ?? null,
          products: values.productIds,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.step(step.$id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.routine(routineId) });
      onOpenChange(false);
    },
  });

  // 2. Delete Mutation
  const { mutate: deleteStep, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      return await tables.deleteRow({
        databaseId,
        tableId: tableIds.steps,
        rowId: step.$id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routine(routineId) });
      onOpenChange(false);
    },
  });

  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex items-center gap-2 uppercase font-black">
              <FlaskConical className="text-secondary" /> Step Settings
            </DrawerHeader>
            <DrawerBody className="gap-6">
              <Controller
                name="name"
                control={control}
                render={({
                  field: { value, onChange, ...field },
                  fieldState: { invalid, error },
                }) => (
                  <Input
                    label="Step Name"
                    variant="bordered"
                    value={value}
                    onValueChange={onChange}
                    isInvalid={invalid}
                    errorMessage={error?.message}
                    {...field}
                  />
                )}
              />

              <Controller
                name="productIds"
                control={control}
                render={({
                  field: { value, onChange, ...field },
                  fieldState: { invalid, error },
                }) => (
                  <div className="flex flex-col gap-2">
                    {/* Label for the Listbox since it doesn't have a built-in one like Select */}
                    <span className="text-small font-medium text-default-700">
                      Formulas in this step
                    </span>

                    <ProductListbox
                      variant="bordered"
                      selectionMode="multiple"
                      selectedKeys={new Set(value)}
                      onSelectionChange={(keys) => {
                        // If HeroUI selection is 'all', you might need to handle that,
                        // but for standard multi-select, Array.from(keys) is perfect.
                        onChange(Array.from(keys));
                      }}
                      // Listbox doesn't have isInvalid/errorMessage props by default,
                      // so we apply styling or helper text manually or via classNames.
                      className={invalid ? "border-danger" : ""}
                      {...field}
                    />

                    {invalid && (
                      <span className="text-tiny text-danger">
                        {error?.message}
                      </span>
                    )}
                  </div>
                )}
              />

              {/* Full History Diff Timeline */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2">
                  <History className="text-primary size-5" />
                  <h3 className="text-small font-bold uppercase tracking-wider">
                    Product Evolution
                  </h3>
                  <Chip size="sm" variant="flat" className="h-5 text-[10px]">
                    {Math.max(0, (step.histories?.length || 0) - 1)} Changes
                  </Chip>
                </div>

                {step.histories
                  ?.slice(1)
                  .reverse()
                  .map((currentEntry) => {
                    // Because we sliced and reversed, we need to find the "previous"
                    // entry relative to the original array order.
                    // Original index of currentEntry is:
                    const originalIndex = step.histories.indexOf(currentEntry);
                    const previousEntry = step.histories[originalIndex - 1];

                    const { added, removed } = getProductDiff(
                      currentEntry.products,
                      previousEntry.products,
                    );

                    const hasChanges = added.length > 0 || removed.length > 0;
                    if (!hasChanges) return null; // Skip if no products actually changed

                    return (
                      <div
                        key={currentEntry.$id}
                        className="relative pl-6 border-l-2 border-divider pb-2 ml-2"
                      >
                        {/* Timeline Dot */}
                        <div className="absolute -left-2.25 top-1 w-4 h-4 rounded-full bg-background border-2 border-primary" />

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-small font-bold">
                              Product Update
                            </span>
                            <span className="text-tiny text-default-400 font-mono">
                              {new Date(currentEntry.$createdAt).toLocaleString(
                                [],
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {added.map((p) => (
                              <Chip
                                key={`add-${p.$id}`}
                                size="sm"
                                color="success"
                                variant="flat"
                                startContent={<Plus size={12} />}
                              >
                                {p.name}
                              </Chip>
                            ))}
                            {removed.map((p) => (
                              <Chip
                                key={`rem-${p.$id}`}
                                size="sm"
                                color="danger"
                                variant="flat"
                                className="line-through"
                                startContent={<Minus size={12} />}
                              >
                                {p.name}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="pt-4 border-t border-divider">
                <Button
                  color="danger"
                  variant="flat"
                  startContent={<Trash2 size={18} />}
                  className="font-bold uppercase w-full"
                  isLoading={isDeleting}
                  onPress={() => {
                    if (confirm("Are you sure you want to remove this step?")) {
                      deleteStep();
                    }
                  }}
                >
                  Remove Step
                </Button>
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button variant="light" onPress={onClose} isDisabled={isUpdating}>
                Cancel
              </Button>
              <Button
                color="primary"
                className="font-bold"
                isLoading={isUpdating}
                onPress={() => handleSubmit((data) => updateStep(data))()}
              >
                Save Changes
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
