"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  AlertCircle,
  Calendar,
  Clock,
  Edit3,
  FlaskConical,
  Heart,
  Package,
  Plus,
} from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  DatePicker,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Tooltip,
  addToast,
  useDisclosure,
} from "@heroui/react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { ID, Permission, Query, Role } from "appwrite";
import { PAOInputs, UnitFormFields } from "@/components/forms/unit";
import {
  ProductFormValues,
  ProductSchema,
  UnitFormValues,
  UnitSchema,
  calendarDateSchema,
} from "@/lib/schema";
import {
  Products,
  Units,
  UnitsPeriodAfterOpeningUnit,
} from "@/lib/appwrite/appwrite";
import { databaseId, tableIds } from "@/lib/appwrite/const";
import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { use, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AddToWishlistModal } from "@/components/wishlist/add-modal";
import { ArchiveProductModal } from "@/components/product/archive-modal";
import { ModelCreate } from "@/lib/appwrite/utils";
import { ProductDescription } from "./description";
import { Rating } from "@/components/ui/rating";
import { categories } from "@/lib/product/const";
import { getExpiryDate } from "@/lib/product/utils";
import { useAddToWishlist } from "@/hooks/use-add-to-wishlist";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const OpenUnitSchema = z
  .object({
    openedAt: calendarDateSchema,
    periodAfterOpeningDuration: z.number().min(1).nullish(),
    periodAfterOpeningUnit: z.enum(UnitsPeriodAfterOpeningUnit).nullish(),
  })
  .refine(
    (data) => {
      // If one is present, both must be present
      if (data.periodAfterOpeningDuration || data.periodAfterOpeningUnit) {
        return data.periodAfterOpeningDuration && data.periodAfterOpeningUnit;
      }
      return true;
    },
    {
      message: "Please provide both duration and unit",
      path: ["periodAfterOpeningDuration"],
    },
  );

type OpenUnitValues = z.infer<typeof OpenUnitSchema>;

