/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  SerializedEditorState,
  SerializedElementNode,
  SerializedLexicalNode,
  SerializedTextNode,
} from "lexical";

import React from "react";

// Lexical Text Format Bitmasks
const IS_BOLD = 1;
const IS_ITALIC = 2;
const IS_STRIKETHROUGH = 4;
const IS_UNDERLINE = 8;
const IS_CODE = 16;

interface LexicalRendererProps {
  state: SerializedEditorState;
  className?: string;
}

export function LexicalRenderer({
  state,
  className = "",
}: LexicalRendererProps) {
  if (!state?.root?.children) return null;

  return (
    <div className={`prose prose-sm prose-flat max-w-none ${className}`}>
      {renderNodes(state.root.children)}
    </div>
  );
}

function renderNodes(nodes: SerializedLexicalNode[]): React.ReactNode {
  return nodes.map((node, index) => {
    // 1. Text Node Logic
    if (node.type === "text") {
      const { text, format, style } = node as SerializedTextNode;
      let content: React.ReactNode = text;

      if (format & IS_BOLD) content = <strong key={index}>{content}</strong>;
      if (format & IS_ITALIC) content = <em key={index}>{content}</em>;
      if (format & IS_UNDERLINE)
        content = (
          <u key={index} className="underline decoration-secondary/30">
            {content}
          </u>
        );
      if (format & IS_STRIKETHROUGH)
        content = (
          <span key={index} className="line-through opacity-50">
            {content}
          </span>
        );
      if (format & IS_CODE)
        content = (
          <code
            key={index}
            className="bg-default-100 px-1 rounded text-secondary"
          >
            {content}
          </code>
        );

      return (
        <span key={index} style={{ color: style }}>
          {content}
        </span>
      );
    }

    // 2. Element Node Logic (Recursive)
    const elementNode = node as SerializedElementNode;
    const children = elementNode.children
      ? renderNodes(elementNode.children)
      : null;

    switch (node.type) {
      case "paragraph":
        return <p key={index}>{children}</p>;

      case "list": {
        const { listType } = node as any;
        const Tag = listType === "number" ? "ol" : "ul";
        return <Tag key={index}>{children}</Tag>;
      }

      case "listitem":
        return <li key={index}>{children}</li>;

      case "heading": {
        const { tag: Tag } = node as any;
        return <Tag key={index}>{children}</Tag>;
      }

      case "quote":
        return <blockquote key={index}>{children}</blockquote>;

      case "autocomplete":
        return null;

      default:
        // Render children for unknown nodes (like layout containers) to preserve content
        return children;
    }
  });
}
