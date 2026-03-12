import { Account, Client, Storage, TablesDB, Teams } from "appwrite";

export { ID } from "appwrite";

export const createClient = (session: string | null) => {
  const client = new Client();

  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  if (session) {
    client.setSession(session);
  }

  return {
    client,
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
  };
};