export default function Page({ params }: PageProps<"/products/[id]">) {
  const { id } = use(params);
  const { user } = useAuth();
  const { tables } = useAppwrite();
  const queryClient = useQueryClient();

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const {
    isOpen: isFinishOpen,
    onOpen: onFinishOpen,
    onOpenChange: onFinishOpenChange,
    onClose: onFinishClose,
  } = useDisclosure();
  const addUnitModal = useDisclosure();
  const wishlistPrompt = useDisclosure();

  const { data: product, isLoading } = useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () =>
      tables.getRow<Products>({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_PRODUCTS_TABLE_ID!,
        rowId: id,
        queries: [Query.select(["*", "units.*"])],
      }),
  });

  // Track which unit we are currently "opening" in the modal
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const openForm = useForm<OpenUnitValues>({
    resolver: zodResolver(OpenUnitSchema),
    defaultValues: {
      openedAt: parseDate(new Date().toISOString().split("T")[0]),
    },
  });
  const selectedUnit = useMemo(
    () => product?.units?.find((u) => u.$id === activeUnitId),
    [product, activeUnitId],
  );

  // Check if we need to show the PAO inputs
  const needsPAO =
    !selectedUnit?.periodAfterOpeningDuration ||
    !selectedUnit?.periodAfterOpeningUnit;

  const { mutate: updateUnit, isPending: isUpdatingUnit } = useMutation({
    mutationFn: async ({
      unitId,
      data,
    }: {
      unitId: string;
      data: Partial<Units>;
    }) => {
      return await tables.updateRow<Units>({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_UNITS_TABLE_ID!,
        rowId: unitId,
        data,
      });
    },
    onSuccess: (_, { unitId, data }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.product(id) });
      onClose();
      onFinishClose();
      setActiveUnitId(null);

      if (!data.finishedAt) return;

      const remainingUnits = product?.units?.filter(
        (u) => u.$id !== unitId && !u.finishedAt,
      );

      if (!remainingUnits?.length) {
        wishlistPrompt.onOpen();
      }
    },
  });

  const addToWishlist = useAddToWishlist({
    product,
    onSuccess: wishlistPrompt.onClose,
  });

  const unitForm = useForm<UnitFormValues>({
    resolver: zodResolver(UnitSchema),
    defaultValues: {
      purchaseDate: null,
      expiresAt: null,
    },
  });

  const { mutate: createUnit, isPending: isCreatingUnit } = useMutation({
    mutationFn: async (values: UnitFormValues) => {
      return await tables.createRow<
        Omit<ModelCreate<Units>, "product"> & { product: string }
      >({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_UNITS_TABLE_ID!,
        rowId: ID.unique(),
        data: {
          product: id,
          purchaseDate:
            values.purchaseDate?.toDate(getLocalTimeZone()).toISOString() ??
            null,
          expiresAt:
            values.expiresAt?.toDate(getLocalTimeZone()).toISOString() ?? null,
          periodAfterOpeningDuration: values.periodAfterOpeningDuration,
          periodAfterOpeningUnit: values.periodAfterOpeningUnit,
        },
        permissions: [
          Permission.read(Role.user(user!.$id)),
          Permission.update(Role.user(user!.$id)),
          Permission.delete(Role.user(user!.$id)),
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.product(id) });
      addUnitModal.onClose();
      unitForm.reset();
    },
  });

  const { mutate: updateRating } = useMutation({
    mutationFn: async (newRating: number) => {
      return await tables.updateRow<Products>({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_PRODUCTS_TABLE_ID!,
        rowId: id,
        data: { rating: newRating },
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.product(id) }),
  });

  if (isLoading)
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  if (!product)
    return (
      <div className="text-center py-20">
        <AlertCircle className="mx-auto" />
        <h1>Product not found</h1>
      </div>
    );

  const handleOpenUnit = (unitId: string) => {
    setActiveUnitId(unitId);
    onOpen();
  };

  const handleConfirmOpen = openForm.handleSubmit((values) => {
    if (!activeUnitId) return;

    const updateData: Partial<Units> = {
      openedAt: values.openedAt.toDate(getLocalTimeZone()).toISOString(),
    };

    // If the unit was missing PAO info, save what the user entered
    if (needsPAO) {
      updateData.periodAfterOpeningDuration = values.periodAfterOpeningDuration;
      updateData.periodAfterOpeningUnit = values.periodAfterOpeningUnit;
    }

    updateUnit({
      unitId: activeUnitId,
      data: updateData,
    });
  });

  const handleFinishedUnit = (unitId: string) => {
    setActiveUnitId(unitId);
    onFinishOpen();
  };

  const handleConfirmFinished = () => {
    if (!activeUnitId) return;

    updateUnit({
      unitId: activeUnitId,
      data: { finishedAt: new Date().toISOString() },
    });
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header Card */}
      <Card className="p-4 shadow-sm border-none bg-default-50/50">
        <CardBody className="gap-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FlaskConical className="text-primary" size={20} />
                <span className="text-tiny font-bold text-primary uppercase tracking-widest">
                  Formula
                </span>
              </div>
              <div className="flex gap-4 items-center">
                <h1 className="text-4xl font-black uppercase tracking-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-1">
                  <AddToWishlistModal product={product} />
                  <EditProductModal product={product} />
                  <ArchiveProductModal product={product} />
                </div>
              </div>
              <p className="text-xl text-default-500 font-medium">
                {product.brand}
              </p>

              {/* Star Rating */}
              <Rating
                value={product.rating ?? 0}
                onChange={(star) => updateRating(star)}
              />
            </div>

            <div className="flex flex-col items-end gap-2">
              <Chip variant="shadow" color="secondary" className="font-bold">
                {product.category.toUpperCase()}
              </Chip>
              <div className="text-right">
                <p className="text-tiny text-default-400 uppercase font-bold">
                  Market Price
                </p>
                <p className="text-2xl font-black text-default-700">
                  ${product.price.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Units Inventory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Package size={22} className="text-primary" /> Inventory Units
            </h2>
            <Button
              onPress={addUnitModal.onOpen}
              size="sm"
              color="primary"
              variant="flat"
              startContent={<Plus size={16} />}
              className="font-bold uppercase"
            >
              Add Unit
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.units?.map((unit, index) => (
              <UnitCard
                key={unit.$id}
                unit={unit}
                index={index}
                onOpenAction={() => handleOpenUnit(unit.$id)}
                onFinishAction={() => handleFinishedUnit(unit.$id)}
              />
            ))}
          </div>

          <ProductDescription product={product} />
        </div>

        {/* Right Column: Collection Stats / Quick Actions */}
        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground p-2">
            <CardBody className="text-center gap-1">
              <p className="text-tiny uppercase font-bold opacity-80">
                Total Investment
              </p>
              <p className="text-3xl font-black">
                ${((product.units?.length || 0) * product.price).toFixed(2)}
              </p>
            </CardBody>
          </Card>
          {/* Add additional collection-wide metadata here */}
        </div>
      </div>

      {/* Opening Confirmation Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
        <ModalContent>
          <FormProvider {...openForm}>
            <form onSubmit={handleConfirmOpen}>
              <ModalHeader className="uppercase font-bold">
                Confirm Opening
              </ModalHeader>
              <ModalBody className="pb-8 gap-4">
                <p className="text-small text-default-600">
                  Marking this as <span className="font-bold">Opened</span>{" "}
                  starts the countdown.
                </p>

                <Controller
                  name="openedAt"
                  control={openForm.control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      label="Opening Date"
                      variant="flat"
                    />
                  )}
                />

                {needsPAO && (
                  <div className="p-4 bg-primary-50/50 rounded-xl border-1 border-primary-100 space-y-3">
                    <p className="text-tiny font-black uppercase text-primary tracking-widest">
                      Set Missing PAO Details
                    </p>
                    <PAOInputs getName={(name) => name} variant="bordered" />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isUpdatingUnit}
                  className="font-bold uppercase"
                >
                  Start Timer
                </Button>
              </ModalFooter>
            </form>
          </FormProvider>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isFinishOpen}
        onOpenChange={onFinishOpenChange}
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="uppercase font-bold">
            Confirm Finished
          </ModalHeader>
          <ModalBody className="pb-8 gap-4">
            <p className="text-small text-default-600">
              Would you like to mark this as{" "}
              <span className="font-bold">Finished</span>?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onFinishClose}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleConfirmFinished}
              isLoading={isUpdatingUnit}
              className="font-bold uppercase"
            >
              Mark as Finished
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={addUnitModal.isOpen}
        onOpenChange={addUnitModal.onOpenChange}
      >
        <ModalContent>
          <form onSubmit={unitForm.handleSubmit((data) => createUnit(data))}>
            <ModalHeader className="uppercase font-black">
              Add New Unit
            </ModalHeader>
            <ModalBody>
              <FormProvider {...unitForm}>
                {/* index 0 because it's a single unit form, not an array */}
                <UnitFormFields />
              </FormProvider>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={addUnitModal.onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={isCreatingUnit}
                className="font-bold"
              >
                Save Unit
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={wishlistPrompt.isOpen}
        onOpenChange={wishlistPrompt.onOpenChange}
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="uppercase font-black italic tracking-tighter text-2xl text-primary">
            Empty Bottle!
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <p className="text-default-600">
                That was your last unit of{" "}
                <span className="font-bold text-foreground">
                  {product.name}
                </span>
                . Would you like to add it to your wishlist so you don&apos;t
                forget to restock?
              </p>
              <div className="bg-content2 p-3 rounded-xl flex items-center gap-3 border-1 border-content3">
                <div className="p-2 bg-primary-100 rounded-lg text-primary">
                  <Heart size={20} fill="currentColor" />
                </div>
                <div>
                  <p className="text-tiny text-default-500 uppercase font-bold">
                    Recommended Action
                  </p>
                  <p className="text-small font-semibold">Move to Wishlist</p>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={wishlistPrompt.onClose}>
              Maybe Later
            </Button>
            <Button
              color="primary"
              variant="shadow"
              isLoading={addToWishlist.isPending}
              onPress={() => addToWishlist.mutate()}
              startContent={<Heart size={18} />}
              className="font-bold uppercase"
            >
              Add to Wishlist
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

interface EditProductModalProps {
  product: Products;
}

function EditProductModal({ product }: EditProductModalProps) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const queryClient = useQueryClient();
  const { tables } = useAppwrite();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      return await tables.updateRow({
        databaseId,
        tableId: tableIds.products,
        rowId: product.$id,
        data: {
          name: values.name,
          brand: values.brand,
          category: values.category,
          price: values.price,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.product(product.$id),
      });
      addToast({
        title: "Formula Updated",
        description: "Changes saved successfully.",
        color: "success",
      });
      onClose();
    },
  });

  return (
    <>
      <Tooltip content="Edit">
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={onOpen}
          className="text-default-400 hover:text-primary transition-colors"
        >
          <Edit3 size={18} />
        </Button>
      </Tooltip>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="xl">
        <ModalContent>
          {(onClose) => (
            <form onSubmit={form.handleSubmit((data) => mutate(data))}>
              <ModalHeader className="uppercase font-black italic tracking-tighter text-2xl">
                Edit Formula
              </ModalHeader>
              <ModalBody className="gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    {...form.register("brand")}
                    label="Brand"
                    variant="bordered"
                    labelPlacement="outside"
                    isInvalid={!!form.formState.errors.brand}
                    errorMessage={form.formState.errors.brand?.message}
                  />
                  <Input
                    {...form.register("name")}
                    label="Product Name"
                    variant="bordered"
                    labelPlacement="outside"
                    isInvalid={!!form.formState.errors.name}
                    errorMessage={form.formState.errors.name?.message}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="category"
                    control={form.control}
                    render={({
                      field: { value, onChange, ...field },
                      fieldState: { invalid, error },
                    }) => (
                      <Select
                        {...field}
                        label="Category"
                        variant="bordered"
                        labelPlacement="outside"
                        selectedKeys={[value]}
                        onSelectionChange={(k) => onChange(Array.from(k)[0])}
                        isInvalid={invalid}
                        errorMessage={error?.message}
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
                      <Input
                        type="number"
                        label="Price"
                        variant="bordered"
                        labelPlacement="outside"
                        value={field.value.toString()}
                        onValueChange={(v) => field.onChange(parseFloat(v))}
                      />
                    )}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Discard
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isPending}
                  className="font-bold uppercase"
                >
                  Save Changes
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

function UnitCard({
  unit,
  index,
  onOpenAction,
  onFinishAction,
}: {
  unit: Units;
  index: number;
  onOpenAction: () => void;
  onFinishAction: () => void;
}) {
  const expiry = useMemo(() => getExpiryDate(unit), [unit]);

  const isExpired = expiry ? expiry < new Date() : false;

  return (
    <Card
      className={`border-none shadow-sm ${
        unit.openedAt ? "bg-white" : "bg-default-100/50"
      }`}
    >
      <CardHeader className="flex justify-between items-start">
        <div>
          <p className="text-tiny font-black text-default-400 uppercase">
            Unit #{index + 1}
          </p>
          <p className="text-medium font-bold">
            {unit.purchaseDate
              ? new Date(unit.purchaseDate).toLocaleDateString()
              : "Unknown Purchase"}
          </p>
        </div>
        {unit.openedAt ? (
          <Tooltip
            content={
              unit.finishedAt
                ? new Date(unit.finishedAt).toLocaleDateString()
                : expiry
                  ? expiry.toLocaleDateString()
                  : new Date(unit.openedAt).toLocaleDateString()
            }
          >
            <Chip
              size="sm"
              color={
                unit.finishedAt ? "default" : isExpired ? "danger" : "success"
              }
              variant="flat"
              className="font-bold uppercase"
            >
              {unit.finishedAt ? "Finished" : isExpired ? "Expired" : "Opened"}
            </Chip>
          </Tooltip>
        ) : (
          <Chip size="sm" variant="dot" className="uppercase">
            Sealed
          </Chip>
        )}
      </CardHeader>

      <Divider />

      <CardBody className="p-4 gap-3">
        <div className="space-y-2">
          <div className="flex justify-between text-tiny uppercase font-bold text-default-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> Factory Expiry
            </span>
            <span className="text-default-700">
              {unit.expiresAt
                ? new Date(unit.expiresAt).toLocaleDateString()
                : "N/A"}
            </span>
          </div>

          {unit.openedAt && (
            <div className="flex justify-between text-tiny uppercase font-bold text-default-500">
              <span className="flex items-center gap-1">
                <Clock size={12} /> PAO Expiry
              </span>
              <span className={isExpired ? "text-danger" : "text-primary"}>
                {expiry?.toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </CardBody>

      <CardFooter>
        {unit.openedAt ? (
          !unit.finishedAt && (
            <>
              <Button
                size="sm"
                color="danger"
                variant="flat"
                className="w-full font-bold uppercase mt-2"
                onPress={onFinishAction}
              >
                Mark as Finished
              </Button>
            </>
          )
        ) : (
          <Button
            size="sm"
            color="primary"
            variant="flat"
            className="w-full font-bold uppercase mt-2"
            onPress={onOpenAction}
          >
            Open Bottle
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
