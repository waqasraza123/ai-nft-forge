import { getCurrentStudioAccess } from "../../../../server/studio/access";
import { createRuntimeStudioSettingsService } from "../../../../server/studio-settings/runtime";

import { StudioSettingsClient } from "./studio-settings-client";

export default async function StudioSettingsPage() {
  const access = await getCurrentStudioAccess();

  if (!access) {
    return null;
  }

  const result = await createRuntimeStudioSettingsService().getStudioSettings({
    ownerUserId: access.ownerUserId,
    role: access.role
  });

  return (
    <StudioSettingsClient
      currentWalletAddress={access.session.user.walletAddress}
      initialSettings={result.settings}
      ownerWalletAddress={access.owner.walletAddress}
    />
  );
}
