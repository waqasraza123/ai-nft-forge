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
        ...(body.brandId !== undefined
          ? {
              brandId: body.brandId
            }
          : {}),
        brandName: body.brandName,
        brandSlug: body.brandSlug,
        featuredReleaseLabel: body.featuredReleaseLabel,
        landingDescription: body.landingDescription,
        landingHeadline: body.landingHeadline,
        ownerUserId: session.user.id,
        themePreset: body.themePreset,
        workspaceName: body.workspaceName,
        workspaceSlug: body.workspaceSlug,
        ...(body.customDomain !== undefined
          ? {
              customDomain: body.customDomain
            }
          : {}),
        ...(body.heroKicker !== undefined
          ? {
              heroKicker: body.heroKicker
            }
          : {}),
        ...(body.primaryCtaLabel !== undefined
          ? {
              primaryCtaLabel: body.primaryCtaLabel
            }
          : {}),
        ...(body.secondaryCtaLabel !== undefined
          ? {
              secondaryCtaLabel: body.secondaryCtaLabel
            }
          : {}),
        ...(body.storyBody !== undefined
          ? {
              storyBody: body.storyBody
            }
          : {}),
        ...(body.storyHeadline !== undefined
          ? {
              storyHeadline: body.storyHeadline
            }
          : {}),
        ...(body.wordmark !== undefined
          ? {
              wordmark: body.wordmark
            }
          : {})
      });

    return NextResponse.json(result);
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
