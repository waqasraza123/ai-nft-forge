import { getCurrentStudioAccess } from "./access";

export async function parseStudioJsonBody(request: Request): Promise<unknown> {
  return request.json();
}

export async function requireStudioApiSession() {
  return getCurrentStudioAccess();
}
