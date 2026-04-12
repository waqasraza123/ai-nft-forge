import { getCurrentStudioAccess } from "../../../../server/studio/access";
import { createRuntimeCollectionCommerceService } from "../../../../server/commerce/runtime";

import { StudioCommerceClient } from "./studio-commerce-client";

type StudioCommercePageProps = {
  searchParams: Promise<{
    brandSlug?: string;
  }>;
};

export default async function StudioCommercePage(
  props: StudioCommercePageProps
) {
  const access = await getCurrentStudioAccess();

  if (!access || !access.workspace) {
    return null;
  }

  const searchParams = await props.searchParams;

  const result =
    await createRuntimeCollectionCommerceService().getOwnerCommerceDashboard({
      ...(typeof searchParams.brandSlug === "string" &&
      searchParams.brandSlug.length > 0
        ? {
            brandSlug: searchParams.brandSlug
          }
        : {}),
      workspaceId: access.workspace.id
    });

  return (
    <StudioCommerceClient
      initialDashboard={result.dashboard}
      ownerWalletAddress={access.owner.walletAddress}
    />
  );
}
