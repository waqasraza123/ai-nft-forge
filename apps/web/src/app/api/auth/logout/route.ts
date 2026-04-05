import { NextResponse } from "next/server";

import { createClearedSessionCookieDefinition } from "../../../../lib/session/cookie";
import { createAuthErrorResponse } from "../../../../server/auth/http";
import {
  createRuntimeAuthService,
  getWebAuthConfig
} from "../../../../server/auth/runtime";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const cookieName = getWebAuthConfig().AUTH_SESSION_COOKIE_NAME;
    const sessionId = cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);

    if (sessionId) {
      await createRuntimeAuthService().revokeSession({
        sessionId
      });
    }

    const response = NextResponse.json({
      authenticated: false,
      session: null
    });

    response.cookies.set(
      createClearedSessionCookieDefinition({
        name: cookieName,
        nodeEnvironment: process.env.NODE_ENV
      })
    );

    return response;
  } catch (error) {
    return createAuthErrorResponse(error);
  }
}
