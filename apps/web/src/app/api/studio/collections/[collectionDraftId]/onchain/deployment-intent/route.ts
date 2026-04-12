import {
  collectionContractDeploymentIntentRequestSchema,
  type CollectionContractChainKey
} from "@ai-nft-forge/shared";
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
    const body = collectionContractDeploymentIntentRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeCollectionDraftService().createCollectionContractDeploymentIntent(
        {
          chainKey: body.chainKey as CollectionContractChainKey,
          collectionDraftId,
          origin: new URL(request.url).origin,
          ownerUserId: session.ownerUserId,
          ownerWalletAddress: session.owner.walletAddress,
          workspaceId: session.workspace.id
        }
      );

    return NextResponse.json(result);
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}
