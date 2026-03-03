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
  useDisclosure,
} from "@heroui/react";
import { Heart, Plus } from "lucide-react";

import { Products } from "@/lib/appwrite/appwrite";
import { useAddToWishlist } from "@/hooks/use-add-to-wishlist";

interface Props {
  product: Products;
}

export function AddToWishlistModal({ product }: Props) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { mutate, isPending } = useAddToWishlist({
    product,
    onSuccess: onClose,
  });

  return (
    <>
      <Tooltip content="Add to wishlist">
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          color="danger"
          onPress={onOpen}
          className="rounded-full"
        >
          <Heart
            size={16}
            fill={
              product.rating && product.rating > 4 ? "currentColor" : "none"
            }
          />
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
                Restock Wishlist
              </ModalHeader>
              <ModalBody>
                <p className="text-default-500 text-sm mb-4">
                  Confirm you want to add this formula to your wishlist for
                  future repurchasing.
                </p>

                <div className="p-4 rounded-2xl bg-default-50 border-1 border-default-200 flex items-center justify-between">
                  <User
                    name={product.name}
                    description={product.brand}
                    avatarProps={{
                      radius: "md",
                      color: "danger",
                      icon: <Heart size={20} />,
                    }}
                  />
                  <Chip
                    size="sm"
                    variant="flat"
                    color="secondary"
                    className="font-bold uppercase"
                  >
                    {product.category}
                  </Chip>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  variant="shadow"
                  onPress={() => mutate()}
                  isLoading={isPending}
                  startContent={<Plus size={18} />}
                  className="font-bold uppercase"
                >
                  Add to Wishlist
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
