import "./globals.css";

import { Geist, Lexend_Deca } from "next/font/google";

import { APPWRITE_SESSION_KEY } from "@/lib/appwrite/const";
import AppNavbar from "./navbar";
import { AuthProvider } from "@/contexts/auth";
import type { Metadata } from "next";
import Providers from "./providers";
import { cn } from "@heroui/react";
import { cookies } from "next/headers";
import { getLoggedInUser } from "@/lib/appwrite/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const lexendDeca = Lexend_Deca({
  variable: "--font-lexend-deca",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skincare Buddy | Your Personal Glow Guide",
  description:
    "Track your skincare routine, analyze product ingredients, and get AI-powered recommendations based on your skin's unique needs.",
  keywords: [
    "skincare tracker",
    "AI beauty assistant",
    "skincare routine",
    "product logger",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getLoggedInUser();
  const sessionCookie = (await cookies()).get(APPWRITE_SESSION_KEY);
  const session = sessionCookie?.value ?? null;

  return (
    <html
      lang="en"
      className={cn(geistSans.variable, lexendDeca.variable, "antialiased")}
      data-scroll-behavior="smooth"
    >
      <body>
        <AuthProvider user={user} session={session}>
          <Providers>
            <AppNavbar />
            {children}
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
