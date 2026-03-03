import { getLoggedInUser } from "@/lib/appwrite/server";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/") {
    if (await getLoggedInUser()) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if ((await getLoggedInUser()) == null) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
