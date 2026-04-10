ALTER TYPE "OpsReconciliationIssueKind"
ADD VALUE IF NOT EXISTS 'published_contract_deployment_unverified';

ALTER TYPE "OpsReconciliationIssueKind"
ADD VALUE IF NOT EXISTS 'published_contract_missing_onchain';

ALTER TYPE "OpsReconciliationIssueKind"
ADD VALUE IF NOT EXISTS 'published_contract_owner_mismatch';

ALTER TYPE "OpsReconciliationIssueKind"
ADD VALUE IF NOT EXISTS 'published_contract_metadata_mismatch';

ALTER TYPE "OpsReconciliationIssueKind"
ADD VALUE IF NOT EXISTS 'published_token_mint_unverified';

ALTER TYPE "OpsReconciliationIssueKind"
ADD VALUE IF NOT EXISTS 'published_token_owner_mismatch';

ALTER TABLE "published_collections"
ADD COLUMN "contract_token_uri_base_url" TEXT;
