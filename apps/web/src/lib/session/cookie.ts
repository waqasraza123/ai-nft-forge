import { authSessionCookieSameSite } from "@ai-nft-forge/shared";

export type SessionCookieAttributes = {
  expires: Date;
  httpOnly: true;
  path: "/";
  sameSite: typeof authSessionCookieSameSite;
  secure: boolean;
};

export type SessionCookieDefinition = SessionCookieAttributes & {
  name: string;
  value: string;
};

export type WorkspaceSelectionCookieDefinition = SessionCookieAttributes & {
  name: string;
  value: string;
};

export function shouldUseSecureSessionCookie(
  nodeEnvironment: string | undefined
): boolean {
  return nodeEnvironment === "production";
}

export function createSessionCookieDefinition(input: {
  expiresAt: Date;
  name: string;
  nodeEnvironment: string | undefined;
  value: string;
}): SessionCookieDefinition {
  return {
    expires: input.expiresAt,
    httpOnly: true,
    name: input.name,
    path: "/",
    sameSite: authSessionCookieSameSite,
    secure: shouldUseSecureSessionCookie(input.nodeEnvironment),
    value: input.value
  };
}

export function createClearedSessionCookieDefinition(input: {
  name: string;
  nodeEnvironment: string | undefined;
}): SessionCookieDefinition {
  return createSessionCookieDefinition({
    expiresAt: new Date(0),
    name: input.name,
    nodeEnvironment: input.nodeEnvironment,
    value: ""
  });
}

export function createWorkspaceSelectionCookieDefinition(input: {
  expiresAt: Date;
  name: string;
  nodeEnvironment: string | undefined;
  value: string;
}): WorkspaceSelectionCookieDefinition {
  return {
    expires: input.expiresAt,
    httpOnly: true,
    name: input.name,
    path: "/",
    sameSite: authSessionCookieSameSite,
    secure: shouldUseSecureSessionCookie(input.nodeEnvironment),
    value: input.value
  };
}

export function createClearedWorkspaceSelectionCookieDefinition(input: {
  name: string;
  nodeEnvironment: string | undefined;
}): WorkspaceSelectionCookieDefinition {
  return createWorkspaceSelectionCookieDefinition({
    expiresAt: new Date(0),
    name: input.name,
    nodeEnvironment: input.nodeEnvironment,
    value: ""
  });
}
