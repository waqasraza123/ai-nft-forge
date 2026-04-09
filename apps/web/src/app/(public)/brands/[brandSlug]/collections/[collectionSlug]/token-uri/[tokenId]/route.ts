import { NextResponse } from "next/server";

import { createRuntimePublicCollectionService } from "../../../../../../../../server/collections/runtime";

type RouteContext = {
  params: Promise<{
    brandSlug: string;
    collectionSlug: string;
    tokenId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { brandSlug, collectionSlug, tokenId } = await context.params;
  const parsedTokenId = Number.parseInt(tokenId, 10);

  if (!Number.isInteger(parsedTokenId) || parsedTokenId < 1) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_TOKEN_ID",
          message: "Token id must be a positive integer."
        }
      },
      {
        status: 400
      }
    );
  }

  const result =
    await createRuntimePublicCollectionService().getPublicCollectionMetadataItemBySlugs(
      {
        brandSlug,
        collectionSlug,
        editionNumber: parsedTokenId
      }
    );

  if (!result) {
    return NextResponse.json(
      {
        error: {
          code: "COLLECTION_TOKEN_URI_NOT_FOUND",
          message: "Published collection token metadata was not found."
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
