"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  Button,
  DatePicker,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  NumberInput,
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { ID, Permission, Role } from "appwrite";
import { Plus, Trash2 } from "lucide-react";
import { ProductFormValues, ProductSchema } from "@/lib/schema";
import { Products, UnitsPeriodAfterOpeningUnit } from "@/lib/appwrite/types";
import { databaseId, tableIds } from "@/lib/appwrite/const";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import BrandAutocomplete from "@/components/admin/brand/autocomplete";
import { ModelCreate } from "@/lib/appwrite/utils";
import ProductAutocomplete from "@/components/admin/product/autocomplete";
import { categories } from "@/lib/product/const";
import { getLocalTimeZone } from "@internationalized/date";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

export function CreateProductModal() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { tables } = useAppwrite();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>();

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
      catalogBrand: null,
      catalogProduct: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "units",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const unitsData = values.units?.map((u) => ({
        purchaseDate:
          u.purchaseDate?.toDate(getLocalTimeZone()).toISOString() ?? null,
        expiresAt:
          u.expiresAt?.toDate(getLocalTimeZone()).toISOString() ?? null,
        openedAt: u.openedAt?.toDate(getLocalTimeZone()).toISOString() ?? null,
        periodAfterOpeningDuration: u.periodAfterOpeningDuration,
        periodAfterOpeningUnit: u.periodAfterOpeningUnit,
      }));

      return await tables.createRow<ModelCreate<Products>>({
        databaseId,
        tableId: tableIds.products,
        rowId: ID.unique(),
        data: {
          name: values.name,
          brand: values.brand,
          category: values.category,
          price: values.price,
          userId: user!.$id,
          units: unitsData,
          catalogBrand: values.catalogBrand,
          catalogProduct: values.catalogProduct,
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
        queryKey: queryKeys.products(),
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
                  <Controller
                    name="brand"
                    control={form.control}
                    render={({
                      field: { value, onChange, ...field },
                      fieldState: { invalid, error },
                    }) => (
                      <BrandAutocomplete
                        {...field}
                        label="Brand"
                        variant="bordered"
                        labelPlacement="outside"
                        isInvalid={invalid}
                        errorMessage={error?.message}
                        inputValue={value}
                        onInputChange={(val) => {
                          onChange(val);
                          form.setValue("catalogBrand", null);
                        }}
                        onBrandSelect={(brand) => {
                          onChange(brand.name); // Set the string name for the Product record
                          setSelectedBrandId(brand.$id); // Set ID for filtering products
                          form.setValue("name", ""); // Clear product name on brand change
                          form.setValue("catalogBrand", brand.$id); // Clear product name on brand change
                          form.setValue("catalogProduct", null);
                        }}
                        allowsCustomValue
                      />
                    )}
                  />
                  <Controller
                    name="name"
                    control={form.control}
                    render={({
                      field: { value, onChange, ...field },
                      fieldState: { invalid, error },
                    }) => (
                      <ProductAutocomplete
                        {...field}
                        brandId={selectedBrandId}
                        label="Product Name"
                        variant="bordered"
                        labelPlacement="outside"
                        isInvalid={invalid}
                        errorMessage={error?.message}
                        inputValue={value}
                        onInputChange={(val) => {
                          onChange(val);
                          form.setValue("catalogProduct", null);
                        }}
                        onProductSelect={(catalogProduct) => {
                          onChange(catalogProduct.name);
                          // Auto-fill available catalog data
                          form.setValue("brand", catalogProduct.brand.name);
                          form.setValue("catalogProduct", catalogProduct.$id);
                          if (catalogProduct.category) {
                            form.setValue("category", catalogProduct.category);
                          }
                        }}
                        allowsCustomValue
                      />
                    )}
                  />
                </div>

                {/* Section 2: Category & Price */}
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
                    render={({
                      field: { value, onChange, ...field },
                      fieldState: { invalid, error },
                    }) => (
                      <NumberInput
                        label="Price"
                        variant="bordered"
                        labelPlacement="outside"
                        onValueChange={onChange}
                        value={value}
                        isInvalid={invalid}
                        errorMessage={error?.message}
                        {...field}
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
                          render={({
                            field,
                            fieldState: { invalid, error },
                          }) => (
                            <DatePicker
                              {...field}
                              label="Purchase Date"
                              size="sm"
                              isInvalid={invalid}
                              errorMessage={error?.message}
                            />
                          )}
                        />
                        <Controller
                          name={`units.${index}.expiresAt`}
                          control={form.control}
                          render={({
                            field,
                            fieldState: { invalid, error },
                          }) => (
                            <DatePicker
                              {...field}
                              label="Expiry Date"
                              size="sm"
                              isInvalid={invalid}
                              errorMessage={error?.message}
                            />
                          )}
                        />
                      </div>

                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Controller
                            name={`units.${index}.periodAfterOpeningDuration`}
                            control={form.control}
                            render={({
                              field: { value, onChange, ...field },
                              fieldState: { invalid, error },
                            }) => (
                              <NumberInput
                                label="PAO Duration"
                                size="sm"
                                onValueChange={onChange}
                                value={value ?? undefined}
                                isInvalid={invalid}
                                errorMessage={error?.message}
                                {...field}
                              />
                            )}
                          />
                        </div>
                        <Controller
                          name={`units.${index}.periodAfterOpeningUnit`}
                          control={form.control}
                          render={({
                            field: { value, onChange, ...field },
                            fieldState: { invalid, error },
                          }) => (
                            <Select
                              label="Unit"
                              size="sm"
                              className="w-32"
                              selectedKeys={value ? [value] : []}
                              onSelectionChange={(k) =>
                                onChange(Array.from(k)[0])
                              }
                              isInvalid={invalid}
                              errorMessage={error?.message}
                              {...field}
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
