import {
  workspaceExportFormatSchema,
  workspaceExportResponseSchema
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createStudioSettingsErrorResponse,
  requireStudioOwnerApiSession
} from "../../../../../../server/studio-settings/http";
import { createRuntimeWorkspaceOffboardingService } from "../../../../../../server/workspaces/offboarding-service";

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioOwnerApiSession();
    const { workspaceId } = await context.params;
    const url = new URL(request.url);
    const format = workspaceExportFormatSchema.parse(
      url.searchParams.get("format") ?? "json"
    );
    const offboardingService = createRuntimeWorkspaceOffboardingService();
    const exportData = await offboardingService.exportOwnedWorkspace({
      ownerUserId: session.ownerUserId,
      workspaceId
    });

    if (format === "csv") {
      const csv = offboardingService.exportOwnedWorkspaceCsv({
        exportData,
        format
      });

      return new NextResponse(csv, {
        headers: {
          "Content-Disposition": `attachment; filename=\"${exportData.export.workspace.slug}-workspace-export.csv\"`,
          "Content-Type": "text/csv; charset=utf-8"
        },
        status: 200
      });
    }

    const payload = workspaceExportResponseSchema.parse(exportData);

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Disposition": `attachment; filename=\"${payload.export.workspace.slug}-workspace-export.json\"`,
        "Content-Type": "application/json; charset=utf-8"
      },
      status: 200
    });
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
