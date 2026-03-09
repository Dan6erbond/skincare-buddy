"use client";

import {
  Button,
  ButtonGroup,
  ButtonProps,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  addToast,
} from "@heroui/react";
import { ChevronDown, ExternalLink } from "lucide-react";

interface AIExportButtonProps extends ButtonProps {
  clipboardText: string;
  label?: string;
}

export const AIExportButton = ({
  clipboardText,
  label = "Export for AI",
  ...buttonProps
}: AIExportButtonProps) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(clipboardText);
      addToast({
        title: "Copied to Clipboard",
        description: "Content formatted for AI analysis.",
        color: "success",
        shouldShowTimeoutProgress: true,
      });
    } catch (err) {
      addToast({
        title: "Copy Error",
        description: "Could not access clipboard.",
        color: "danger",
      });
    }
  };

  const openInAI = (platform: "chatgpt" | "gemini") => {
    const encodedText = encodeURIComponent(clipboardText);
    const urls = {
      chatgpt: `https://chatgpt.com/?q=${encodedText}`,
      gemini: `https://gemini.google.com/?q=${encodedText}`,
    };

    window.open(urls[platform], "_blank", "noopener,noreferrer");
  };

  return (
    <ButtonGroup
      variant={buttonProps.variant || "flat"}
      color={buttonProps.color || "secondary"}
      className={buttonProps.className}
    >
      <Button
        {...buttonProps}
        // Ensure the main button doesn't inherit styles that break the group
        className="font-bold uppercase tracking-wider"
        onPress={handleCopy}
      >
        {buttonProps.children || label}
      </Button>

      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Button
            isIconOnly
            color={buttonProps.color || "secondary"}
            variant={buttonProps.variant || "flat"}
            size={buttonProps.size}
          >
            <ChevronDown className="size-4" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="AI Export Options"
          onAction={(key) => openInAI(key as "chatgpt" | "gemini")}
        >
          <DropdownItem
            key="chatgpt"
            description="Open and paste in ChatGPT"
            startContent={<ExternalLink className="size-4" />}
          >
            Open ChatGPT
          </DropdownItem>
          <DropdownItem
            key="gemini"
            description="Open and paste in Gemini"
            startContent={<ExternalLink className="size-4" />}
          >
            Open Gemini
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </ButtonGroup>
  );
};
