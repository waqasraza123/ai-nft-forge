import { studioWorkspaceAccessReviewQuerySchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import { buildWorkspaceAccessReviewCsv } from "../../../../../server/studio-settings/service";
import { createRuntimeStudioSettingsService } from "../../../../../server/studio-settings/runtime";
import {
  createStudioSettingsErrorResponse,
  requireStudioOwnerApiSession
} from "../../../../../server/studio-settings/http";
import { StudioSettingsServiceError } from "../../../../../server/studio-settings/error";

export async function GET(request: Request) {
  try {
    const session = await requireStudioOwnerApiSession();
    const parsedQuery = studioWorkspaceAccessReviewQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams)
    );

    if (!parsedQuery.success) {
      throw new StudioSettingsServiceError(
        "INVALID_REQUEST",
        "Access review format must be json or csv.",
        400
      );
    }

    const query = parsedQuery.data;
    const report =
      await createRuntimeStudioSettingsService().getWorkspaceAccessReview({
        ownerUserId: session.ownerUserId,
        role: session.role,
        workspaceId: session.workspace?.id ?? null
      });

    if (query.format === "csv") {
      return new NextResponse(buildWorkspaceAccessReviewCsv(report), {
        headers: {
          "content-disposition": `attachment; filename="workspace-access-review-${report.report.workspace.slug}.csv"`,
          "content-type": "text/csv; charset=utf-8"
        }
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}

export async function POST() {
  try {
    const session = await requireStudioOwnerApiSession();
    const result =
      await createRuntimeStudioSettingsService().recordWorkspaceAccessReview({
        ownerUserId: session.ownerUserId,
        role: session.role,
        workspaceId: session.workspace?.id ?? null
      });

    return NextResponse.json(result, {
      status: 201
    });
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
