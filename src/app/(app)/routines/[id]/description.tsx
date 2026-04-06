"use client";

import * as queryKeys from "@/lib/query/keys";

import { databaseId, tableIds } from "@/lib/appwrite/const";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Editor } from "@/components/editor";
import { Routines } from "@/lib/appwrite/types";
import { SerializedEditorState } from "lexical";
import { useAppwrite } from "@/contexts/appwrite";
import { useState } from "react";

interface RoutineDescriptionProps {
  routine: Routines;
}

export function RoutineDescription({ routine }: RoutineDescriptionProps) {
  const { tables } = useAppwrite();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { mutate: saveDescription } = useMutation({
    mutationFn: async (state: SerializedEditorState) => {
      setSaving(true);
      return await tables.updateRow<Routines>({
        databaseId,
        tableId: tableIds.routines,
        rowId: routine.$id,
        data: {
          description: JSON.stringify(state),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.routine(routine.$id),
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    },
    onError: () => setSaving(false),
  });

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-xl font-bold uppercase tracking-tight text-default-600">
          Routine Notes & Experience
        </h2>
      </div>

      <Editor
        className="bg-background overflow-hidden rounded-xl border border-divider shadow-sm"
        saving={saving}
        saved={saved}
        onSave={(state) => saveDescription(state)}
        editorSerializedState={
          routine.description ? JSON.parse(routine.description) : undefined
        }
      />
    </div>
  );
}
