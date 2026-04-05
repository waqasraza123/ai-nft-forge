import { redirect } from "next/navigation";

import { getCurrentAuthSession } from "./session";

export function createStudioSignInRedirectPath(nextPath = "/studio"): string {
  const query = new URLSearchParams({
    next: nextPath
  });

  return `/sign-in?${query.toString()}`;
}

export function resolveStudioAccessDecision(
  session: Awaited<ReturnType<typeof getCurrentAuthSession>>,
  nextPath = "/studio"
):
  | {
      kind: "allow";
    }
  | {
      kind: "redirect";
      location: string;
    } {
  if (session) {
    return {
      kind: "allow"
    };
  }

  return {
    kind: "redirect",
    location: createStudioSignInRedirectPath(nextPath)
  };
}

export async function requireStudioSession() {
  const session = await getCurrentAuthSession();
  const decision = resolveStudioAccessDecision(session);

  if (decision.kind === "redirect") {
    redirect(decision.location);
  }

  return session;
}
