import { collectionContractDeploymentRecordRequestSchema } from "@ai-nft-forge/shared";
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
    const body = collectionContractDeploymentRecordRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeCollectionDraftService().recordCollectionContractDeployment(
        {
          chainKey: body.chainKey,
          collectionDraftId,
          deployTxHash: body.deployTxHash,
          origin: new URL(request.url).origin,
          ownerUserId: session.ownerUserId,
          ownerWalletAddress: session.owner.walletAddress
        }
      );

    return NextResponse.json(result);
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}
