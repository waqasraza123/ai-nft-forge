import { getCurrentStudioAccess } from "../../../../server/studio/access";
import { createRuntimeSourceAssetService } from "../../../../server/source-assets/runtime";

import { StudioAssetsClient } from "./studio-assets-client";

export default async function StudioAssetsPage() {
  const access = await getCurrentStudioAccess();

  if (!access || !access.workspace) {
    return null;
  }

  const result = await createRuntimeSourceAssetService().listSourceAssets({
    workspaceId: access.workspace.id
  });

  return (
    <StudioAssetsClient
      initialAssets={result.assets}
      ownerWalletAddress={access.owner.walletAddress}
    />
  );
}
