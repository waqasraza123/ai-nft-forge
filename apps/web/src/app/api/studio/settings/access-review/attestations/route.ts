import { studioWorkspaceAccessReviewAttestationQuerySchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import { buildWorkspaceAccessReviewAttestationsCsv } from "../../../../../../server/studio-settings/service";
import { createRuntimeStudioSettingsService } from "../../../../../../server/studio-settings/runtime";
import {
  createStudioSettingsErrorResponse,
  requireStudioOwnerApiSession
} from "../../../../../../server/studio-settings/http";
import { StudioSettingsServiceError } from "../../../../../../server/studio-settings/error";

export async function GET(request: Request) {
  try {
    const session = await requireStudioOwnerApiSession();
    const parsedQuery =
      studioWorkspaceAccessReviewAttestationQuerySchema.safeParse(
        Object.fromEntries(new URL(request.url).searchParams)
      );

    if (!parsedQuery.success) {
      throw new StudioSettingsServiceError(
        "INVALID_REQUEST",
        "Access review attestation format must be json or csv.",
        400
      );
    }

    const result =
      await createRuntimeStudioSettingsService().listWorkspaceAccessReviewAttestations(
        {
          ownerUserId: session.ownerUserId,
          role: session.role,
          workspaceId: session.workspace?.id ?? null
        }
      );

    if (parsedQuery.data.format === "csv") {
      return new NextResponse(
        buildWorkspaceAccessReviewAttestationsCsv(result),
        {
          headers: {
            "content-disposition": `attachment; filename="workspace-access-review-attestations-${result.attestations.workspace.slug}.csv"`,
            "content-type": "text/csv; charset=utf-8"
          }
        }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
