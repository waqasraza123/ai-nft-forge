import { studioSettingsUpdateRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createStudioSettingsErrorResponse,
  parseJsonBody,
  requireStudioApiSession
} from "../../../../server/studio-settings/http";
import { createRuntimeStudioSettingsService } from "../../../../server/studio-settings/runtime";

export async function GET() {
  try {
    const session = await requireStudioApiSession();
    const result = await createRuntimeStudioSettingsService().getStudioSettings(
      {
        ownerUserId: session.user.id
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireStudioApiSession();
    const body = studioSettingsUpdateRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeStudioSettingsService().updateStudioSettings({
        accentColor: body.accentColor,
        brandName: body.brandName,
        brandSlug: body.brandSlug,
        featuredReleaseLabel: body.featuredReleaseLabel,
        landingDescription: body.landingDescription,
        landingHeadline: body.landingHeadline,
        ownerUserId: session.user.id,
        workspaceName: body.workspaceName,
        workspaceSlug: body.workspaceSlug,
        ...(body.customDomain !== undefined
          ? {
              customDomain: body.customDomain
            }
          : {})
      });

    return NextResponse.json(result);
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
