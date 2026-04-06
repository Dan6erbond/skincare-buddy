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
import { HeartOff, Trash2 } from "lucide-react";

import { WishlistProducts } from "@/lib/appwrite/types";
import { useRemoveFromWishlist } from "@/hooks/use-remove-from-wishlist";

interface Props {
  wishlistItem: WishlistProducts;
}

export function RemoveFromWishlistModal({ wishlistItem }: Props) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { mutate, isPending } = useRemoveFromWishlist({
    wishlistItem,
    onSuccess: onClose,
  });

  const { product } = wishlistItem;

  return (
    <>
      <Tooltip content="Remove from wishlist" color="danger">
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          color="default"
          onPress={onOpen}
          className="rounded-full hover:text-danger"
        >
          <HeartOff className="size-4" />
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
              <ModalHeader className="flex flex-col gap-1 uppercase font-black italic tracking-tighter text-2xl text-danger">
                Remove from Wishlist
              </ModalHeader>
              <ModalBody>
                <p className="text-default-500 text-sm mb-4">
                  Are you sure you want to remove this formula? You can always
                  add it back later if you change your mind.
                </p>

                <div className="p-4 rounded-2xl bg-content2 border-1 border-default-200 flex items-center justify-between">
                  <User
                    name={product.name}
                    description={product.brand}
                    avatarProps={{
                      radius: "md",
                      color: "danger",
                      icon: <HeartOff size={20} />,
                    }}
                  />
                  {product.category && (
                    <Chip
                      size="sm"
                      variant="flat"
                      color="secondary"
                      className="font-bold uppercase"
                    >
                      {product.category}
                    </Chip>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                  className="font-medium"
                >
                  Keep it
                </Button>
                <Button
                  color="danger"
                  variant="shadow"
                  onPress={() => mutate(undefined)}
                  isLoading={isPending}
                  startContent={<Trash2 className="size-4" />}
                  className="font-bold uppercase"
                >
                  Remove Item
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
