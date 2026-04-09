import { NextResponse } from "next/server";

import { createRuntimePublicCollectionService } from "../../../../../../../server/collections/runtime";

type RouteContext = {
  params: Promise<{
    brandSlug: string;
    collectionSlug: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { brandSlug, collectionSlug } = await context.params;
  const result =
    await createRuntimePublicCollectionService().getPublicCollectionContractBySlugs(
      {
        brandSlug,
        collectionSlug,
        origin: new URL(request.url).origin
      }
    );

  if (!result) {
    return NextResponse.json(
      {
        error: {
          code: "COLLECTION_CONTRACT_NOT_FOUND",
          message: "Published collection contract metadata was not found."
        }
      },
      {
        status: 404
      }
    );
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
