import {
  authSessionResponseSchema,
  authVerifyRequestSchema
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import { createSessionCookieDefinition } from "../../../../lib/session/cookie";
import {
  createAuthErrorResponse,
  parseJsonBody
} from "../../../../server/auth/http";
import { extractAuthRequestContext } from "../../../../server/auth/request-context";
import {
  createRuntimeAuthService,
  getWebAuthConfig
} from "../../../../server/auth/runtime";

export async function POST(request: Request) {
  try {
    const body = authVerifyRequestSchema.parse(await parseJsonBody(request));
    const requestContext = extractAuthRequestContext(request);
    const webAuthConfig = getWebAuthConfig();
    const verificationResult =
      await createRuntimeAuthService().verifyAndCreateSession({
        ipAddress: requestContext.ipAddress,
        nonce: body.nonce,
        signature: body.signature as `0x${string}`,
        userAgent: requestContext.userAgent,
        walletAddress: body.walletAddress,
        ...(body.signedMessage !== undefined
          ? {
              signedMessage: body.signedMessage
            }
          : {}),
        ...(requestContext.host !== null
          ? {
              expectedDomain: requestContext.host
            }
          : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
        ...(body.displayName !== undefined
          ? { displayName: body.displayName }
          : {})
      });
    const response = NextResponse.json(
      authSessionResponseSchema.parse({
        authenticated: true,
        session: verificationResult.session
      })
    );

    response.cookies.set(
      createSessionCookieDefinition({
        expiresAt: new Date(verificationResult.session.expiresAt),
        name: webAuthConfig.AUTH_SESSION_COOKIE_NAME,
        nodeEnvironment: process.env.NODE_ENV,
        value: verificationResult.sessionId
      })
    );

    return response;
  } catch (error) {
    return createAuthErrorResponse(error);
  }
}
