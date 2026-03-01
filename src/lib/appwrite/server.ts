"use server";

import { Account, Client, ID, OAuthProvider } from "node-appwrite";
import { cookies, headers } from "next/headers";

import { APPWRITE_SESSION_KEY } from "./const";
import { redirect } from "next/navigation";

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  const session = (await cookies()).get(APPWRITE_SESSION_KEY);
  if (!session || !session.value) {
    throw new Error("No session");
  }

  client.setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
  };
}

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.NEXT_APPWRITE_KEY!);

  return {
    get account() {
      return new Account(client);
    },
  };
}

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email")! as string;
  const password = formData.get("password")! as string;
  const name = formData.get("name")! as string;

  const { account } = await createAdminClient();

  await account.create({
    userId: ID.unique(),
    email,
    password,
    name,
  });
  const session = await account.createEmailPasswordSession({
    email,
    password,
  });

  (await cookies()).set(APPWRITE_SESSION_KEY, session.secret, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/dashboard");
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email")! as string;
  const password = formData.get("password")! as string;

  const { account } = await createAdminClient();

  const session = await account.createEmailPasswordSession({
    email,
    password,
  });

  (await cookies()).set(APPWRITE_SESSION_KEY, session.secret, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/dashboard");
}

export async function signOut() {
  const { account } = await createSessionClient();

  (await cookies()).delete(APPWRITE_SESSION_KEY);
  await account.deleteSession({ sessionId: "current" });

  redirect("/");
}

export async function signUpWithGithub() {
  const { account } = await createAdminClient();

  const origin = (await headers()).get("origin");

  const redirectUrl = await account.createOAuth2Token({
    provider: OAuthProvider.Github,
    success: `${origin}/oauth`,
    failure: `${origin}`,
  });

  return redirect(redirectUrl);
}
