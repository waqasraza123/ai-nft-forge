import { NextResponse } from "next/server";

import {
  createCommerceErrorResponse,
  parseJsonBody
} from "../../../../../../../server/commerce/http";
import { createRuntimeCollectionCommerceService } from "../../../../../../../server/commerce/runtime";

type RouteContext = {
  params: Promise<{
    brandSlug: string;
    collectionSlug: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { brandSlug, collectionSlug } = await context.params;
    const result =
      await createRuntimeCollectionCommerceService().createCheckoutSession({
        body: await parseJsonBody(request),
        brandSlug,
        collectionSlug,
        origin: new URL(request.url).origin
      });

    return NextResponse.json(result, {
      status: 201
    });
  } catch (error) {
    return createCommerceErrorResponse(error);
  }
}
