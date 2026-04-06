import { getCurrentAuthSession } from "../auth/session";

export async function parseStudioJsonBody(request: Request): Promise<unknown> {
  return request.json();
}

export async function requireStudioApiSession() {
  return getCurrentAuthSession();
}
