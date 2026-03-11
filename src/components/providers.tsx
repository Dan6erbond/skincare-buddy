"use client";

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { I18nProvider, useLocale } from "@react-aria/i18n";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { AppwriteProvider } from "@/contexts/appwrite";
import { ReactNode } from "react";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error(`[Query Error] ${query.queryKey}:`, error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error(`[Mutation Error]:`, error);
    },
  }),
});

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <AppwriteProvider>
          <HeroUIProviders>{children}</HeroUIProviders>
        </AppwriteProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}

function HeroUIProviders({ children }: { children: ReactNode }) {
  const { locale } = useLocale();

  return (
    <HeroUIProvider locale={locale}>
      <ToastProvider />
      {children}
    </HeroUIProvider>
  );
}
