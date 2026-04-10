import { collectionContractDeploymentRecordRequestSchema } from "@ai-nft-forge/shared";
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
    const body = collectionContractDeploymentRecordRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeCollectionDraftService().recordCollectionContractDeployment(
        body.deployedAt
          ? {
              chainKey: body.chainKey,
              collectionDraftId,
              contractAddress: body.contractAddress,
              deployedAt: body.deployedAt,
              deployTxHash: body.deployTxHash,
              ownerUserId: session.user.id
            }
          : {
            chainKey: body.chainKey,
            collectionDraftId,
            contractAddress: body.contractAddress,
            deployTxHash: body.deployTxHash,
            ownerUserId: session.user.id
          }
      );

    return NextResponse.json(result);
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}
