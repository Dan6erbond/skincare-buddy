"use client";

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
import { CreateRoutineSchema, CreateRoutineValues } from "@/lib/schema";
import { ID, Permission, Role } from "appwrite";
import { Plus, Sparkles } from "lucide-react";

import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

export function CreateRoutineModal() {
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
