import { getCurrentAuthSession } from "../../../../server/auth/session";
import { createRuntimeStudioSettingsService } from "../../../../server/studio-settings/runtime";

import { StudioSettingsClient } from "./studio-settings-client";

export default async function StudioSettingsPage() {
  const session = await getCurrentAuthSession();

  if (!session) {
    return null;
  }

  const result = await createRuntimeStudioSettingsService().getStudioSettings({
    ownerUserId: session.user.id
  });

  return (
    <StudioSettingsClient
      initialSettings={result.settings}
      ownerWalletAddress={session.user.walletAddress}
    />
  );
}
