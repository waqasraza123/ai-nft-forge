import { NextResponse } from "next/server";

import { createRuntimePublicCollectionService } from "../../../../../../../server/collections/runtime";

type RouteContext = {
  params: Promise<{
    brandSlug: string;
    collectionSlug: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { brandSlug, collectionSlug } = await context.params;
  const result =
    await createRuntimePublicCollectionService().getPublicCollectionMetadataManifestBySlugs(
      {
        brandSlug,
        collectionSlug
      }
    );

  if (!result) {
    return NextResponse.json(
      {
        error: {
          code: "COLLECTION_METADATA_NOT_FOUND",
          message: "Published collection metadata was not found."
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
