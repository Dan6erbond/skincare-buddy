import "./globals.css";

import { APPWRITE_SESSION_KEY, teamIds } from "@/lib/appwrite/const";
import { Account, Client, Models, Query, Teams } from "node-appwrite";
import { Geist, Lexend_Deca } from "next/font/google";

import AdminNavbar from "./navbar";
import { AuthProvider } from "@/contexts/auth";
import { Metadata } from "next";
import Providers from "@/components/providers";
import { cn } from "@heroui/react";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const lexendDeca = Lexend_Deca({
  variable: "--font-lexend-deca",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skincare Buddy | Admin",
  description:
    "Track your skincare routine, analyze product ingredients, and get AI-powered recommendations based on your skin's unique needs.",
  keywords: [
    "skincare tracker",
    "AI beauty assistant",
    "skincare routine",
    "product logger",
  ],
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: Models.User | undefined;
  let account: Account | undefined;
  try {
    account = await createSessionClient().then(({ account }) => account);
    user = await account!.get();
  } catch (error) {
    console.error(error);
    // Server-side security gate
    redirect("/login");
  }

  const sessionCookie = (await cookies()).get(APPWRITE_SESSION_KEY);
  const session = sessionCookie?.value ?? null;

  const c = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  if (session) {
    c.setSession(session);
  }

  const teams = new Teams(c);
  const { total } = await teams.listMemberships({
    teamId: teamIds.admins,
    queries: [Query.equal("userId", user.$id)],
  });

  if (total === 0) {
    redirect("/dashboard");
  }

  return (
    <html
      lang="en"
      className={cn(geistSans.variable, lexendDeca.variable, "antialiased")}
      data-scroll-behavior="smooth"
    >
      <body>
        <AuthProvider user={user} session={session}>
          <Providers>
            <AdminNavbar />
            {children}
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
