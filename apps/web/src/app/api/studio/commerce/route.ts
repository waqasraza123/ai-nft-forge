import { studioCommerceDashboardQuerySchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createCommerceErrorResponse,
  requireStudioApiSession
} from "../../../../server/commerce/http";
import { createRuntimeCollectionCommerceService } from "../../../../server/commerce/runtime";

export async function GET(request: Request) {
  try {
    const session = await requireStudioApiSession();
    const url = new URL(request.url);
    const query = studioCommerceDashboardQuerySchema.parse({
      brandSlug: url.searchParams.get("brandSlug") ?? undefined
    });
    const result =
      await createRuntimeCollectionCommerceService().getOwnerCommerceDashboard({
        ...(query.brandSlug
          ? {
              brandSlug: query.brandSlug
            }
          : {}),
        workspaceId: session.workspace.id
      });

    return NextResponse.json(result);
  } catch (error) {
    return createCommerceErrorResponse(error);
  }
}
