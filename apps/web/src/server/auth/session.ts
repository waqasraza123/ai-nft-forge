import { authSessionResponseSchema } from "@ai-nft-forge/shared";
import { cookies } from "next/headers";

import { createRuntimeAuthService, getWebAuthConfig } from "./runtime";

export async function getCurrentAuthSession(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(
    getWebAuthConfig(rawEnvironment).AUTH_SESSION_COOKIE_NAME
  )?.value;

  if (!sessionId) {
    return null;
  }

  const session = await createRuntimeAuthService(rawEnvironment).getSession({
    sessionId
  });

  return authSessionResponseSchema.parse({
    authenticated: Boolean(session),
    session
  }).session;
}
