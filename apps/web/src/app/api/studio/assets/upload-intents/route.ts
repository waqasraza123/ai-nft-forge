import { sourceAssetUploadIntentRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createSourceAssetErrorResponse,
  parseJsonBody,
  requireStudioApiSession
} from "../../../../../server/source-assets/http";
import { createRuntimeSourceAssetService } from "../../../../../server/source-assets/runtime";

export async function POST(request: Request) {
  try {
    const session = await requireStudioApiSession();
    const body = sourceAssetUploadIntentRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result = await createRuntimeSourceAssetService().createUploadIntent({
      contentType: body.contentType,
      fileName: body.fileName,
      ownerUserId: session.ownerUserId,
      workspaceId: session.workspace.id
    });

    return NextResponse.json(result, {
      status: 201
    });
  } catch (error) {
    return createSourceAssetErrorResponse(error);
  }
}
