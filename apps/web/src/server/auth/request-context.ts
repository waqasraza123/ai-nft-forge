import { createHash, randomBytes } from "node:crypto";

export type AuthRequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

export function createAuthNonce(): string {
  return randomBytes(18).toString("base64url");
}

export function extractAuthRequestContext(
  request: Request
): AuthRequestContext {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || null;

  return {
    ipAddress,
    userAgent: request.headers.get("user-agent")
  };
}

export function hashAuthRequestValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
