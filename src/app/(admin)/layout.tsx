import { Models, Query, Teams } from "node-appwrite";

import AdminNavbar from "./navbar";
import { createSessionClient } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";
import { teamIds } from "@/lib/appwrite/const";

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  let user: Models.User | undefined;
  const { account, client: c } = await createSessionClient();

  try {
    user = await account.get();
  } catch (error) {
    console.error(error);
    // Server-side security gate
    redirect("/login");
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
    <>
      <AdminNavbar />
      {children}
    </>
  );
}
