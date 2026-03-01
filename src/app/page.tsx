"use client";

import { Button, Card, CardBody, Input, Tab, Tabs } from "@heroui/react";
import { signInWithEmail, signUpWithEmail } from "@/lib/appwrite/server";
import { useState, useTransition } from "react";

import { Key } from "@react-types/shared";
import { Sparkles } from "lucide-react";

export default function AuthForm() {
  const [selected, setSelected] = useState<Key>("login");
  const [isPending, startTransition] = useTransition();

  const handleAction = async (
    formData: FormData,
    action: (data: FormData) => Promise<void>
  ) => {
    startTransition(async () => {
      await action(formData);
      // Next.js redirect happens automatically if the action calls redirect()
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-primary-50 to-secondary-50 p-4">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background shadow-sm mb-4">
          <Sparkles className="text-primary size-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Skincare Buddy
        </h1>
        <p className="text-default-500 mt-2">
          Personalized care for your unique skin.
        </p>
      </div>

      <Card className="w-full max-w-100 shadow-xl border-none bg-background/80 backdrop-blur-md">
        <CardBody className="p-8">
          <Tabs
            fullWidth
            aria-label="Authentication Options"
            selectedKey={selected}
            onSelectionChange={(key) => setSelected(key as "login" | "sign-up")}
            variant="underlined"
            classNames={{
              tabList:
                "gap-6 w-full relative rounded-none border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary font-medium",
            }}
          >
            <Tab key="login" title="Login">
              <form
                action={(data) => handleAction(data, signInWithEmail)}
                className="flex flex-col gap-5 pt-4"
              >
                <Input
                  name="email"
                  isRequired
                  label="Email"
                  placeholder="Enter your email"
                  variant="flat"
                  type="email"
                />
                <Input
                  name="password"
                  isRequired
                  label="Password"
                  placeholder="Enter your password"
                  variant="flat"
                  type="password"
                />
                <Button
                  type="submit"
                  color="primary"
                  isLoading={isPending}
                  className="mt-2 font-bold shadow-lg shadow-primary/20 bg-linear-to-r from-primary to-primary-400"
                >
                  Welcome Back!
                </Button>
              </form>
            </Tab>

            <Tab key="sign-up" title="Join the Club">
              <form
                action={(data) => handleAction(data, signUpWithEmail)}
                className="flex flex-col gap-5 pt-4"
              >
                <Input
                  name="name"
                  isRequired
                  label="Name"
                  variant="flat"
                  placeholder="Your name"
                />
                <Input
                  name="email"
                  isRequired
                  label="Email"
                  variant="flat"
                  type="email"
                  placeholder="Email address"
                />
                <Input
                  name="password"
                  isRequired
                  label="Create Password"
                  variant="flat"
                  type="password"
                  placeholder="Choose a password"
                />
                <Button
                  type="submit"
                  color="secondary"
                  isLoading={isPending}
                  className="mt-2 font-bold shadow-lg shadow-secondary/20 bg-linear-to-r from-secondary to-secondary-400"
                >
                  Start Glowing
                </Button>
              </form>
            </Tab>
          </Tabs>

          <p className="text-center text-xs text-default-400 mt-6">
            By signing up, you agree to treat your skin with love. ✨
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
