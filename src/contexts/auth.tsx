"use client";

import { ReactNode, createContext, useContext } from "react";

import { Models } from "appwrite";

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  session: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  user,
  session,
}: AuthContextType & { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user, session }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) throw new Error("useAuth must be used within AuthProvider");

  const { session, user } = context;

  return { user, session };
};
