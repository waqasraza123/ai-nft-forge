import { NextResponse } from "next/server";

import {
  createCommerceErrorResponse,
  parseJsonBody,
  requireStudioActiveApiSession
} from "../../../../../../../../server/commerce/http";
import { createRuntimeCollectionCommerceService } from "../../../../../../../../server/commerce/runtime";

type RouteContext = {
  params: Promise<{
    checkoutSessionId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioActiveApiSession();
    const { checkoutSessionId } = await context.params;
    const result =
      await createRuntimeCollectionCommerceService().retryOwnerCheckoutFulfillment(
        {
          body: await parseJsonBody(request),
          checkoutSessionId,
          workspaceId: session.workspace.id
        }
      );

    return NextResponse.json(result);
  } catch (error) {
    return createCommerceErrorResponse(error);
  }
}
