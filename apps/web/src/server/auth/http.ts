import { authErrorResponseSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import { AuthServiceError } from "./error";

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AuthServiceError(
      "INVALID_REQUEST",
      "Request body must be valid JSON.",
      400
    );
  }
}

export function createAuthErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthServiceError) {
    return NextResponse.json(
      authErrorResponseSchema.parse({
        error: {
          code: error.code,
          message: error.message
        }
      }),
      {
        status: error.statusCode
      }
    );
  }

  return NextResponse.json(
    authErrorResponseSchema.parse({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected authentication error."
      }
    }),
    {
      status: 500
    }
  );
}
