"use server";

import {
  Account,
  Client,
  ID,
  OAuthProvider,
  Storage,
  TablesDB,
  Teams,
  Tokens,
} from "node-appwrite";
import { cookies, headers } from "next/headers";

import { APPWRITE_SESSION_KEY } from "./const";
import { redirect } from "next/navigation";

export async function createClient<S extends string | null | undefined>(
  session?: S,
) {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  if (session) {
    client.setSession(session);
  }

  return {
    client,
    session: session as S,
    get account() {
      return new Account(client);
    },
    get tables() {
      return new TablesDB(client);
    },
    get storage() {
      return new Storage(client);
    },
    get teams() {
      return new Teams(client);
    },
    get tokens() {
      return new Tokens(client);
    },
  };
}

export async function createSessionClient() {
  const session = (await cookies()).get(APPWRITE_SESSION_KEY)?.value;
  return await createClient(session);
}

export async function createAdminClient() {
  return await createClient().then(({ client, ...rest }) => ({
    ...rest,
    client: client.setKey(process.env.NEXT_APPWRITE_KEY!),
  }));
}

export async function getLoggedInUser() {
  const { account } = await createSessionClient();

  try {
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
