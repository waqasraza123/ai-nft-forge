import {
  createCollectionContractName,
  createCollectionContractSymbol
} from "@ai-nft-forge/contracts";
import { getAiNftForgeCollectionContractArtifact } from "@ai-nft-forge/contracts/server";
import type { CollectionContractChainKey } from "@ai-nft-forge/shared";
import {
  createPublicClient,
  getAddress,
  http,
  isAddressEqual,
  type Abi
} from "viem";
import { base, baseSepolia, type Chain } from "viem/chains";

type PublishedCollectionRecord = {
  brandName: string;
  brandSlug: string;
  contractAddress: string | null;
  contractChainKey: string | null;
  contractDeployTxHash: string | null;
  contractTokenUriBaseUrl: string | null;
  id: string;
  mints: Array<{
    id: string;
    recipientWalletAddress: string;
    tokenId: number;
    txHash: string;
  }>;
  slug: string;
  title: string;
};

type ReconciliationIssueCandidate = {
  detail: Record<string, string | number | boolean | null>;
  kind:
    | "published_contract_deployment_unverified"
    | "published_contract_metadata_mismatch"
    | "published_contract_missing_onchain"
    | "published_contract_owner_mismatch"
    | "published_token_mint_unverified"
    | "published_token_owner_mismatch";
  message: string;
  severity: "critical";
  title: string;
};

type PublishedCollectionOnchainInspector = {
  inspectPublishedCollectionState(input: {
    ownerWalletAddress: string;
    publication: PublishedCollectionRecord;
  }): Promise<ReconciliationIssueCandidate[]>;
};

const defaultChainRpcUrls = {
  base: base.rpcUrls.default.http[0] ?? "https://mainnet.base.org",
  "base-sepolia":
    baseSepolia.rpcUrls.default.http[0] ?? "https://sepolia.base.org"
} satisfies Record<CollectionContractChainKey, string>;

const supportedViemChains = {
  base,
  "base-sepolia": baseSepolia
} satisfies Record<CollectionContractChainKey, Chain>;

function getRpcUrlByChainKey(
  chainKey: CollectionContractChainKey,
  rawEnvironment: NodeJS.ProcessEnv
) {
  if (chainKey === "base") {
    return rawEnvironment.ONCHAIN_BASE_RPC_URL ?? defaultChainRpcUrls.base;
  }

  return (
    rawEnvironment.ONCHAIN_BASE_SEPOLIA_RPC_URL ??
    defaultChainRpcUrls["base-sepolia"]
  );
}

function createIssue(
  input: Omit<ReconciliationIssueCandidate, "severity">
): ReconciliationIssueCandidate {
  return {
    ...input,
    severity: "critical"
  };
}

