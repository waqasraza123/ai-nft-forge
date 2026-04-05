import { authNonceRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createAuthErrorResponse,
  parseJsonBody
} from "../../../../server/auth/http";
import { createRuntimeAuthService } from "../../../../server/auth/runtime";

export async function POST(request: Request) {
  try {
    const body = authNonceRequestSchema.parse(await parseJsonBody(request));
    const nonceResponse = await createRuntimeAuthService().issueNonce(body);

    return NextResponse.json(nonceResponse);
  } catch (error) {
    return createAuthErrorResponse(error);
  }
}
