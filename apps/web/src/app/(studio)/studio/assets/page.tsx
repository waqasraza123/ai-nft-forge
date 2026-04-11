import { getCurrentStudioAccess } from "../../../../server/studio/access";
import { createRuntimeSourceAssetService } from "../../../../server/source-assets/runtime";

import { StudioAssetsClient } from "./studio-assets-client";

export default async function StudioAssetsPage() {
  const access = await getCurrentStudioAccess();

  if (!access) {
    return null;
  }

  const result = await createRuntimeSourceAssetService().listSourceAssets({
    ownerUserId: access.ownerUserId
  });

  return (
    <StudioAssetsClient
      initialAssets={result.assets}
      ownerWalletAddress={access.owner.walletAddress}
    />
  );
}
