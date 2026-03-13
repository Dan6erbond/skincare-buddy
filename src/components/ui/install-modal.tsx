"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  addToast,
  closeToast,
  useDisclosure,
} from "@heroui/react";
import { Download, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

import Image from "next/image";

// Types for the experimental BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallModal = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [toastId, setToastId] = useState<string | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      return;
    }
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Trigger the HeroUI Toast
      const id = addToast({
        icon: (
          <div>
            <Smartphone />
          </div>
        ),
        title: "Install SkincareBuddy",
        description:
          "Add to your home screen for quick access to your routines.",
        timeout: 10000,
        color: "secondary",
        classNames: {
          base: "flex flex-col items-start bg-gradient-to-r from-secondary-50 to-secondary-100 border-0 border-l-[6px] border-l-secondary-200 rounded-medium",
        },
        endContent: (
          <div className="ms-11 my-2 flex gap-x-2">
            <Button
              color="secondary"
              size="sm"
              variant="flat"
              onPress={() => {
                onOpen();
                if (id) closeToast(id);
              }}
            >
              Install
            </Button>
            <Button
              color="default"
              size="sm"
              variant="light"
              onPress={() => id && closeToast(id)}
            >
              Later
            </Button>
          </div>
        ),
      });
      setToastId(id);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [onOpen, setDeferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the native install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      if (toastId) closeToast(toastId);
    }

    onClose();
  };

  if (!deferredPrompt) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  height={50}
                  width={50}
                  alt="Skincare Buddy"
                />
                <span>Install App</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <p className="text-default-600">
                Install <strong>SkincareBuddy</strong> on your device for a
                faster, full-screen experience.
              </p>
              <ul className="list-disc list-inside text-sm text-default-500 space-y-1 ml-2">
                <li>Access your routines directly from your home screen.</li>
                <li>More screen space for your skincare steps.</li>
                <li>Faster loading times.</li>
              </ul>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Maybe Later
              </Button>
              <Button
                color="primary"
                startContent={<Download className="size-4" />}
                onPress={handleInstall}
              >
                Install Now
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
