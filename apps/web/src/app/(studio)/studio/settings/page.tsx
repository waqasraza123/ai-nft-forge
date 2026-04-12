import { getCurrentStudioAccess } from "../../../../server/studio/access";
import { createRuntimeStudioSettingsService } from "../../../../server/studio-settings/runtime";
import { createRuntimeWorkspaceDirectoryService } from "../../../../server/workspaces/directory-service";

import { StudioSettingsClient } from "./studio-settings-client";

export default async function StudioSettingsPage() {
  const access = await getCurrentStudioAccess();

  if (!access) {
    return null;
  }

  const result = await createRuntimeStudioSettingsService().getStudioSettings({
    ownerUserId: access.ownerUserId,
    role: access.role,
    workspaceId: access.workspace?.id ?? null
  });
  const workspaceDirectory =
    await createRuntimeWorkspaceDirectoryService().listAccessibleWorkspaceDirectory(
      {
        currentWorkspaceId: access.workspace?.id ?? null,
        workspaces: access.availableWorkspaces
      }
    );

  return (
    <StudioSettingsClient
      availableWorkspaces={access.availableWorkspaces}
      currentWalletAddress={access.session.user.walletAddress}
      currentWorkspaceSlug={access.workspace?.slug ?? null}
      initialSettings={result.settings}
      ownerWalletAddress={access.owner.walletAddress}
      workspaceDirectoryEntries={workspaceDirectory.workspaces}
    />
  );
}
