import {
  collectionContractDeploymentIntentRequestSchema,
  type CollectionContractChainKey
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createCollectionDraftErrorResponse,
  parseJsonBody,
  requireStudioApiSession
} from "../../../../../../../server/collections/http";
import { createRuntimeCollectionDraftService } from "../../../../../../../server/collections/runtime";

type RouteContext = {
  params: Promise<{
    collectionDraftId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioApiSession();
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
          ownerUserId: session.user.id,
          ownerWalletAddress: session.user.walletAddress
        }
      );

    return NextResponse.json(result);
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}
