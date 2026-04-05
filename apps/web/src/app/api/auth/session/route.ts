import { authSessionResponseSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import { createAuthErrorResponse } from "../../../../server/auth/http";
import { getCurrentAuthSession } from "../../../../server/auth/session";

export async function GET() {
  try {
    const session = await getCurrentAuthSession();

    return NextResponse.json(
      authSessionResponseSchema.parse({
        authenticated: Boolean(session),
        session
      })
    );
  } catch (error) {
    return createAuthErrorResponse(error);
  }
}
