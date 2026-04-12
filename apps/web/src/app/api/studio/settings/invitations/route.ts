import { studioWorkspaceInvitationCreateRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createStudioSettingsErrorResponse,
  parseJsonBody,
  requireStudioActiveOwnerApiSession
} from "../../../../../server/studio-settings/http";
import { createRuntimeStudioSettingsService } from "../../../../../server/studio-settings/runtime";

export async function POST(request: Request) {
  try {
    const session = await requireStudioActiveOwnerApiSession();
    const body = studioWorkspaceInvitationCreateRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeStudioSettingsService().createWorkspaceInvitation({
        ownerUserId: session.ownerUserId,
        role: session.role,
        workspaceId: session.workspace?.id ?? null,
        walletAddress: body.walletAddress
      });

    return NextResponse.json(result, {
      status: 201
    });
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
