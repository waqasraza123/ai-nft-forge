import { studioBrandCreateRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createStudioSettingsErrorResponse,
  parseJsonBody,
  requireStudioOwnerApiSession
} from "../../../../../server/studio-settings/http";
import { createRuntimeStudioSettingsService } from "../../../../../server/studio-settings/runtime";

export async function POST(request: Request) {
  try {
    const session = await requireStudioOwnerApiSession();
    const body = studioBrandCreateRequestSchema.parse(await parseJsonBody(request));
    const result = await createRuntimeStudioSettingsService().createStudioBrand({
      accentColor: body.accentColor,
      brandName: body.brandName,
      brandSlug: body.brandSlug,
      featuredReleaseLabel: body.featuredReleaseLabel,
      landingDescription: body.landingDescription,
      landingHeadline: body.landingHeadline,
      ownerUserId: session.ownerUserId,
      role: session.role,
      themePreset: body.themePreset,
      workspaceId: session.workspace?.id ?? null,
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

    return NextResponse.json(result, {
      status: 201
    });
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
