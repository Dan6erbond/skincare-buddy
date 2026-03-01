import { APPWRITE_SESSION_KEY, createAdminClient } from "@/lib/appwrite/server";
import { NextRequest, NextResponse } from "next/server";

import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId")!;
  const secret = request.nextUrl.searchParams.get("secret")!;

  const { account } = await createAdminClient();
  const session = await account.createSession({
    userId,
    secret,
  });

  (await cookies()).set(APPWRITE_SESSION_KEY, session.secret, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: true,
  });

  return NextResponse.redirect(`${request.nextUrl.origin}/account`);
}
