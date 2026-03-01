"use client";

import { Account, Client, Databases, Storage, TablesDB } from "appwrite";
import { ReactNode, createContext, useContext, useMemo } from "react";

import { useAuth } from "@/contexts/auth";

interface AppwriteContextType {
  client: Client;
  account: Account;
  databases: Databases;
  tables: TablesDB;
  storage: Storage;
}

const AppwriteContext = createContext<AppwriteContextType | undefined>(
  undefined
);

export function AppwriteProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  const client = useMemo(() => {
    const c = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    if (session) {
      c.setSession(session);
    }

    return c;
  }, [session]);

  const services = useMemo(
    () => ({
      client,
      account: new Account(client),
      databases: new Databases(client),
      tables: new TablesDB(client),
      storage: new Storage(client),
    }),
    [client]
  );

  return (
    <AppwriteContext.Provider value={services}>
      {children}
    </AppwriteContext.Provider>
  );
}

export const useAppwrite = () => {
  const context = useContext(AppwriteContext);
  if (!context)
    throw new Error("useAppwrite must be used within AppwriteProvider");
  return context;
};
