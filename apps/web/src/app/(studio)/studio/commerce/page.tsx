import { getCurrentAuthSession } from "../../../../server/auth/session";
import { createRuntimeCollectionCommerceService } from "../../../../server/commerce/runtime";

import { StudioCommerceClient } from "./studio-commerce-client";

export default async function StudioCommercePage() {
  const session = await getCurrentAuthSession();

  if (!session) {
    return null;
  }

  const result =
    await createRuntimeCollectionCommerceService().getOwnerCommerceDashboard({
      ownerUserId: session.user.id
    });

  return (
    <StudioCommerceClient
      initialDashboard={result.dashboard}
      ownerWalletAddress={session.user.walletAddress}
    />
  );
}
