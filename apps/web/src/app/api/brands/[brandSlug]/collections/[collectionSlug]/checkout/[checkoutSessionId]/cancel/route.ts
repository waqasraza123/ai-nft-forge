import { NextResponse } from "next/server";

import { createCommerceErrorResponse } from "../../../../../../../../../server/commerce/http";
import { createRuntimeCollectionCommerceService } from "../../../../../../../../../server/commerce/runtime";

type RouteContext = {
  params: Promise<{
    brandSlug: string;
    checkoutSessionId: string;
    collectionSlug: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  try {
    const { brandSlug, checkoutSessionId, collectionSlug } = await context.params;
    const result =
      await createRuntimeCollectionCommerceService().cancelCheckoutSession({
        brandSlug,
        checkoutSessionId,
        collectionSlug
      });

    return NextResponse.json(result);
  } catch (error) {
    return createCommerceErrorResponse(error);
  }
}
