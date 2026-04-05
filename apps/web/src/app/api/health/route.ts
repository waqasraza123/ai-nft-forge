import { NextResponse } from "next/server";

import { createHealthPayload } from "../../../server/health";

export function GET() {
  return NextResponse.json(createHealthPayload());
}
