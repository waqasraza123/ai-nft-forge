import { NextResponse } from "next/server";

import { createRuntimePublicCollectionService } from "../../../../../../../../server/collections/runtime";

type RouteContext = {
  params: Promise<{
    brandSlug: string;
    collectionSlug: string;
    editionNumber: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { brandSlug, collectionSlug, editionNumber } = await context.params;
  const parsedEditionNumber = Number.parseInt(editionNumber, 10);

  if (!Number.isInteger(parsedEditionNumber) || parsedEditionNumber < 1) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_EDITION_NUMBER",
          message: "Edition number must be a positive integer."
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
        editionNumber: parsedEditionNumber
      }
    );

  if (!result) {
    return NextResponse.json(
      {
        error: {
          code: "COLLECTION_METADATA_NOT_FOUND",
          message: "Published collection metadata item was not found."
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
