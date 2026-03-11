"use client";

import * as queryKeys from "@/lib/query/keys";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { databaseId, tableIds } from "@/lib/appwrite/const";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { CatalogProducts } from "@/lib/appwrite/types";
import { Trash2 } from "lucide-react";
import { useAppwrite } from "@/contexts/appwrite";

export function DeleteCatalogProductModal({
  product,
}: {
  product: CatalogProducts;
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { tables } = useAppwrite();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      return await tables.deleteRow({
        databaseId,
        tableId: tableIds.catalogProducts,
        rowId: product.$id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog() });
      onOpenChange();
    },
  });

  return (
    <>
      <Button
        onPress={onOpen}
        color="danger"
        variant="light"
        size="sm"
        isIconOnly
      >
        <Trash2 size={16} />
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Delete Product</ModalHeader>
              <ModalBody>
                Are you sure you want to remove <strong>{product.name}</strong>{" "}
                from the master catalog? This won&apos;t delete it from users&apos;
                shelves, but it will be gone from the global search.
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  isLoading={mutation.isPending}
                  onPress={() => mutation.mutate()}
                >
                  Confirm Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
