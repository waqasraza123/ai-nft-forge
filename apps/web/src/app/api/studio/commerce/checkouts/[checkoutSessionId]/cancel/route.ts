import { NextResponse } from "next/server";

import {
  createCommerceErrorResponse,
  requireStudioApiSession
} from "../../../../../../../server/commerce/http";
import { createRuntimeCollectionCommerceService } from "../../../../../../../server/commerce/runtime";

type RouteContext = {
  params: Promise<{
    checkoutSessionId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  try {
    const session = await requireStudioApiSession();
    const { checkoutSessionId } = await context.params;
    const result =
      await createRuntimeCollectionCommerceService().cancelOwnerCheckoutSession(
        {
          checkoutSessionId,
          ownerUserId: session.user.id
        }
      );

    return NextResponse.json(result);
  } catch (error) {
    return createCommerceErrorResponse(error);
  }
}
