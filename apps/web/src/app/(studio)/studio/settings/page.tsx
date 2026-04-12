import { getCurrentStudioAccess } from "../../../../server/studio/access";
import { createRuntimeStudioSettingsService } from "../../../../server/studio-settings/runtime";
import { createRuntimeWorkspaceDirectoryService } from "../../../../server/workspaces/directory-service";
import { createRuntimeWorkspaceOffboardingService } from "../../../../server/workspaces/offboarding-service";

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
  const offboardingOverview =
    await createRuntimeWorkspaceOffboardingService().getAccessibleWorkspaceOffboardingOverview(
      {
        currentWorkspaceId: access.workspace?.id ?? null,
        workspaces: access.availableWorkspaces
      }
    );
  const currentWorkspaceOffboarding =
    offboardingOverview.overview.workspaces.find(
      (workspace) => workspace.workspace.id === access.workspace?.id
    ) ?? null;

  return (
    <StudioSettingsClient
      availableWorkspaces={access.availableWorkspaces}
      currentWalletAddress={access.session.user.walletAddress}
      currentWorkspaceSlug={access.workspace?.slug ?? null}
      currentWorkspaceOffboarding={currentWorkspaceOffboarding}
      initialSettings={result.settings}
      ownerWalletAddress={access.owner.walletAddress}
      workspaceDirectoryEntries={workspaceDirectory.workspaces}
    />
  );
}
