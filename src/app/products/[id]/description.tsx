"use client";

import * as queryKeys from "@/lib/query/keys";

import { Button, Divider } from "@heroui/react";
import {
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from "@lexical/markdown";
import {
  COMMAND_PRIORITY_CRITICAL,
  KEY_DOWN_COMMAND,
  SELECTION_CHANGE_COMMAND,
  SerializedEditorState,
} from "lexical";
import { CheckIcon, SaveIcon } from "lucide-react";
import {
  DynamicTablePickerPlugin,
  TablePickerPlugin,
} from "@/components/editor/plugins/picker/table";
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ActionsPlugin } from "@/components/editor/plugins/actions";
import { AlignmentPickerPlugin } from "@/components/editor/plugins/picker/alignment";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { AutoLinkPlugin } from "@/components/editor/plugins/auto-link";
import { AutocompletePlugin } from "@/components/editor/plugins/autocomplete";
import { BlockFormatDropDown } from "@/components/editor/plugins/toolbar/block-format";
import { BlockInsertPlugin } from "@/components/editor/plugins/toolbar/block-insert";
import { BulletedListPickerPlugin } from "@/components/editor/plugins/picker/bulleted-list";
import { CheckListPickerPlugin } from "@/components/editor/plugins/picker/check-list";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClearEditorActionPlugin } from "@/components/editor/plugins/actions/clear-editor";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { ClearFormattingToolbarPlugin } from "@/components/editor/plugins/toolbar/clear-formatting";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { CodeActionMenuPlugin } from "@/components/editor/plugins/code-action-menu";
import { CodeHighlightPlugin } from "@/components/editor/plugins/code-highlight";
import { CodeLanguageToolbarPlugin } from "@/components/editor/plugins/toolbar/code-language";
import { CodePickerPlugin } from "@/components/editor/plugins/picker/code";
import { ColumnsLayoutPickerPlugin } from "@/components/editor/plugins/picker/columns-layout";
import { ComponentPickerMenuPlugin } from "@/components/editor/plugins/component-picker-menu";
import { ContentEditable } from "@/components/editor/ui/content-editable";
import { ContextMenuPlugin } from "@/components/editor/plugins/context-menu";
import { DividerPickerPlugin } from "@/components/editor/plugins/picker/divider";
import { DragDropPastePlugin } from "@/components/editor/plugins/drag-drop-paste";
import { DraggableBlockPlugin } from "@/components/editor/plugins/draggable-block";
import { EMOJI } from "@/components/editor/transformers/markdown-emoji";
import { ElementFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/element-format";
import { EmojiPickerPlugin } from "@/components/editor/plugins/picker/emoji";
import { EmojisPlugin } from "@/components/editor/plugins/emojis";
import { FloatingLinkEditorPlugin } from "@/components/editor/plugins/floating-link-editor";
import { FloatingTextFormatToolbarPlugin } from "@/components/editor/plugins/floating-text-format";
import { FontColorToolbarPlugin } from "@/components/editor/plugins/toolbar/font-color";
import { FontFamilyToolbarPlugin } from "@/components/editor/plugins/toolbar/font-family";
import { FontFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/font-format";
import { FontSizeToolbarPlugin } from "@/components/editor/plugins/toolbar/font-size";
import { HR } from "@/components/editor/transformers/markdown-hr";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { HeadingPickerPlugin } from "@/components/editor/plugins/picker/heading";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HistoryToolbarPlugin } from "@/components/editor/plugins/toolbar/history";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { IMAGE } from "@/components/editor/transformers/markdown-image";
import { ImagePickerPlugin } from "@/components/editor/plugins/picker/image";
import { ImagesPlugin } from "@/components/editor/plugins/images";
import { KeywordsPlugin } from "@/components/editor/plugins/keywords";
import { LayoutPlugin } from "@/components/editor/plugins/layout";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { LinkPlugin } from "@/components/editor/plugins/link";
import { LinkToolbarPlugin } from "@/components/editor/plugins/toolbar/link";
import { ListMaxIndentLevelPlugin } from "@/components/editor/plugins/list-max-indent-level";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { MarkdownTogglePlugin } from "@/components/editor/plugins/actions/markdown-toggle";
import { MentionsPlugin } from "@/components/editor/plugins/mentions";
import { NumberedListPickerPlugin } from "@/components/editor/plugins/picker/numbered-list";
import { ParagraphPickerPlugin } from "@/components/editor/plugins/picker/paragraph";
import { Products } from "@/lib/appwrite/appwrite";
import { QuotePickerPlugin } from "@/components/editor/plugins/picker/quote";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { SubSuperToolbarPlugin } from "@/components/editor/plugins/toolbar/sub-super";
import { TABLE } from "@/components/editor/transformers/markdown-table";
import { TabFocusPlugin } from "@/components/editor/plugins/tab-focus";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { ToolbarPlugin } from "@/components/editor/plugins/toolbar";
import { editorTheme } from "@/components/editor/theme";
import { nodes } from "@/components/editor/nodes";
import { useAppwrite } from "@/contexts/appwrite";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error);
  },
};

