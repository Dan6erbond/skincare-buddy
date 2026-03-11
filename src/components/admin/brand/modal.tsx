"use client";

import * as queryKeys from "@/lib/query/keys";

import { BrandFormValues, BrandSchema } from "@/lib/schema/catalog";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { Edit3, Plus } from "lucide-react";
import { databaseId, tableIds } from "@/lib/appwrite/const";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Brands } from "@/lib/appwrite/types";
import { ID } from "appwrite";
import { useAppwrite } from "@/contexts/appwrite";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface BrandModalProps {
  brand?: Brands;
}

export function BrandModal({ brand }: BrandModalProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { tables } = useAppwrite();
  const queryClient = useQueryClient();
  const isEdit = !!brand;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(BrandSchema),
    defaultValues: {
      name: brand?.name ?? "",
      website: brand?.website ?? "",
      logoUrl: brand?.logoUrl ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: BrandFormValues) => {
      // Normalize empty strings to null for Appwrite
      const data = {
        ...values,
        website: values.website || null,
        logoUrl: values.logoUrl || null,
      };

      if (isEdit && brand?.$id) {
        return await tables.updateRow({
          databaseId: databaseId, // Assuming this is imported from your consts
          tableId: tableIds.brands,
          rowId: brand.$id,
          data,
        });
      }

      return await tables.createRow({
        databaseId: databaseId,
        tableId: tableIds.brands,
        rowId: ID.unique(),
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminBrands(),
      });
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
        size={isEdit ? "sm" : "md"}
        isIconOnly={isEdit}
        startContent={!isEdit && <Plus size={18} />}
      >
        {isEdit ? <Edit3 size={16} /> : "Add Brand"}
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
              <ModalHeader>{isEdit ? "Edit Brand" : "New Brand"}</ModalHeader>
              <ModalBody className="gap-4">
                <Input
                  {...register("name")}
                  label="Brand Name"
                  placeholder="e.g. CeraVe"
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message}
                />
                <Input
                  {...register("website")}
                  label="Website"
                  placeholder="https://..."
                  isInvalid={!!errors.website}
                  errorMessage={errors.website?.message}
                />
                <Input
                  {...register("logoUrl")}
                  label="Logo URL"
                  placeholder="https://..."
                  isInvalid={!!errors.logoUrl}
                  errorMessage={errors.logoUrl?.message}
                />
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
                  {isEdit ? "Update Brand" : "Create Brand"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
