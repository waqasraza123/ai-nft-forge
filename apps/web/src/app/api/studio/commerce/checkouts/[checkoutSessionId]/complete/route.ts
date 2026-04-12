import { NextResponse } from "next/server";

import {
  createCommerceErrorResponse,
  requireStudioActiveApiSession
} from "../../../../../../../server/commerce/http";
import { createRuntimeCollectionCommerceService } from "../../../../../../../server/commerce/runtime";

type RouteContext = {
  params: Promise<{
    checkoutSessionId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  try {
    const session = await requireStudioActiveApiSession();
    const { checkoutSessionId } = await context.params;
    const result =
      await createRuntimeCollectionCommerceService().completeOwnerManualCheckout(
        {
          checkoutSessionId,
          workspaceId: session.workspace.id
        }
      );

    return NextResponse.json(result);
  } catch (error) {
    return createCommerceErrorResponse(error);
  }
}
