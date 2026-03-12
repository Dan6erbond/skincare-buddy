import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

import { bucketId } from "@/lib/appwrite/const";
import { createClient } from "@/lib/appwrite";

export async function GET(
  _: NextRequest,
  ctx: RouteContext<"/api/files/[id]">,
) {
  const { id } = await ctx.params;

  const { storage } = await createSessionClient();

  const file = await storage.getFile({
    bucketId,
    fileId: id,
  });

  const { tokens } = await createAdminClient();

  let token: string | undefined;

  const { tokens: tokensList } = await tokens.list({
    bucketId: file.bucketId,
    fileId: file.$id,
    total: false,
  });

  if (tokensList.length > 0) {
    token = tokensList[0].secret;
  } else {
    token = await tokens
      .createFileToken({
        bucketId: file.bucketId,
        fileId: file.$id,
      })
      .then((tok) => tok.secret);
  }

  const { storage: storageClient } = createClient();

  return NextResponse.redirect(
    storageClient.getFileView({
      bucketId: file.bucketId,
      fileId: file.$id,
      token,
    }),
  );
}
