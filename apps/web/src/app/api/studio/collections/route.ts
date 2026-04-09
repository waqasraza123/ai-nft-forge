import { collectionDraftCreateRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createCollectionDraftErrorResponse,
  parseJsonBody,
  requireStudioApiSession
} from "../../../../server/collections/http";
import { createRuntimeCollectionDraftService } from "../../../../server/collections/runtime";

export async function GET() {
  try {
    const session = await requireStudioApiSession();
    const result =
      await createRuntimeCollectionDraftService().listCollectionDrafts({
        ownerUserId: session.user.id
      });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireStudioApiSession();
    const body = collectionDraftCreateRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeCollectionDraftService().createCollectionDraft({
        description: body.description ?? null,
        ownerUserId: session.user.id,
        title: body.title
      });

    return NextResponse.json(result, {
      status: 201
    });
  } catch (error) {
    return createCollectionDraftErrorResponse(error);
  }
}
