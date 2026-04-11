import { NextResponse } from "next/server";

import { parseCommerceEnv } from "@ai-nft-forge/shared";

import {
  createCommerceErrorResponse,
  parseJsonBody
} from "../../../../../server/commerce/http";
import { CommerceServiceError } from "../../../../../server/commerce/error";
import { createRuntimeCollectionCommerceService } from "../../../../../server/commerce/runtime";

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

export async function POST(request: Request) {
  try {
    const commerceEnv = parseCommerceEnv(process.env);
    const token = readBearerToken(request);

    if (
      !token ||
      token !== commerceEnv.COMMERCE_FULFILLMENT_CALLBACK_BEARER_TOKEN
    ) {
      throw new CommerceServiceError(
        "FULFILLMENT_CALLBACK_UNAUTHORIZED",
        "A valid fulfillment callback token is required.",
        401
      );
    }

    const result =
      await createRuntimeCollectionCommerceService().recordFulfillmentAutomationCallback(
        {
          body: await parseJsonBody(request)
        }
      );

    return NextResponse.json(result);
  } catch (error) {
    return createCommerceErrorResponse(error);
  }
}
