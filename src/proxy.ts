import { NextRequest, NextResponse } from "next/server";

import { APPWRITE_SESSION_KEY } from "@/lib/appwrite/const";
import { Models } from "node-appwrite";
import { createClient } from "@/lib/appwrite/server";

export async function proxy(req: NextRequest) {
  const session = req.cookies.get(APPWRITE_SESSION_KEY)?.value;

  let user: Models.User | undefined;
  if (session) {
    const { account } = await createClient(session);
    try {
      user = await account.get();
    } catch (error) {
      console.error(error);
    }
  }

  if (req.nextUrl.pathname === "/") {
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (user == null) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.).*)"],
};
