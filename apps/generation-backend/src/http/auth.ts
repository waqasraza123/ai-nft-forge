import { timingSafeEqual } from "node:crypto";

export function resolveAuthorizationResult(input: {
  authorizationHeader: string | undefined;
  expectedBearerToken?: string;
}) {
  if (!input.expectedBearerToken) {
    return {
      status: "authorized" as const
    };
  }

  if (!input.authorizationHeader) {
    return {
      status: "missing" as const
    };
  }

  const match = /^Bearer\s+(.+)$/.exec(input.authorizationHeader.trim());

  if (!match?.[1]) {
    return {
      status: "invalid" as const
    };
  }

  const providedTokenBuffer = Buffer.from(match[1]);
  const expectedTokenBuffer = Buffer.from(input.expectedBearerToken);

  if (
    providedTokenBuffer.length !== expectedTokenBuffer.length ||
    !timingSafeEqual(providedTokenBuffer, expectedTokenBuffer)
  ) {
    return {
      status: "invalid" as const
    };
  }

  return {
    status: "authorized" as const
  };
}
