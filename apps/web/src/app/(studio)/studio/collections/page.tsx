import { getCurrentStudioAccess } from "../../../../server/studio/access";
import { createRuntimeCollectionDraftService } from "../../../../server/collections/runtime";

import { StudioCollectionsClient } from "./studio-collections-client";

export default async function StudioCollectionsPage() {
  const access = await getCurrentStudioAccess();

  if (!access || !access.workspace) {
    return null;
  }

  const result =
    await createRuntimeCollectionDraftService().listCollectionDrafts({
      workspaceId: access.workspace.id
    });

  return (
    <StudioCollectionsClient
      initialDrafts={result.drafts}
      initialGeneratedAssetCandidates={result.generatedAssetCandidates}
      initialPublicationTarget={result.publicationTarget}
      initialPublicationTargets={result.publicationTargets}
      ownerWalletAddress={access.owner.walletAddress}
      studioRole={access.role}
    />
  );
}
