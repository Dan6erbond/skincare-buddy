"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  Button,
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
} from "@/lib/appwrite/appwrite";
import { use, useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ModelCreate } from "@/lib/appwrite/utils";
import { RoutineDescription } from "./description";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { zodResolver } from "@hookform/resolvers/zod";

export default function Page({ params }: PageProps<"/routines/[id]">) {
  const { id } = use(params);
  const { tables } = useAppwrite();

  // 1. Fetch Routine with nested Regiments and Steps
  const { data: routine, isLoading } = useQuery({
    queryKey: queryKeys.routine(id),
    queryFn: async () => {
      return await tables.getRow<Routines>({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_ROUTINES_TABLE_ID!,
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

  const queryClient = useQueryClient();

  const copyRoutineToAI = useCallback(() => {
    if (!routine) return;

    const header =
      `### Routine Analysis: ${routine.name}\n` +
      `*Generated on: ${new Date().toLocaleDateString()}*\n\n` +
      `Please analyze this skincare routine. Check for:\n` +
      `1. Ingredient conflicts (e.g., actives that shouldn't mix).\n` +
      `2. Proper order of application (thin-to-thick, pH considerations).\n` +
      `3. Missing steps or redundancy.\n\n---\n`;

    // Map through regiments (Morning/Night/etc)
    const regimentsBody = routine.regiment
      ?.map((reg) => {
        const stepsMarkdown = reg.steps
          .map((step, index) => {
            const productList =
              (
                (queryClient.getQueryData(["step", step.$id]) as Steps) ?? step
              ).products
                ?.map((p) => `    - ${p.brand}: ${p.name} (${p.category})`)
                .join("\n") || "    - No product assigned";
            return `${index + 1}. **${step.name}**\n${productList}${step.description ? `\n    - *Note: ${step.description}*` : ""}`;
          })
          .join("\n\n");

        return `## ${reg.type.toUpperCase()} REGIMENT\n${stepsMarkdown || "No steps added yet."}`;
      })
      .join("\n\n---\n\n");

    const finalMarkdown = header + regimentsBody;

    navigator.clipboard
      .writeText(finalMarkdown)
      .then(() => {
        addToast({
          title: "Routine Copied",
          description: "Ready for AI deep-dive analysis.",
          color: "secondary",
          shouldShowTimeoutProgress: true,
        });
      })
      .catch(() => {
        addToast({
          title: "Error",
          description: "Clipboard access denied.",
          color: "danger",
        });
      });
  }, [routine, queryClient]);

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

        <div className="flex gap-2">
          <Button
            variant="shadow"
            color="secondary"
            size="md"
            onPress={copyRoutineToAI}
            startContent={<Sparkles size={18} />}
            className="font-bold uppercase tracking-wider"
          >
            AI Analysis
          </Button>
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
            className="mb-2"
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
  return (
    <div className="space-y-4">
      {regiment.steps?.map((step, idx) => (
        <StepManager
          key={step.$id}
          stepId={step.$id}
          index={idx}
          routineId={routineId}
        />
      ))}

      <CreateStepModal regimentId={regiment.$id} routineId={routineId} />
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
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_REGIMENTS_TABLE_ID!,
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
}

function CreateStepModal({ regimentId, routineId }: CreateStepModalProps) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { tables } = useAppwrite();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: queryKeys.products(),
    queryFn: async () => {
      const res = await tables.listRows<Products>({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_PRODUCTS_TABLE_ID!,
        queries: [
          Query.equal("userId", user!.$id),
          // We could also filter for only un-finished units here
        ],
      });
      return res.rows;
    },
    enabled: isOpen, // Only fetch when the modal actually opens
  });

  const form = useForm<CreateStepValues>({
    resolver: zodResolver(CreateStepSchema),
    defaultValues: { name: "", description: "", productIds: [] },
    mode: "onChange",
  });

  const { mutate: createStep, isPending } = useMutation({
    mutationFn: async (values: CreateStepValues) => {
      return await tables.createRow<
        Omit<ModelCreate<Steps>, "regiment" | "products"> & {
          regiment: string;
          products: string[];
        }
      >({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_STEPS_TABLE_ID!,
        rowId: ID.unique(),
        data: {
          name: values.name,
          description: values.description ?? null,
          regiment: regimentId,
          products: values.productIds,
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
                  <Select
                    label="Products"
                    placeholder="Select formulas..."
                    selectionMode="multiple"
                    variant="bordered"
                    isLoading={isLoadingProducts}
                    selectedKeys={new Set(value)}
                    onSelectionChange={(keys) => {
                      if (keys === "all") {
                        onChange(products.map((p) => p.$id));
                      } else {
                        onChange(Array.from(keys as Set<string>));
                      }
                    }}
                    isInvalid={invalid}
                    errorMessage={error?.message}
                    {...field}
                  >
                    {products.map((p) => (
                      <SelectItem
                        key={p.$id}
                        textValue={`${p.brand} ${p.name}`}
                      >
                        <div className="flex flex-col">
                          <span className="text-small font-bold">{p.name}</span>
                          <span className="text-tiny text-default-400">
                            {p.brand}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
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
  stepId,
  index,
  routineId,
}: {
  stepId: string;
  index: number;
  routineId: string;
}) {
  const { tables } = useAppwrite();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // 1. Fetch deep step details (including products)
  const { data: step, isLoading } = useQuery({
    queryKey: queryKeys.step(stepId),
    queryFn: async () => {
      return await tables.getRow<Steps>({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_STEPS_TABLE_ID!,
        rowId: stepId,
        queries: [Query.select(["*", "products.*"])],
      });
    },
  });

  // 2. Fetch all products for the Select in the drawer
  const { data: allProducts = [] } = useQuery({
    queryKey: queryKeys.products(),
    queryFn: async () => {
      const res = await tables.listRows<Products>({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_PRODUCTS_TABLE_ID!,
      });
      return res.rows;
    },
    enabled: isOpen, // Only fetch when drawer is open
  });

  if (isLoading) return <Skeleton className="h-20 w-full rounded-2xl" />;
  if (!step) return null;

  return (
    <>
      <div className="group flex items-center gap-4 p-4 rounded-2xl bg-default-50 border-1 border-default-200 hover:border-secondary transition-all">
        <div className="flex-none w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-black text-sm">
          {index + 1}
        </div>

        <div className="flex-1">
          <h4 className="font-bold uppercase text-medium">{step.name}</h4>
          <div className="flex gap-2 mt-1 flex-wrap">
            {step.products?.map((p) => (
              <Chip key={p.$id} variant="flat">
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
          <Settings2 size={16} />
        </Button>
      </div>

      <StepSettingsDrawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        step={step}
        allProducts={allProducts}
        routineId={routineId}
      />
    </>
  );
}

function StepSettingsDrawer({
  isOpen,
  onOpenChange,
  step,
  allProducts,
  routineId, // Added this prop for cache invalidation
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  step: Steps;
  allProducts: Products[];
  routineId: string;
}) {
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
      return await tables.updateRow<
        Omit<ModelCreate<Steps>, "regiment" | "products"> & {
          products: string[];
        }
      >({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_STEPS_TABLE_ID!,
        rowId: step.$id,
        data: {
          name: values.name,
          description: values.description ?? null,
          products: values.productIds,
        },
      });
    },
    onSuccess: () => {
      // Invalidate both the specific step and the parent routine
      queryClient.invalidateQueries({ queryKey: queryKeys.step(step.$id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.routine(routineId) });
      onOpenChange(false);
    },
  });

  // 2. Delete Mutation
  const { mutate: deleteStep, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      return await tables.deleteRow({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_STEPS_TABLE_ID!,
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
                  <Select
                    label="Formulas in this step"
                    selectionMode="multiple"
                    variant="bordered"
                    selectedKeys={new Set(value)}
                    onSelectionChange={(keys) => onChange(Array.from(keys))}
                    isInvalid={invalid}
                    errorMessage={error?.message}
                    {...field}
                  >
                    {allProducts.map((p) => (
                      <SelectItem
                        key={p.$id}
                        textValue={`${p.brand} ${p.name}`}
                      >
                        <div className="flex flex-col">
                          <span className="text-small font-bold">{p.name}</span>
                          <span className="text-tiny text-default-400">
                            {p.brand}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />

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
