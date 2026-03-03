import * as queryKeys from "@/lib/query/keys";

import { Archive, ArchiveRestore } from "lucide-react";
import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
  User,
  addToast,
  useDisclosure,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Products } from "@/lib/appwrite/appwrite";
import { useAppwrite } from "@/contexts/appwrite";

interface Props {
  product: Products;
}

export function ArchiveProductModal({ product }: Props) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { tables } = useAppwrite();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      return await tables.updateRow<Products>({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_PRODUCTS_TABLE_ID!,
        rowId: product.$id,
        data: {
          archivedAt: new Date().toISOString(),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.product(product.$id),
      });
      addToast({
        title: "Product Archived",
        description: `${product.name} has been moved to your archive.`,
        color: "success",
      });
      onClose();
    },
    onError: () => {
      addToast({
        title: "Error",
        description: "Failed to archive the product. Please try again.",
        color: "danger",
      });
    },
  });

  return (
    <>
      <Tooltip content="Archive product">
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          color="default"
          onPress={onOpen}
          className="rounded-full"
        >
          <Archive size={16} className="text-default-500" />
        </Button>
      </Tooltip>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur"
        size="md"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 uppercase font-black italic tracking-tighter text-2xl">
                Archive Formula
              </ModalHeader>
              <ModalBody>
                <p className="text-default-500 text-sm mb-4">
                  Are you sure you want to archive this product? It will be
                  hidden from your active shelf but kept in your history.
                </p>

                <div className="p-4 rounded-2xl bg-content2 border-1 border-default-200 flex items-center justify-between">
                  <User
                    name={product.name}
                    description={product.brand}
                    avatarProps={{
                      radius: "md",
                      color: "default",
                      icon: <Archive size={20} />,
                    }}
                  />
                  <Chip
                    size="sm"
                    variant="dot"
                    color="primary"
                    className="font-bold uppercase border-none"
                  >
                    {product.category}
                  </Chip>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                  isDisabled={isPending}
                >
                  Keep Product
                </Button>
                <Button
                  color="default"
                  variant="solid"
                  onPress={() => mutate()}
                  isLoading={isPending}
                  startContent={!isPending && <ArchiveRestore size={18} />}
                  className="font-bold uppercase bg-foreground text-background"
                >
                  Archive Now
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
