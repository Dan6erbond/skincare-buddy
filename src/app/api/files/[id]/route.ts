import { NextRequest } from "next/server";
import { bucketId } from "@/lib/appwrite/const";
import { createSessionClient } from "@/lib/appwrite/server";

export async function GET(
  _: NextRequest,
  ctx: RouteContext<"/api/files/[id]">,
) {
  const { id } = await ctx.params;

  const { storage } = await createSessionClient();

  const file = await storage.getFileView({
    bucketId,
    fileId: id,
  });

  return new Response(file, {
    headers: {
      "content-type": "application/octet-stream",
    },
  });
}
