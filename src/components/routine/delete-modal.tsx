"use client";

import * as queryKeys from "@/lib/query/keys";

import { AlertTriangle, Trash2 } from "lucide-react";
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
import { databaseId, tableIds } from "@/lib/appwrite/const";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Routines } from "@/lib/appwrite/types";
import { useAppwrite } from "@/contexts/appwrite";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteRoutineModalProps {
  routine: Routines;
}

export function DeleteRoutineModal({ routine }: DeleteRoutineModalProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [confirmName, setConfirmName] = useState("");
  const { tables } = useAppwrite();
  const queryClient = useQueryClient();
  const router = useRouter();

  const isConfirmed = confirmName.toLowerCase() === routine.name.toLowerCase();

  const mutation = useMutation({
    mutationFn: async () => {
      return await tables.deleteRow({
        databaseId,
        tableId: tableIds.routines,
        rowId: routine.$id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routines() });
      onOpenChange();
      router.push("/routines");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfirmed) {
      mutation.mutate();
    }
  };

  return (
    <>
      <Button
        onPress={onOpen}
        color="danger"
        variant="light"
        size="sm"
        isIconOnly
        className="min-w-0"
      >
        <Trash2 className="size-4" />
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur"
        classNames={{
          base: "border-1 border-danger-200 bg-content1",
          header: "border-b-1 border-default-100",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit}>
              <ModalHeader className="flex gap-2 items-center text-danger">
                <AlertTriangle className="size-5" />
                Delete Routine
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="space-y-4">
                  <p className="text-default-600">
                    Are you sure you want to delete{" "}
                    <span className="font-bold text-foreground italic">
                      &apos;{routine.name}&apos;
                    </span>
                    ? This will remove all associated regiments and steps.
                  </p>

                  <div className="p-3 rounded-xl bg-danger-50 border-1 border-danger-100">
                    <p className="text-tiny text-danger-600 font-semibold uppercase tracking-wider mb-2">
                      Confirm Deletion
                    </p>
                    <Input
                      variant="bordered"
                      placeholder={`Type "${routine.name}" to confirm`}
                      value={confirmName}
                      onValueChange={setConfirmName}
                      classNames={{
                        inputWrapper: "bg-background",
                      }}
                      autoFocus
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="bg-default-50/50">
                <Button variant="light" onPress={onClose} radius="full">
                  Keep Routine
                </Button>
                <Button
                  type="submit"
                  color="danger"
                  variant="shadow"
                  radius="full"
                  isDisabled={!isConfirmed}
                  isLoading={mutation.isPending}
                >
                  Confirm Delete
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
