import { collectionContractMintRecordRequestSchema } from "@ai-nft-forge/shared";
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
    const body = collectionContractMintRecordRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeCollectionDraftService().recordCollectionContractMint({
        collectionDraftId,
        ownerUserId: session.ownerUserId,
        ownerWalletAddress: session.owner.walletAddress,
        recipientWalletAddress: body.recipientWalletAddress,
        tokenId: body.tokenId,
        txHash: body.txHash,
        workspaceId: session.workspace.id
      });

    return NextResponse.json(result);
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}