export function createPublishedCollectionOnchainInspector(
  rawEnvironment: NodeJS.ProcessEnv = process.env
): PublishedCollectionOnchainInspector {
  const publicClients = new Map<CollectionContractChainKey, unknown>();

  function getPublicClient(chainKey: CollectionContractChainKey) {
    const cachedClient = publicClients.get(
      chainKey
    ) as ReturnType<typeof createPublicClient> | undefined;

    if (cachedClient) {
      return cachedClient;
    }

    const client = createPublicClient({
      chain: supportedViemChains[chainKey],
      transport: http(getRpcUrlByChainKey(chainKey, rawEnvironment))
    });

    publicClients.set(chainKey, client);

    return client as ReturnType<typeof createPublicClient>;
  }

  return {
    async inspectPublishedCollectionState(input) {
      const issues: ReconciliationIssueCandidate[] = [];
      const publication = input.publication;

      if (
        !publication.contractAddress ||
        !publication.contractChainKey ||
        !publication.contractDeployTxHash
      ) {
        if (publication.mints.length > 0) {
          for (const mint of publication.mints) {
            issues.push(
              createIssue({
                detail: {
                  mintId: mint.id,
                  publishedCollectionId: publication.id,
                  publishedCollectionSlug: publication.slug,
                  reason: "deployment_record_incomplete",
                  tokenId: mint.tokenId,
                  txHash: mint.txHash
                },
                kind: "published_token_mint_unverified",
                message:
                  "A recorded mint no longer has a complete deployment record to verify against.",
                title: "Published mint can no longer be verified"
              })
            );
          }
        }

        return issues;
      }

      const chainKey = publication.contractChainKey as CollectionContractChainKey;
      const publicClient = supportedViemChains[chainKey]
        ? getPublicClient(chainKey)
        : null;
      const expectedOwnerWalletAddress = getAddress(input.ownerWalletAddress);
      const expectedContractAddress = getAddress(publication.contractAddress);

      if (!publicClient) {
        issues.push(
          createIssue({
            detail: {
              contractAddress: expectedContractAddress,
              contractChainKey: publication.contractChainKey,
              deployTxHash: publication.contractDeployTxHash,
              publishedCollectionId: publication.id,
              publishedCollectionSlug: publication.slug,
              reason: "unsupported_chain"
            },
            kind: "published_contract_deployment_unverified",
            message:
              "The recorded deployment uses an unsupported chain key and can no longer be verified.",
            title: "Published contract deployment cannot be verified"
          })
        );

        return issues;
      }

      const artifact = getAiNftForgeCollectionContractArtifact();
      const contractAbi = artifact.abi as Abi;
      const deployTxHash = publication.contractDeployTxHash as `0x${string}`;
      const expectedContractName = createCollectionContractName({
        brandName: publication.brandName,
        collectionTitle: publication.title
      });
      const expectedContractSymbol = createCollectionContractSymbol({
        brandSlug: publication.brandSlug,
        collectionSlug: publication.slug
      });

      const deploymentTransaction = await publicClient
        .getTransaction({
          hash: deployTxHash
        })
        .catch(() => null);

      if (!deploymentTransaction) {
        issues.push(
          createIssue({
            detail: {
              contractAddress: expectedContractAddress,
              contractChainKey: chainKey,
              deployTxHash: publication.contractDeployTxHash,
              publishedCollectionId: publication.id,
              publishedCollectionSlug: publication.slug,
              reason: "transaction_not_found"
            },
            kind: "published_contract_deployment_unverified",
            message:
              "The recorded deployment transaction could not be found onchain.",
            title: "Published contract deployment cannot be verified"
          })
        );
      } else {
        const deploymentReceipt = await publicClient
          .getTransactionReceipt({
            hash: deployTxHash
          })
          .catch(() => null);

        if (!deploymentReceipt) {
          issues.push(
            createIssue({
              detail: {
                contractAddress: expectedContractAddress,
                contractChainKey: chainKey,
                deployTxHash: publication.contractDeployTxHash,
                publishedCollectionId: publication.id,
                publishedCollectionSlug: publication.slug,
                reason: "receipt_not_found"
              },
              kind: "published_contract_deployment_unverified",
              message:
                "The recorded deployment transaction has no confirmed receipt onchain.",
              title: "Published contract deployment cannot be verified"
            })
          );
        } else if (deploymentReceipt.status !== "success") {
          issues.push(
            createIssue({
              detail: {
                contractAddress: expectedContractAddress,
                contractChainKey: chainKey,
                deployTxHash: publication.contractDeployTxHash,
                publishedCollectionId: publication.id,
                publishedCollectionSlug: publication.slug,
                reason: "transaction_reverted"
              },
              kind: "published_contract_deployment_unverified",
              message:
                "The recorded deployment transaction no longer resolves to a successful onchain receipt.",
              title: "Published contract deployment cannot be verified"
            })
          );
        } else {
          if (
            !isAddressEqual(
              deploymentTransaction.from,
              expectedOwnerWalletAddress
            )
          ) {
            issues.push(
              createIssue({
                detail: {
                  contractAddress: expectedContractAddress,
                  contractChainKey: chainKey,
                  deployTxHash: publication.contractDeployTxHash,
                  observedWalletAddress: deploymentTransaction.from,
                  publishedCollectionId: publication.id,
                  publishedCollectionSlug: publication.slug,
                  reason: "submitted_by_other_wallet"
                },
                kind: "published_contract_deployment_unverified",
                message:
                  "The recorded deployment transaction was not submitted by the published collection owner wallet.",
                title: "Published contract deployment cannot be verified"
              })
            );
          }

          if (
            deploymentTransaction.to !== null ||
            !deploymentReceipt.contractAddress ||
            !isAddressEqual(
              deploymentReceipt.contractAddress,
              expectedContractAddress
            )
          ) {
            issues.push(
              createIssue({
                detail: {
                  contractAddress: expectedContractAddress,
                  contractChainKey: chainKey,
                  deployTxHash: publication.contractDeployTxHash,
                  observedContractAddress:
                    deploymentReceipt.contractAddress ?? null,
                  publishedCollectionId: publication.id,
                  publishedCollectionSlug: publication.slug,
                  reason: "contract_address_mismatch"
                },
                kind: "published_contract_deployment_unverified",
                message:
                  "The recorded deployment transaction no longer resolves to the recorded contract address.",
                title: "Published contract deployment cannot be verified"
              })
            );
          }
        }
      }

      const deployedBytecode = await publicClient
        .getBytecode({
          address: expectedContractAddress
        })
        .catch(() => null);

      if (!deployedBytecode || deployedBytecode === "0x") {
        issues.push(
          createIssue({
            detail: {
              contractAddress: expectedContractAddress,
              contractChainKey: chainKey,
              deployTxHash: publication.contractDeployTxHash,
              publishedCollectionId: publication.id,
              publishedCollectionSlug: publication.slug
            },
            kind: "published_contract_missing_onchain",
            message:
              "The recorded contract address does not currently have deployed bytecode onchain.",
            title: "Published contract missing onchain"
          })
        );

        return issues;
      }

      const [recordedOwner, recordedName, recordedSymbol, recordedBaseTokenUri] =
        await Promise.all([
          publicClient.readContract({
            abi: contractAbi,
            address: expectedContractAddress,
            functionName: "owner"
          }),
          publicClient.readContract({
            abi: contractAbi,
            address: expectedContractAddress,
            functionName: "name"
          }),
          publicClient.readContract({
            abi: contractAbi,
            address: expectedContractAddress,
            functionName: "symbol"
          }),
          publication.contractTokenUriBaseUrl
            ? publicClient.readContract({
                abi: contractAbi,
                address: expectedContractAddress,
                functionName: "baseTokenUri"
              })
            : Promise.resolve(null)
        ]);

      if (
        !isAddressEqual(
          recordedOwner as `0x${string}`,
          expectedOwnerWalletAddress
        )
      ) {
        issues.push(
          createIssue({
            detail: {
              contractAddress: expectedContractAddress,
              contractChainKey: chainKey,
              expectedOwnerWalletAddress,
              observedOwnerWalletAddress: getAddress(
                recordedOwner as `0x${string}`
              ),
              publishedCollectionId: publication.id,
              publishedCollectionSlug: publication.slug
            },
            kind: "published_contract_owner_mismatch",
            message:
              "The onchain contract owner no longer matches the published collection owner wallet.",
            title: "Published contract owner mismatch"
          })
        );
      }

      if (recordedName !== expectedContractName) {
        issues.push(
          createIssue({
            detail: {
              contractAddress: expectedContractAddress,
              contractChainKey: chainKey,
              expectedValue: expectedContractName,
              field: "name",
              observedValue: String(recordedName),
              publishedCollectionId: publication.id,
              publishedCollectionSlug: publication.slug
            },
            kind: "published_contract_metadata_mismatch",
            message:
              "The onchain contract name no longer matches the immutable published collection snapshot.",
            title: "Published contract metadata mismatch"
          })
        );
      }

      if (recordedSymbol !== expectedContractSymbol) {
        issues.push(
          createIssue({
            detail: {
              contractAddress: expectedContractAddress,
              contractChainKey: chainKey,
              expectedValue: expectedContractSymbol,
              field: "symbol",
              observedValue: String(recordedSymbol),
              publishedCollectionId: publication.id,
              publishedCollectionSlug: publication.slug
            },
            kind: "published_contract_metadata_mismatch",
            message:
              "The onchain contract symbol no longer matches the immutable published collection snapshot.",
            title: "Published contract metadata mismatch"
          })
        );
      }

      if (
        publication.contractTokenUriBaseUrl &&
        recordedBaseTokenUri !== publication.contractTokenUriBaseUrl
      ) {
        issues.push(
          createIssue({
            detail: {
              contractAddress: expectedContractAddress,
              contractChainKey: chainKey,
              expectedValue: publication.contractTokenUriBaseUrl,
              field: "baseTokenUri",
              observedValue:
                recordedBaseTokenUri === null ? null : String(recordedBaseTokenUri),
              publishedCollectionId: publication.id,
              publishedCollectionSlug: publication.slug
            },
            kind: "published_contract_metadata_mismatch",
            message:
              "The onchain base token URI no longer matches the recorded deployment target.",
            title: "Published contract metadata mismatch"
          })
        );
      }

      for (const mint of publication.mints) {
        const mintTxHash = mint.txHash as `0x${string}`;
        const mintTransaction = await publicClient
          .getTransaction({
            hash: mintTxHash
          })
          .catch(() => null);

        if (!mintTransaction) {
          issues.push(
            createIssue({
              detail: {
                contractAddress: expectedContractAddress,
                contractChainKey: chainKey,
                mintId: mint.id,
                publishedCollectionId: publication.id,
                publishedCollectionSlug: publication.slug,
                reason: "transaction_not_found",
                tokenId: mint.tokenId,
                txHash: mint.txHash
              },
              kind: "published_token_mint_unverified",
              message:
                "The recorded mint transaction could not be found onchain.",
              title: "Published mint can no longer be verified"
            })
          );
        } else {
          const mintReceipt = await publicClient
            .getTransactionReceipt({
              hash: mintTxHash
            })
            .catch(() => null);

          if (!mintReceipt) {
            issues.push(
              createIssue({
                detail: {
                  contractAddress: expectedContractAddress,
                  contractChainKey: chainKey,
                  mintId: mint.id,
                  publishedCollectionId: publication.id,
                  publishedCollectionSlug: publication.slug,
                  reason: "receipt_not_found",
                  tokenId: mint.tokenId,
                  txHash: mint.txHash
                },
                kind: "published_token_mint_unverified",
                message:
                  "The recorded mint transaction has no confirmed receipt onchain.",
                title: "Published mint can no longer be verified"
              })
            );
          } else if (mintReceipt.status !== "success") {
            issues.push(
              createIssue({
                detail: {
                  contractAddress: expectedContractAddress,
                  contractChainKey: chainKey,
                  mintId: mint.id,
                  publishedCollectionId: publication.id,
                  publishedCollectionSlug: publication.slug,
                  reason: "transaction_reverted",
                  tokenId: mint.tokenId,
                  txHash: mint.txHash
                },
                kind: "published_token_mint_unverified",
                message:
                  "The recorded mint transaction no longer resolves to a successful onchain receipt.",
                title: "Published mint can no longer be verified"
              })
            );
          } else if (
            !isAddressEqual(mintTransaction.from, expectedOwnerWalletAddress) ||
            !mintTransaction.to ||
            !isAddressEqual(mintTransaction.to, expectedContractAddress)
          ) {
            issues.push(
              createIssue({
                detail: {
                  contractAddress: expectedContractAddress,
                  contractChainKey: chainKey,
                  mintId: mint.id,
                  publishedCollectionId: publication.id,
                  publishedCollectionSlug: publication.slug,
                  reason: "transaction_target_mismatch",
                  tokenId: mint.tokenId,
                  txHash: mint.txHash
                },
                kind: "published_token_mint_unverified",
                message:
                  "The recorded mint transaction no longer targets the recorded contract from the owner wallet.",
                title: "Published mint can no longer be verified"
              })
            );
          }
        }

        const recordedTokenOwner = await publicClient
          .readContract({
            abi: contractAbi,
            address: expectedContractAddress,
            functionName: "ownerOf",
            args: [BigInt(mint.tokenId)]
          })
          .catch(() => null);
        const normalizedRecipientWalletAddress = getAddress(
          mint.recipientWalletAddress
        );

        if (
          !recordedTokenOwner ||
          !isAddressEqual(
            recordedTokenOwner as `0x${string}`,
            normalizedRecipientWalletAddress
          )
        ) {
          issues.push(
            createIssue({
              detail: {
                contractAddress: expectedContractAddress,
                contractChainKey: chainKey,
                expectedRecipientWalletAddress: normalizedRecipientWalletAddress,
                mintId: mint.id,
                observedOwnerWalletAddress: recordedTokenOwner
                  ? getAddress(recordedTokenOwner as `0x${string}`)
                  : null,
                publishedCollectionId: publication.id,
                publishedCollectionSlug: publication.slug,
                tokenId: mint.tokenId,
                txHash: mint.txHash
              },
              kind: "published_token_owner_mismatch",
              message:
                "The onchain token owner no longer matches the recorded mint recipient.",
              title: "Published token owner mismatch"
            })
          );
        }
      }

      return issues;
    }
  };
}

export type { PublishedCollectionOnchainInspector };
