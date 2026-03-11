import { Client } from "appwrite";

export { ID } from "appwrite";

export const createClient = (session: string | null) => {
  const client = new Client();

  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

  if (session) {
    client.setSession(session);
  }

  return client;
};
