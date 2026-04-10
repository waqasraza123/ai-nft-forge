import { createHash, randomBytes } from "node:crypto";

export type AuthRequestContext = {
  host: string | null;
  ipAddress: string | null;
  userAgent: string | null;
};

export function createAuthNonce(): string {
  return randomBytes(18).toString("hex");
}

export function extractAuthRequestContext(
  request: Request
): AuthRequestContext {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || null;

  return {
    host: forwardedHost?.split(",")[0]?.trim() || request.headers.get("host"),
    ipAddress,
    userAgent: request.headers.get("user-agent")
  };
}

export function hashAuthRequestValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
