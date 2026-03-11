"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import {
  CatalogProductFormValues,
  CatalogProductSchema,
} from "@/lib/schema/catalog";
import { Controller, useForm } from "react-hook-form";
import { Edit3, Plus } from "lucide-react";
import { databaseId, tableIds } from "@/lib/appwrite/const";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import BrandSelect from "@/components/admin/brand/select";
import { CatalogProducts } from "@/lib/appwrite/types";
import { ID } from "appwrite";
import { categories } from "@/lib/product/const";
import { useAppwrite } from "@/contexts/appwrite";
import { zodResolver } from "@hookform/resolvers/zod";

export function CatalogProductModal({
  product,
}: {
  product?: CatalogProducts;
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { tables } = useAppwrite();
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    control,
  } = useForm<CatalogProductFormValues>({
    resolver: zodResolver(CatalogProductSchema),
    defaultValues: {
      name: product?.name ?? "",
      brandId: product?.brand?.$id ?? "",
      category: product?.category ?? "",
      description: product?.description ?? "",
      imageUrl: product?.imageUrl ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ brandId, ...values }: CatalogProductFormValues) => {
      const data = {
        ...values,
        brand: brandId,
        description: /* values.description ||  */ null,
        imageUrl: values.imageUrl || null,
      };

      if (isEdit) {
        return await tables.updateRow({
          databaseId,
          tableId: tableIds.catalogProducts,
          rowId: product.$id,
          data,
        });
      }
      return await tables.createRow({
        databaseId,
        tableId: tableIds.catalogProducts,
        rowId: ID.unique(),
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog() });
      onOpenChange();
      if (!isEdit) reset();
    },
  });

  return (
    <>
      <Button
        onPress={onOpen}
        color={isEdit ? "default" : "secondary"}
        variant={isEdit ? "light" : "solid"}
        isIconOnly={isEdit}
        size={isEdit ? "sm" : "md"}
        startContent={!isEdit && <Plus size={18} />}
      >
        {isEdit ? <Edit3 size={16} /> : "Add Product"}
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
              <ModalHeader>
                {isEdit ? `Edit Product` : "New Catalog Product"}
              </ModalHeader>
              <ModalBody className="gap-4">
                <Input
                  {...register("name")}
                  label="Product Name"
                  labelPlacement="outside"
                  placeholder="e.g. Moisturizing Lotion"
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message}
                />

                <Controller
                  name="brandId"
                  control={control}
                  render={({
                    field: { value, onChange, ...field },
                    fieldState: { invalid, error },
                  }) => (
                    <BrandSelect
                      {...field}
                      labelPlacement="outside"
                      selectedKeys={value ? [value] : []}
                      onSelectionChange={(k) => onChange(Array.from(k)[0])}
                      isInvalid={invalid}
                      errorMessage={error?.message}
                    />
                  )}
                />

                <Controller
                  name="category"
                  control={control}
                  render={({
                    field: { value, onChange, ...field },
                    fieldState: { invalid, error },
                  }) => (
                    <Select
                      {...field}
                      label="Category"
                      variant="bordered"
                      labelPlacement="outside"
                      placeholder="Select a category"
                      selectedKeys={value ? [value] : []}
                      onSelectionChange={(k) => onChange(Array.from(k)[0])}
                      isInvalid={invalid}
                      errorMessage={error?.message}
                    >
                      {categories.map((cat) => (
                        <SelectItem key={cat.key} textValue={cat.label}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />

                <Input
                  {...register("imageUrl")}
                  label="Image URL"
                  labelPlacement="outside"
                  placeholder="https://..."
                  isInvalid={!!errors.imageUrl}
                  errorMessage={errors.imageUrl?.message}
                />

                {/* <Textarea
                  {...register("description")}
                  label="Description"
                  labelPlacement="outside"
                  placeholder="Brief product description..."
                  isInvalid={!!errors.description}
                  errorMessage={errors.description?.message}
                /> */}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="secondary"
                  type="submit"
                  isLoading={mutation.isPending}
                >
                  {isEdit ? "Save Changes" : "Add to Catalog"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
