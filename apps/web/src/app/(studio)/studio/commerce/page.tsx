import { getCurrentStudioAccess } from "../../../../server/studio/access";
import { createRuntimeCollectionCommerceService } from "../../../../server/commerce/runtime";

import { StudioCommerceClient } from "./studio-commerce-client";

export default async function StudioCommercePage() {
  const access = await getCurrentStudioAccess();

  if (!access) {
    return null;
  }

  const result =
    await createRuntimeCollectionCommerceService().getOwnerCommerceDashboard({
      ownerUserId: access.ownerUserId
    });

  return (
    <StudioCommerceClient
      initialDashboard={result.dashboard}
      ownerWalletAddress={access.owner.walletAddress}
    />
  );
}
