"use client";

import * as queryKeys from "@/lib/query/keys";

import { BookPlus, Pencil } from "lucide-react";
import {
  Button,
  ButtonProps,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { Controller, useForm } from "react-hook-form";
import { ID, Permission, Role } from "appwrite";
import { JournalEntryFormValues, JournalEntrySchema } from "@/lib/schema";
import { bucketId, databaseId, tableIds } from "@/lib/appwrite/const";
import {
  getLocalTimeZone,
  now,
  parseAbsoluteToLocal,
} from "@internationalized/date";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { DatePicker } from "@heroui/react";
import { Editor } from "@/components/editor";
import { ImageUpload } from "@/components/ui/image-upload";
import { JournalEntries } from "@/lib/appwrite/types";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { zodResolver } from "@hookform/resolvers/zod";

interface JournalEntryModalProps extends ButtonProps {
  entry?: JournalEntries;
}

export function JournalEntryModal({ entry, ...props }: JournalEntryModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuth();
  const { tables, storage } = useAppwrite();
  const queryClient = useQueryClient();

  const form = useForm<JournalEntryFormValues>({
    resolver: zodResolver(JournalEntrySchema),
    defaultValues: {
      occurredAt: entry
        ? parseAbsoluteToLocal(entry.occurredAt)
        : now(getLocalTimeZone()),
      description: entry?.description ?? "",
      imageId: entry?.imageId ?? null,
      image: entry?.imageId ?? null, // This handles the preview logic
    },
  });

  const { mutate: saveEntry, isPending } = useMutation({
    mutationFn: async (values: JournalEntryFormValues) => {
      if (!user?.$id) return;

      const { image } = values;
      let finalImageId = entry?.imageId ?? null;

      if (image instanceof File) {
        const fileUpload = await storage.createFile({
          bucketId,
          fileId: ID.unique(),
          file: image,
          permissions: [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ],
        });
        finalImageId = fileUpload.$id;
      } else if (image === null) {
        // If the user cleared the image
        finalImageId = null;
      }

      const payload = {
        occurredAt: values.occurredAt.toDate().toISOString(),
        description: values.description,
        imageId: finalImageId,
        userId: user.$id,
      };

      if (entry) {
        return await tables.updateRow({
          databaseId,
          tableId: tableIds.journalEntries, // Assuming journal is in tableIds
          rowId: entry.$id,
          data: payload,
        });
      } else {
        return await tables.createRow({
          databaseId,
          tableId: tableIds.journalEntries,
          rowId: ID.unique(),
          data: payload,
          permissions: [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal() });
      onClose();
      form.reset();
    },
  });

  return (
    <>
      <Button
        onPress={onOpen}
        color="primary"
        variant={entry ? "flat" : "solid"}
        startContent={
          entry ? (
            <Pencil className="group-[.text-tiny]:size-4 size-5" />
          ) : (
            <BookPlus className="group-[.text-tiny]:size-4 size-5" />
          )
        }
        className="group"
        {...props}
      >
        {entry ? "Edit Entry" : "New Journal Entry"}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="outside"
      >
        <ModalContent>
          <form onSubmit={form.handleSubmit((v) => saveEntry(v))}>
            <ModalHeader>
              {entry ? "Update Journal" : "Capture Progress"}
            </ModalHeader>
            <ModalBody className="gap-6">
              <Controller
                name="occurredAt"
                control={form.control}
                render={({ field, fieldState: { invalid, error } }) => (
                  <DatePicker
                    {...field}
                    label="Date & Time"
                    labelPlacement="outside"
                    isInvalid={invalid}
                    errorMessage={error?.message}
                  />
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-default-700">
                  Progress Photo
                </label>
                <Controller
                  name="image"
                  control={form.control}
                  render={({
                    field: { value, onChange },
                    fieldState: { error },
                  }) => (
                    <ImageUpload
                      value={value}
                      onChange={onChange}
                      onRemoveExisting={() => form.setValue("imageId", null)}
                      error={error?.message}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-default-700">
                  Notes
                </label>
                <Editor
                  className="overflow-hidden rounded-xl border border-divider bg-background"
                  onChange={(state) =>
                    form.setValue("description", JSON.stringify(state.toJSON()))
                  }
                  editorSerializedState={
                    entry?.description ? JSON.parse(entry.description) : null
                  }
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" type="submit" isLoading={isPending}>
                {entry ? "Save Changes" : "Create Entry"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
