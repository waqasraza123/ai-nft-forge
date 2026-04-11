import { opsWorkspaceAuditQuerySchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createOpsErrorResponse,
  requireOpsApiSession
} from "../../../../server/ops/http";
import { createRuntimeOpsAuditService } from "../../../../server/ops/audit-runtime";
import { OpsServiceError } from "../../../../server/ops/error";

function parseAuditQuery(request: Request) {
  const { searchParams } = new URL(request.url);

  return opsWorkspaceAuditQuerySchema.parse({
    action: searchParams.get("action") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined
  });
}

export async function GET(request: Request) {
  try {
    const session = await requireOpsApiSession();

    if (!session.workspace) {
      throw new OpsServiceError(
        "WORKSPACE_REQUIRED",
        "A workspace is required to review audit activity.",
        409
      );
    }

    const query = parseAuditQuery(request);
    const format = new URL(request.url).searchParams.get("format");
    const auditService = createRuntimeOpsAuditService();

    if (format === "csv") {
      const result = await auditService.exportWorkspaceAuditCsv({
        ...(query.action !== undefined
          ? {
              action: query.action
            }
          : {}),
        ...(query.category !== undefined
          ? {
              category: query.category
            }
          : {}),
        workspaceId: session.workspace.id
      });

      return new NextResponse(result.csv, {
        headers: {
          "Content-Disposition": `attachment; filename=\"${result.filename}\"`,
          "Content-Type": "text/csv; charset=utf-8"
        },
        status: 200
      });
    }

    const result = await auditService.getWorkspaceAudit({
      ...(query.action !== undefined
        ? {
            action: query.action
          }
        : {}),
      ...(query.category !== undefined
        ? {
            category: query.category
          }
        : {}),
      ...(query.cursor !== undefined
        ? {
            cursor: query.cursor
          }
        : {}),
      ...(query.limit !== undefined
        ? {
            limit: query.limit
          }
        : {}),
      workspaceId: session.workspace.id
    });

    return NextResponse.json(result);
  } catch (error) {
    return createOpsErrorResponse(error);
  }
}
