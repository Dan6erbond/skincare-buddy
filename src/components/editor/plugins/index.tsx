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
import { DynamicTablePickerPlugin, TablePickerPlugin } from "./picker/table";
import { useEffect, useState } from "react";

import { ActionsPlugin } from "./actions";
import { AlignmentPickerPlugin } from "./picker/alignment";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { AutoLinkPlugin } from "./auto-link";
import { AutocompletePlugin } from "./autocomplete";
import { BlockFormatDropDown } from "./toolbar/block-format";
import { BlockInsertPlugin } from "./toolbar/block-insert";
import { BulletedListPickerPlugin } from "./picker/bulleted-list";
import { CheckListPickerPlugin } from "./picker/check-list";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClearEditorActionPlugin } from "./actions/clear-editor";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { ClearFormattingToolbarPlugin } from "./toolbar/clear-formatting";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { CodeActionMenuPlugin } from "./code-action-menu";
import { CodeHighlightPlugin } from "./code-highlight";
import { CodeLanguageToolbarPlugin } from "./toolbar/code-language";
import { CodePickerPlugin } from "./picker/code";
import { ColumnsLayoutPickerPlugin } from "./picker/columns-layout";
import { ComponentPickerMenuPlugin } from "./component-picker-menu";
import { ContentEditable } from "../ui/content-editable";
import { ContextMenuPlugin } from "./context-menu";
import { DividerPickerPlugin } from "./picker/divider";
import { DragDropPastePlugin } from "./drag-drop-paste";
import { DraggableBlockPlugin } from "./draggable-block";
import { EMOJI } from "../transformers/markdown-emoji";
import { ElementFormatToolbarPlugin } from "./toolbar/element-format";
import { EmojiPickerPlugin } from "./picker/emoji";
import { EmojisPlugin } from "./emojis";
import { FloatingLinkEditorPlugin } from "./floating-link-editor";
import { FloatingTextFormatToolbarPlugin } from "./floating-text-format";
import { FontColorToolbarPlugin } from "./toolbar/font-color";
import { FontFamilyToolbarPlugin } from "./toolbar/font-family";
import { FontFormatToolbarPlugin } from "./toolbar/font-format";
import { FontSizeToolbarPlugin } from "./toolbar/font-size";
import { HR } from "../transformers/markdown-hr";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { HeadingPickerPlugin } from "./picker/heading";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HistoryToolbarPlugin } from "./toolbar/history";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { IMAGE } from "../transformers/markdown-image";
import { ImagePickerPlugin } from "./picker/image";
import { ImagesPlugin } from "./images";
import { KeywordsPlugin } from "./keywords";
import { LayoutPlugin } from "./layout";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { LinkPlugin } from "./link";
import { LinkToolbarPlugin } from "./toolbar/link";
import { ListMaxIndentLevelPlugin } from "./list-max-indent-level";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { MarkdownTogglePlugin } from "./actions/markdown-toggle";
import { MentionsPlugin } from "./mentions";
import { NumberedListPickerPlugin } from "@/components/editor/plugins/picker/numbered-list";
import { ParagraphPickerPlugin } from "./picker/paragraph";
import { QuotePickerPlugin } from "./picker/quote";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { SubSuperToolbarPlugin } from "./toolbar/sub-super";
import { TABLE } from "../transformers/markdown-table";
import { TabFocusPlugin } from "./tab-focus";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { ToolbarPlugin } from "./toolbar";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

const placeholder = "Press / for commands...";

export function Plugins({
  saving,
  saved,
  onSave,
}: {
  saving?: boolean;
  saved?: boolean;
  onSave?(state: SerializedEditorState): void;
}) {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);

  useEffect(() => {
    if (!onSave) return;

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
            {onSave && (
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
            )}
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
                  className="ContentEditable__root relative block min-h-72 overflow-auto px-8 py-4 focus:outline-none"
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
