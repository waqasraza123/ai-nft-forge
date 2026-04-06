import { getCurrentAuthSession } from "../../../../server/auth/session";
import { createRuntimeSourceAssetService } from "../../../../server/source-assets/runtime";

import { StudioAssetsClient } from "./studio-assets-client";

export default async function StudioAssetsPage() {
  const session = await getCurrentAuthSession();

  if (!session) {
    return null;
  }

  const result = await createRuntimeSourceAssetService().listSourceAssets({
    ownerUserId: session.user.id
  });

  return (
    <StudioAssetsClient
      initialAssets={result.assets}
      ownerWalletAddress={session.user.walletAddress}
    />
  );
}
