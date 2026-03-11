"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
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

import { Brands } from "@/lib/appwrite/types";
import { useAppwrite } from "@/contexts/appwrite";

interface DeleteBrandModalProps {
  brand: Brands;
}

export function DeleteBrandModal({ brand }: DeleteBrandModalProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { tables } = useAppwrite();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      return await tables.deleteRow({
        databaseId,
        tableId: tableIds.brands,
        rowId: brand.$id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "brands"] });
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
              <ModalHeader className="flex flex-col gap-1">
                Delete Brand
              </ModalHeader>
              <ModalBody>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-danger-50 border border-danger-100">
                  <AlertTriangle className="text-danger" size={24} />
                  <p className="text-sm text-danger-600 font-medium">
                    This action cannot be undone. This will permanently delete{" "}
                    <strong>{brand.name}</strong>.
                  </p>
                </div>
                <p className="text-default-500 text-small">
                  Note: If any products in the catalog are currently linked to
                  this brand, those links may break.
                </p>
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
                  Delete Permanently
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
