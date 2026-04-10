import { NextResponse } from "next/server";

import {
  createCommerceErrorResponse,
  requireStudioApiSession
} from "../../../../server/commerce/http";
import { createRuntimeCollectionCommerceService } from "../../../../server/commerce/runtime";

export async function GET() {
  try {
    const session = await requireStudioApiSession();
    const result =
      await createRuntimeCollectionCommerceService().getOwnerCommerceDashboard({
        ownerUserId: session.user.id
      });

    return NextResponse.json(result);
  } catch (error) {
    return createCommerceErrorResponse(error);
  }
}