interface ProductDescriptionProps {
  product: Products;
}

export function ProductDescription({ product }: ProductDescriptionProps) {
  const { tables } = useAppwrite();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { mutate: saveDescription } = useMutation({
    mutationFn: async (state: SerializedEditorState) => {
      setSaving(true);
      return await tables.updateRow<Products>({
        databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_PRODUCTS_TABLE_ID!,
        rowId: product.$id,
        data: {
          description: JSON.stringify(state),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.product(product.$id),
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    },
    onError: () => setSaving(false),
  });

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold uppercase tracking-tight text-default-600">
          Formula Notes & Experience
        </h2>
      </div>

      <div className="bg-background overflow-hidden rounded-xl border border-divider shadow-sm">
        <LexicalComposer
          initialConfig={{
            ...editorConfig,
            ...(product.description
              ? { editorState: product.description }
              : {}),
          }}
        >
          <Plugins
            saving={saving}
            saved={saved}
            onSave={(state) => saveDescription(state)}
          />
        </LexicalComposer>
      </div>
    </div>
  );
}

const placeholder = "Press / for commands...";

export function Plugins({
  saving,
  saved,
  onSave,
}: {
  saving: boolean;
  saved: boolean;
  onSave(state: SerializedEditorState): void;
}) {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);

  useEffect(() => {
    console.log("// 1. Register Selection Change listener");
    const unregisterSelection = activeEditor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );

    const unregisterSave = activeEditor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        const { code, ctrlKey, metaKey } = event;
        if (code === "KeyS" && (ctrlKey || metaKey)) {
          event.preventDefault();

          onSave(activeEditor.getEditorState().toJSON());

          return true; // Prevent further propagation
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );

    // Clean up both listeners
    return () => {
      unregisterSelection();
      unregisterSave();
    };
  }, [activeEditor, onSave]);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <div className="relative">
      <ToolbarPlugin>
        {({ blockType }) => (
          <div className="vertical-align-middle sticky top-0 z-10 flex items-start gap-2 border-b border-content3">
            <div className="flex items-center gap-2 flex-1 shrink overflow-x-auto overflow-y-hidden p-1">
              <HistoryToolbarPlugin />
              <Divider orientation="vertical" className="h-7" />
              <BlockFormatDropDown />
              {blockType === "code" ? (
                <CodeLanguageToolbarPlugin />
              ) : (
                <>
                  <FontFamilyToolbarPlugin />
                  <FontSizeToolbarPlugin />
                  <Divider orientation="vertical" className="h-7" />
                  <FontFormatToolbarPlugin />
                  <Divider orientation="vertical" className="h-7" />
                  <SubSuperToolbarPlugin />
                  <LinkToolbarPlugin setIsLinkEditMode={setIsLinkEditMode} />
                  <Divider orientation="vertical" className="h-7" />
                  <ClearFormattingToolbarPlugin />
                  <Divider orientation="vertical" className="h-7" />
                  <FontColorToolbarPlugin />
                  <Divider orientation="vertical" className="h-7" />
                  <ElementFormatToolbarPlugin />
                  <Divider orientation="vertical" className="h-7" />
                  <BlockInsertPlugin />
                </>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 p-1">
              <Button
                isIconOnly
                className="size-8"
                aria-label="Clear formatting"
                variant="bordered"
                size="sm"
                onPress={() => onSave(activeEditor.getEditorState().toJSON())}
                isLoading={saving}
              >
                {saved ? (
                  <CheckIcon className="size-4 text-success-600" />
                ) : (
                  <SaveIcon className="size-4 text-default-600" />
                )}
              </Button>
            </div>
          </div>
        )}
      </ToolbarPlugin>
      <div className="relative">
        <AutoFocusPlugin />
        <RichTextPlugin
          contentEditable={
            <div className="">
              <div className="" ref={onRef}>
                <ContentEditable
                  placeholder={placeholder}
                  className="ContentEditable__root relative block h-[calc(100vh-570px)] min-h-72 overflow-auto px-8 py-4 focus:outline-none"
                />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        <ClickableLinkPlugin />
        <CheckListPlugin />
        <HorizontalRulePlugin />
        <TablePlugin />
        <ListPlugin />
        <TabIndentationPlugin />
        <HashtagPlugin />
        <HistoryPlugin />

        <MentionsPlugin />
        <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
        <KeywordsPlugin />
        <EmojisPlugin />
        <ImagesPlugin />

        <LayoutPlugin />

        <CodeHighlightPlugin />
        <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />

        <MarkdownShortcutPlugin
          transformers={[
            TABLE,
            HR,
            IMAGE,
            EMOJI,
            CHECK_LIST,
            ...ELEMENT_TRANSFORMERS,
            ...MULTILINE_ELEMENT_TRANSFORMERS,
            ...TEXT_FORMAT_TRANSFORMERS,
            ...TEXT_MATCH_TRANSFORMERS,
          ]}
        />
        <TabFocusPlugin />
        <AutocompletePlugin />
        <AutoLinkPlugin />
        <LinkPlugin />

        <ComponentPickerMenuPlugin
          baseOptions={[
            ParagraphPickerPlugin(),
            HeadingPickerPlugin({ n: 1 }),
            HeadingPickerPlugin({ n: 2 }),
            HeadingPickerPlugin({ n: 3 }),
            TablePickerPlugin(),
            CheckListPickerPlugin(),
            NumberedListPickerPlugin(),
            BulletedListPickerPlugin(),
            QuotePickerPlugin(),
            CodePickerPlugin(),
            DividerPickerPlugin(),
            // EmbedsPickerPlugin({ embed: "tweet" }),
            // EmbedsPickerPlugin({ embed: "youtube-video" }),
            ImagePickerPlugin(),
            ColumnsLayoutPickerPlugin(),
            AlignmentPickerPlugin({ alignment: "left" }),
            AlignmentPickerPlugin({ alignment: "center" }),
            AlignmentPickerPlugin({ alignment: "right" }),
            AlignmentPickerPlugin({ alignment: "justify" }),
          ]}
          dynamicOptionsFn={DynamicTablePickerPlugin}
        />

        <ContextMenuPlugin />
        <DragDropPastePlugin />
        <EmojiPickerPlugin />

        <FloatingLinkEditorPlugin
          anchorElem={floatingAnchorElem}
          isLinkEditMode={isLinkEditMode}
          setIsLinkEditMode={setIsLinkEditMode}
        />
        <FloatingTextFormatToolbarPlugin
          anchorElem={floatingAnchorElem}
          setIsLinkEditMode={setIsLinkEditMode}
        />

        <ListMaxIndentLevelPlugin />
      </div>
      <ActionsPlugin>
        <div className="clear-both flex items-center justify-between gap-2 overflow-auto border-t border-content3 p-1">
          <div className="flex flex-1 justify-end">
            <MarkdownTogglePlugin
              shouldPreserveNewLinesInMarkdown={true}
              transformers={[
                TABLE,
                HR,
                IMAGE,
                EMOJI,
                CHECK_LIST,
                ...ELEMENT_TRANSFORMERS,
                ...MULTILINE_ELEMENT_TRANSFORMERS,
                ...TEXT_FORMAT_TRANSFORMERS,
                ...TEXT_MATCH_TRANSFORMERS,
              ]}
            />
            <>
              <ClearEditorActionPlugin />
              <ClearEditorPlugin />
            </>
          </div>
        </div>
      </ActionsPlugin>
    </div>
  );
}
