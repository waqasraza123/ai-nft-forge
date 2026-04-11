import { getCurrentAuthSession } from "../../../../server/auth/session";
import { createRuntimeCollectionDraftService } from "../../../../server/collections/runtime";

import { StudioCollectionsClient } from "./studio-collections-client";

export default async function StudioCollectionsPage() {
  const session = await getCurrentAuthSession();

  if (!session) {
    return null;
  }

  const result =
    await createRuntimeCollectionDraftService().listCollectionDrafts({
      ownerUserId: session.user.id
    });

  return (
    <StudioCollectionsClient
      initialDrafts={result.drafts}
      initialGeneratedAssetCandidates={result.generatedAssetCandidates}
      initialPublicationTarget={result.publicationTarget}
      initialPublicationTargets={result.publicationTargets}
      ownerWalletAddress={session.user.walletAddress}
    />
  );
}
