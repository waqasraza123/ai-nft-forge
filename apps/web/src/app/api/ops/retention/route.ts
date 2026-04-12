import {
  workspaceExportFormatSchema,
  workspaceRetentionFleetReportResponseSchema
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import { OpsServiceError } from "../../../../server/ops/error";
import { createOpsErrorResponse } from "../../../../server/ops/http";
import { getCurrentStudioAccess } from "../../../../server/studio/access";
import { createRuntimeWorkspaceRetentionService } from "../../../../server/workspaces/retention-service";

export async function GET(request: Request) {
  try {
    const access = await getCurrentStudioAccess();

    if (!access) {
      throw new OpsServiceError(
        "SESSION_REQUIRED",
        "An active studio session is required.",
        401
      );
    }

    const url = new URL(request.url);
    const format = workspaceExportFormatSchema.parse(
      url.searchParams.get("format") ?? "json"
    );
    const retentionService = createRuntimeWorkspaceRetentionService();
    const report = await retentionService.getAccessibleWorkspaceRetentionReport(
      {
        currentWorkspaceId: access.workspace?.id ?? null,
        workspaces: access.availableWorkspaces
      }
    );

    if (format === "csv") {
      const csv = retentionService.exportAccessibleWorkspaceRetentionReportCsv({
        format,
        reportData: report
      });

      return new NextResponse(csv, {
        headers: {
          "Content-Disposition":
            'attachment; filename="workspace-retention-estate.csv"',
          "Content-Type": "text/csv; charset=utf-8"
        },
        status: 200
      });
    }

    return NextResponse.json(
      workspaceRetentionFleetReportResponseSchema.parse(report)
    );
  } catch (error) {
    return createOpsErrorResponse(error);
  }
}
