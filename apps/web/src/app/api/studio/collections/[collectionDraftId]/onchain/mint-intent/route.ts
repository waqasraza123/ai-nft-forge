import { collectionContractMintIntentRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createCollectionDraftErrorResponse,
  parseJsonBody,
  requireStudioOwnerApiSession
} from "../../../../../../../server/collections/http";
import { createRuntimeCollectionDraftService } from "../../../../../../../server/collections/runtime";

type RouteContext = {
  params: Promise<{
    collectionDraftId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioOwnerApiSession();
    const { collectionDraftId } = await context.params;
    const body = collectionContractMintIntentRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeCollectionDraftService().createCollectionContractMintIntent(
        {
          collectionDraftId,
          ownerUserId: session.ownerUserId,
          recipientWalletAddress: body.recipientWalletAddress,
          tokenId: body.tokenId,
          workspaceId: session.workspace.id
        }
      );

    return NextResponse.json(result);
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}
