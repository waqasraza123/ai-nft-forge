import { workspaceCommerceFleetReportResponseSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createCommerceErrorResponse,
  requireStudioApiSession
} from "../../../../../../server/commerce/http";
import { createRuntimeWorkspaceFleetService } from "../../../../../../server/workspaces/fleet-service";

export async function GET(request: Request) {
  try {
    const session = await requireStudioApiSession();
    const url = new URL(request.url);
    const format = url.searchParams.get("format");
    const fleetService = createRuntimeWorkspaceFleetService();

    if (format === "csv") {
      const exportResult = await fleetService.exportAccessibleCommerceFleetCsv({
        currentWorkspaceId: session.workspace.id,
        workspaces: session.availableWorkspaces
      });

      return new NextResponse(exportResult.csv, {
        headers: {
          "Content-Disposition": `attachment; filename="${exportResult.filename}"`,
          "Content-Type": "text/csv; charset=utf-8"
        },
        status: 200
      });
    }

    const result = await fleetService.getAccessibleCommerceFleetReport({
      currentWorkspaceId: session.workspace.id,
      workspaces: session.availableWorkspaces
    });

    return NextResponse.json(
      workspaceCommerceFleetReportResponseSchema.parse(result)
    );
  } catch (error) {
    return createCommerceErrorResponse(error);
  }
}
