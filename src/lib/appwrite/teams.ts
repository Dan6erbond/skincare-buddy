"use server";

import { Query, Teams } from "node-appwrite";

import { createAdminClient } from "@/lib/appwrite/server";
import { teamIds } from "@/lib/appwrite/const";

export async function isAdmin(userId: string) {
  const client = createAdminClient();
  const teams = new Teams(new Client());
  const { total } = await teams.listMemberships({
    teamId: teamIds.admins,
    queries: [Query.equal("userId", user.$id)],
  });
  return total > 0;
}
