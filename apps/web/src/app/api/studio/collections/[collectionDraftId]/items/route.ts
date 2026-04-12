import { collectionDraftItemAddRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createCollectionDraftErrorResponse,
  parseJsonBody,
  requireStudioActiveApiSession
} from "../../../../../../server/collections/http";
import { createRuntimeCollectionDraftService } from "../../../../../../server/collections/runtime";

type RouteContext = {
  params: Promise<{
    collectionDraftId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioActiveApiSession();
    const { collectionDraftId } = await context.params;
    const body = collectionDraftItemAddRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeCollectionDraftService().addCollectionDraftItem({
        collectionDraftId,
        generatedAssetId: body.generatedAssetId,
        workspaceId: session.workspace.id
      });

    return NextResponse.json(result, {
      status: 201
    });
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}
