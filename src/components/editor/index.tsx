"use client";

import { EditorState, SerializedEditorState } from "lexical";
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";

import { HTMLProps } from "react";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { Plugins } from "./plugins";
import { cn } from "@heroui/react";
import { editorTheme } from "./theme";
import { nodes } from "./nodes";

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error);
  },
};

export function Editor({
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
  className,
  saving,
  saved,
  onSave,
  ...props
}: {
  editorState?: EditorState | string;
  editorSerializedState?: SerializedEditorState;
  onChange?: (editorState: EditorState) => void;
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void;
  saving?: boolean;
  saved?: boolean;
  onSave?(state: SerializedEditorState): void;
} & Omit<HTMLProps<HTMLDivElement>, "onChange">) {
  return (
    <div
      className={cn(
        "bg-background overflow-hidden rounded-lg border shadow",
        className,
      )}
      {...props}
    >
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          ...(editorState ? { editorState } : {}),
          ...(editorSerializedState
            ? { editorState: JSON.stringify(editorSerializedState) }
            : {}),
        }}
      >
        <Plugins saving={saving} saved={saved} onSave={onSave} />

        <OnChangePlugin
          ignoreSelectionChange={true}
          onChange={(editorState) => {
            onChange?.(editorState);
            onSerializedChange?.(editorState.toJSON());
          }}
        />
      </LexicalComposer>
    </div>
  );
}
