"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  AlertCircle,
  ArrowDownUp,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Beaker,
  Bookmark,
  ChevronRight,
  DollarSign,
  ListTodo,
  Package,
  Plus,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Type,
} from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  DatePicker,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  NumberInput,
  Select,
  SelectItem,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  User,
  addToast,
  useDisclosure,
} from "@heroui/react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  CreateRoutineSchema,
  CreateRoutineValues,
  ProductFormValues,
  ProductSchema,
} from "@/lib/schema";
import { ID, Permission, Query, Role } from "appwrite";
import {
  Products,
  Routines,
  UnitsPeriodAfterOpeningUnit,
} from "@/lib/appwrite/appwrite";
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { LexicalRenderer } from "@/components/ui/rich-text";
import Link from "next/link";
import { ModelCreate } from "@/lib/appwrite/utils";
import { getLocalTimeZone } from "@internationalized/date";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

export default function Page() {
  const { user } = useAuth();
  const { tables } = useAppwrite();
  const now = useMemo(() => new Date(), []);

  const [sortDirections, setSortDirections] = useState<
    Record<string, "asc" | "desc">
  >({});

  const sortOptions = [
    { key: "brand", label: "Brand", icon: <Bookmark size={16} /> },
    { key: "name", label: "Name", icon: <Type size={16} /> },
    { key: "category", label: "Category", icon: <Tag size={16} /> },
    { key: "price", label: "Price", icon: <DollarSign size={16} /> },
    { key: "rating", label: "Rating", icon: <Star size={16} /> },
  ];

  const { data: products = [], isLoading } = useQuery({
    queryKey: queryKeys.products(sortDirections),
    queryFn: async ({ queryKey: [_, sortDirections] }) => {
      if (!user?.$id) return [];

      const orderQueries = Object.entries(sortDirections).map(([key, dir]) =>
        dir === "desc" ? Query.orderDesc(key) : Query.orderAsc(key),
      );

      const res = await tables.listRows<Products>({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_PRODUCTS_TABLE_ID!,
        queries: [
          Query.equal("userId", user.$id),
          Query.select(["*", "units.*"]),
          ...orderQueries,
          Query.orderAsc("$updatedAt"),
          Query.orderAsc("$createdAt"),
        ],
      });
      return res.rows;
    },
    enabled: !!user?.$id,
  });

  const copyInventoryToAI = useCallback(() => {
    if (!products.length) {
      addToast({
        title: "Export Failed",
        description: "Your shelf is currently empty.",
        color: "danger",
      });
      return;
    }

    const header =
      `### Skincare Inventory Analysis Request\n` +
      `*User Shelf Export - ${new Date().toLocaleDateString()}*\n\n` +
      `Please review my current products. Focus on ingredient synergies, potential irritation risks, and routine optimization.\n\n---\n`;

    const inventoryBody = products
      .map((p) => {
        const rating = p.rating ? "★".repeat(p.rating) : "No rating";
        const activeUnits = p.units?.filter((u) => !u.finishedAt).length || 0;

        return `**${p.brand}: ${p.name}** (${p.category})
- Status: ${activeUnits} units in stock
- My Rating: ${rating}`;
      })
      .join("\n\n");

    navigator.clipboard
      .writeText(header + inventoryBody)
      .then(() => {
        addToast({
          title: "Copied to Clipboard",
          description: "Inventory formatted for AI analysis.",
          color: "success",
          shouldShowTimeoutProgress: true,
        });
      })
      .catch(() => {
        addToast({
          title: "Copy Error",
          description: "Could not access clipboard.",
          color: "danger",
        });
      });
  }, [products]);

  const { data: routines = [], isLoading: loadingRoutines } = useQuery({
    queryKey: queryKeys.routines(),
    queryFn: async () => {
      const res = await tables.listRows<Routines>({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_ROUTINES_TABLE_ID!,
        queries: [Query.equal("userId", user!.$id)],
      });
      return res.rows;
    },
    enabled: !!user?.$id,
  });

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 container mx-auto w-full">
      <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-2">
            My Vanity <Beaker className="text-primary" />
          </h1>
          <p className="text-default-500 italic">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-2">
          <CreateRoutineModal />
          <CreateProductModal sortDirections={sortDirections} />
        </div>
      </header>

      <Tabs
        aria-label="Dashboard Options"
        color="primary"
        variant="underlined"
        classNames={{
          tabList: "gap-6",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
        }}
      >
        <Tab
          key="shelf"
          title={
            <div className="flex items-center gap-2 uppercase font-bold">
              <Package size={18} /> <span>Product Shelf</span>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-default-50 p-3 rounded-xl border border-divider">
              <div className="text-small text-default-500 font-medium">
                Total Items:{" "}
                <span className="text-primary font-bold">
                  {products.length}
                </span>
              </div>
              <Button
                size="sm"
                color="secondary"
                variant="flat"
                onPress={copyInventoryToAI}
                startContent={<Sparkles size={16} />} // Using Sparkles to imply AI/Magic
                className="font-bold uppercase tracking-wider"
              >
                Export for AI
              </Button>
            </div>

            <Table
              topContent={
                <div className="flex justify-end">
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
                        // If user clicks a key that is already selected, toggle its direction
                        if (key in sortDirections) {
                          if (sortDirections[key] === "asc") {
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
                            [key]: "asc" as const,
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
              aria-label="Inventory"
            >
              <TableHeader>
                <TableColumn className="uppercase tracking-wider">
                  Formula
                </TableColumn>
                <TableColumn className="uppercase tracking-wider">
                  Category
                </TableColumn>
                <TableColumn className="uppercase tracking-wider">
                  Inventory
                </TableColumn>
                <TableColumn className="uppercase tracking-wider">
                  Status
                </TableColumn>
                <TableColumn className="uppercase tracking-wider">
                  Price
                </TableColumn>
              </TableHeader>
              <TableBody
                items={products}
                isLoading={isLoading}
                emptyContent="Shelf is empty."
              >
                {(product) => {
                  const activeUnits =
                    product.units?.filter((u) => !u.finishedAt) || [];
                  const openedUnit = activeUnits.find((u) => u.openedAt);

                  // Logic to find earliest relevant expiry
                  const urgentDate = activeUnits.reduce(
                    (earliest: Date | null, unit) => {
                      const exp = unit.expiresAt
                        ? new Date(unit.expiresAt)
                        : null;
                      if (!earliest || (exp && exp < earliest)) return exp;
                      return earliest;
                    },
                    null,
                  );

                  return (
                    <TableRow
                      key={product.$id}
                      className="border-b border-divider last:border-none cursor-pointer hover:bg-content2"
                      as={Link}
                      href={`/products/${product.$id}`}
                    >
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color="secondary"
                          className="uppercase font-bold"
                        >
                          {product.category}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package size={14} className="text-default-400" />
                          <span className="font-semibold">
                            {activeUnits.length} Units
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>{product.price.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                }}
              </TableBody>
            </Table>
          </div>
        </Tab>

        <Tab
          key="routines"
          title={
            <div className="flex items-center gap-2 uppercase font-bold">
              <ListTodo size={18} /> <span>Routines</span>
            </div>
          }
        >
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
        </Tab>
      </Tabs>
    </div>
  );
}

const categories = [
  { key: "cleanser", label: "Cleanser" },
  { key: "toner", label: "Toner" },
  { key: "essence", label: "Essence" },
  { key: "serum", label: "Serum" },
  { key: "moisturizer", label: "Moisturizer" },
  { key: "eye-cream", label: "Eye cream" },
  { key: "spf", label: "SPF" },
  { key: "peeling", label: "Peeling" },
  { key: "mask", label: "Mask" },
  { key: "sheet-mask", label: "Sheet mask" },
  { key: "eye-mask", label: "Eye mask" },
  { key: "spot-treatment", label: "Spot treatment" },
  { key: "lip-balm", label: "Lip balm" },
  { key: "lip-mask", label: "Lip mask" },
];

function CreateProductModal({
  sortDirections,
}: {
  sortDirections: Record<string, "asc" | "desc">;
}) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { tables } = useAppwrite();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: "",
      brand: "",
      category: "serum",
      price: 0,
      units: [
        {
          periodAfterOpeningDuration: 12,
          periodAfterOpeningUnit: UnitsPeriodAfterOpeningUnit.MONTHS,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "units",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const unitsData = values.units.map((u) => ({
        purchaseDate:
          u.purchaseDate?.toDate(getLocalTimeZone()).toISOString() ?? null,
        expiresAt:
          u.expiresAt?.toDate(getLocalTimeZone()).toISOString() ?? null,
        openedAt: u.openedAt?.toDate(getLocalTimeZone()).toISOString() ?? null,
        periodAfterOpeningDuration: u.periodAfterOpeningDuration,
        periodAfterOpeningUnit: u.periodAfterOpeningUnit,
      }));

      return await tables.createRow<ModelCreate<Products>>({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_PRODUCTS_TABLE_ID!,
        rowId: ID.unique(),
        data: {
          name: values.name,
          brand: values.brand,
          category: values.category,
          price: values.price,
          userId: user!.$id,
          units: unitsData,
        },
        permissions: [
          Permission.read(Role.user(user!.$id)),
          Permission.update(Role.user(user!.$id)),
          Permission.delete(Role.user(user!.$id)),
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products(sortDirections),
      });
      form.reset();
      onClose();
    },
  });

  return (
    <>
      <Button
        onPress={onOpen}
        color="primary"
        variant="shadow"
        startContent={<Plus size={18} />}
        className="uppercase font-bold"
      >
        Add Formula
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        scrollBehavior="inside"
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={form.handleSubmit((data) => mutate(data))}>
              <ModalHeader className="uppercase tracking-tighter text-2xl font-black">
                New Product Batch
              </ModalHeader>

              <ModalBody className="gap-6 pb-8">
                {/* Section 1: Brand & Name */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    {...form.register("brand")}
                    label="Brand"
                    placeholder="e.g. Drunk Elephant"
                    variant="bordered"
                    labelPlacement="outside"
                    isInvalid={!!form.formState.errors.brand}
                    errorMessage={form.formState.errors.brand?.message}
                  />
                  <Input
                    {...form.register("name")}
                    label="Product Name"
                    placeholder="e.g. C-Firma Fresh"
                    variant="bordered"
                    labelPlacement="outside"
                    isInvalid={!!form.formState.errors.name}
                    errorMessage={form.formState.errors.name?.message}
                  />
                </div>

                {/* Section 2: Category & Price */}
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="category"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Category"
                        variant="bordered"
                        labelPlacement="outside"
                        selectedKeys={[field.value]}
                        onSelectionChange={(k) =>
                          field.onChange(Array.from(k)[0])
                        }
                      >
                        {categories.map((cat) => (
                          <SelectItem key={cat.key}>{cat.label}</SelectItem>
                        ))}
                      </Select>
                    )}
                  />
                  <Controller
                    name="price"
                    control={form.control}
                    render={({ field }) => (
                      <NumberInput
                        label="Price"
                        variant="bordered"
                        labelPlacement="outside"
                        onValueChange={field.onChange}
                        value={field.value}
                      />
                    )}
                  />
                </div>

                <Divider />

                {/* Section 3: Units Management */}
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-tiny font-bold uppercase text-default-500">
                      Inventory Units (Bottles/Jars)
                    </h4>
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      startContent={<Plus size={14} />}
                      onPress={() =>
                        append({
                          periodAfterOpeningDuration: 12,
                          periodAfterOpeningUnit:
                            UnitsPeriodAfterOpeningUnit.MONTHS,
                        })
                      }
                    >
                      Add Unit
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 rounded-xl border-1 border-default-200 bg-default-50 flex flex-col gap-4 relative"
                    >
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="light"
                        className="absolute top-2 right-2"
                        onPress={() => remove(index)}
                      >
                        <Trash2 size={16} />
                      </Button>

                      <div className="grid grid-cols-2 gap-3">
                        <Controller
                          name={`units.${index}.purchaseDate`}
                          control={form.control}
                          render={({ field }) => (
                            <DatePicker
                              {...field}
                              label="Purchase Date"
                              size="sm"
                            />
                          )}
                        />
                        <Controller
                          name={`units.${index}.expiresAt`}
                          control={form.control}
                          render={({ field }) => (
                            <DatePicker
                              {...field}
                              label="Expiry Date"
                              size="sm"
                            />
                          )}
                        />
                      </div>

                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Controller
                            name={`units.${index}.periodAfterOpeningDuration`}
                            control={form.control}
                            render={({ field }) => (
                              <NumberInput
                                label="PAO Duration"
                                size="sm"
                                onValueChange={field.onChange}
                                value={field.value ?? undefined}
                              />
                            )}
                          />
                        </div>
                        <Controller
                          name={`units.${index}.periodAfterOpeningUnit`}
                          control={form.control}
                          render={({ field }) => (
                            <Select
                              label="Unit"
                              size="sm"
                              className="w-32"
                              selectedKeys={field.value ? [field.value] : []}
                              onSelectionChange={(k) =>
                                field.onChange(Array.from(k)[0])
                              }
                            >
                              <SelectItem key="months">Months</SelectItem>
                              <SelectItem key="years">Years</SelectItem>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ModalBody>

              <ModalFooter className="border-t-1 border-default-100">
                <Button color="danger" variant="light" onPress={onClose}>
                  Discard
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isPending}
                  className="uppercase font-bold px-8"
                >
                  Save Formula & {fields.length} Units
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

function CreateRoutineModal() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { tables } = useAppwrite();
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<CreateRoutineValues>({
    resolver: zodResolver(CreateRoutineSchema),
    defaultValues: { name: "" },
  });

  const { mutate: createRoutine, isPending } = useMutation({
    mutationFn: async (values: CreateRoutineValues) => {
      const routineId = ID.unique();
      await tables.createRow({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_ROUTINES_TABLE_ID!,
        rowId: routineId,
        data: {
          userId: user!.$id,
          name: values.name,
        },
        permissions: [
          Permission.read(Role.user(user!.$id)),
          Permission.update(Role.user(user!.$id)),
          Permission.delete(Role.user(user!.$id)),
        ],
      });
      return routineId;
    },
    onSuccess: (id) => {
      onClose();
      router.push(`/routines/${id}`);
    },
  });

  return (
    <>
      <Button
        onPress={onOpen}
        color="secondary"
        variant="flat"
        startContent={<Plus size={18} />}
        className="font-bold uppercase"
      >
        New Routine
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
        <ModalContent>
          <form onSubmit={form.handleSubmit((data) => createRoutine(data))}>
            <ModalHeader className="flex items-center gap-2 uppercase font-black">
              <Sparkles className="text-secondary" size={20} /> Create Routine
            </ModalHeader>
            <ModalBody>
              <Input
                {...form.register("name")}
                label="Routine Name"
                placeholder="e.g. Winter Hydration"
                variant="bordered"
                isInvalid={!!form.formState.errors.name}
                errorMessage={form.formState.errors.name?.message}
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
                Create & Add Steps
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
