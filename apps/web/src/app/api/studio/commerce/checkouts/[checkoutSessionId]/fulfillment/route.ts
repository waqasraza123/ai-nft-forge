import { NextResponse } from "next/server";

import {
  createCommerceErrorResponse,
  parseJsonBody,
  requireStudioApiSession
} from "../../../../../../../server/commerce/http";
import { createRuntimeCollectionCommerceService } from "../../../../../../../server/commerce/runtime";

type RouteContext = {
  params: Promise<{
    checkoutSessionId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioApiSession();
    const { checkoutSessionId } = await context.params;
    const result =
      await createRuntimeCollectionCommerceService().updateOwnerCheckoutFulfillment(
        {
          body: await parseJsonBody(request),
          checkoutSessionId,
          ownerUserId: session.ownerUserId
        }
      );

    return NextResponse.json(result);
  } catch (error) {
    return createCommerceErrorResponse(error);
  }
}
