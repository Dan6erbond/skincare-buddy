import { NextRequest, NextResponse } from "next/server";

import { APPWRITE_SESSION_KEY } from "@/lib/appwrite/const";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/appwrite/server";

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
