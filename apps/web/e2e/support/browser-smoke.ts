import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createDatabaseClient } from "@ai-nft-forge/database";
import {
  authNonceResponseSchema,
  authSessionResponseSchema,
  createObjectStorageClient,
  generationQueueNames,
  getStorageConfig,
  parseWorkerEnv,
  putStorageObject
} from "@ai-nft-forge/shared";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import {
  request as playwrightRequest,
  type FullConfig,
  type StorageState
} from "@playwright/test";
import { privateKeyToAccount } from "viem/accounts";

const browserSmokeWalletPrivateKey =
  "0x59c6995e998f97a5a0044966f094538e947d42c9d83df9037b9d1f1ed2a5b7b3";
const browserSmokeOperatorName = "Browser Smoke Operator";
const pngFixtureBytes = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9oN8W6wAAAAASUVORK5CYII=",
    "base64"
  )
);

type BrowserSmokeAuthSession = NonNullable<
  Awaited<ReturnType<typeof createAuthenticatedBrowserSmokeSession>>["session"]
>;

export type BrowserSmokeSeededState = {
  invalidDraftTitle: string;
  mainAssetFilename: string;
  mainFailedGenerationId: string;
  runningAssetFilename: string;
};

export type BrowserSmokeStorefrontState = {
  brandPath: string;
  brandSlug: string;
  collectionPath: string;
  collectionSlug: string;
};

function createBrowserSmokePrefix() {
  const storagePrefix = process.env.BROWSER_SMOKE_STORAGE_PREFIX?.trim();

  if (!storagePrefix) {
    throw new Error("BROWSER_SMOKE_STORAGE_PREFIX is required.");
  }

  return `${storagePrefix}/${crypto.randomUUID()}`;
}

async function clearBrowserSmokeStorageBucketPrefix(input: { bucket: string }) {
  const storagePrefix = process.env.BROWSER_SMOKE_STORAGE_PREFIX?.trim();

  if (!storagePrefix) {
    throw new Error("BROWSER_SMOKE_STORAGE_PREFIX is required.");
  }

  const storageClient = createObjectStorageClient(process.env);
  let continuationToken: string | undefined;

  do {
    const response = await storageClient.send(
      new ListObjectsV2Command({
        Bucket: input.bucket,
        ContinuationToken: continuationToken,
        Prefix: `${storagePrefix}/`
      })
    );
    const objectIdentifiers =
      response.Contents?.flatMap((entry) =>
        entry.Key ? [{ Key: entry.Key }] : []
      ) ?? [];

    if (objectIdentifiers.length > 0) {
      await storageClient.send(
        new DeleteObjectsCommand({
          Bucket: input.bucket,
          Delete: {
            Objects: objectIdentifiers,
            Quiet: true
          }
        })
      );
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);
}

async function clearBrowserSmokeStoragePrefix() {
  const storageConfig = getStorageConfig(process.env);

  await clearBrowserSmokeStorageBucketPrefix({
    bucket: storageConfig.S3_BUCKET_PRIVATE
  });
  await clearBrowserSmokeStorageBucketPrefix({
    bucket: storageConfig.S3_BUCKET_PUBLIC
  });
}

async function clearBrowserSmokeDatabase() {
  const databaseClient = createDatabaseClient(process.env);

  try {
    await databaseClient.opsReconciliationIssue.deleteMany();
    await databaseClient.opsReconciliationRun.deleteMany();
    await databaseClient.publishedCollectionItem.deleteMany();
    await databaseClient.publishedCollection.deleteMany();
    await databaseClient.collectionDraftItem.deleteMany();
    await databaseClient.collectionDraft.deleteMany();
    await databaseClient.brand.deleteMany();
    await databaseClient.workspace.deleteMany();
    await databaseClient.generatedAsset.deleteMany();
    await databaseClient.generationRequest.deleteMany();
    await databaseClient.sourceAsset.deleteMany();
    await databaseClient.authSession.deleteMany();
    await databaseClient.authNonce.deleteMany();
    await databaseClient.user.deleteMany();
  } finally {
    await databaseClient.$disconnect();
  }
}

async function clearBrowserSmokeQueue() {
  const workerEnvironment = parseWorkerEnv(process.env);
  const redisConnection = new IORedis(workerEnvironment.REDIS_URL, {
    maxRetriesPerRequest: null
  });
  const queue = new Queue(generationQueueNames.generationDispatch, {
    connection: redisConnection
  });

  try {
    await queue.obliterate({
      force: true
    });
  } finally {
    await queue.close();
    await redisConnection.quit();
  }
}

async function storeObject(input: {
  bucket: string;
  contentType: string;
  key: string;
}) {
  const storageClient = createObjectStorageClient(process.env);

  await putStorageObject({
    body: pngFixtureBytes,
    bucket: input.bucket,
    client: storageClient,
    contentType: input.contentType,
    key: input.key
  });

  return {
    bucket: input.bucket,
    byteSize: pngFixtureBytes.byteLength,
    key: input.key
  };
}

async function storePrivateObject(input: { contentType: string; key: string }) {
  const storageConfig = getStorageConfig(process.env);

  return storeObject({
    bucket: storageConfig.S3_BUCKET_PRIVATE,
    contentType: input.contentType,
    key: input.key
  });
}

async function storePublicObject(input: { contentType: string; key: string }) {
  const storageConfig = getStorageConfig(process.env);

  return storeObject({
    bucket: storageConfig.S3_BUCKET_PUBLIC,
    contentType: input.contentType,
    key: input.key
  });
}

export async function resetBrowserSmokeState() {
  await clearBrowserSmokeQueue();
  await clearBrowserSmokeDatabase();
  await clearBrowserSmokeStoragePrefix();
}

export async function createAuthenticatedBrowserSmokeSession(input: {
  baseURL: string;
}): Promise<{
  session: BrowserSmokeAuthSession;
  storageState: StorageState;
}> {
  const account = privateKeyToAccount(browserSmokeWalletPrivateKey);
  const apiContext = await playwrightRequest.newContext({
    baseURL: input.baseURL
  });

  try {
    const nonceResponse = await apiContext.post("/api/auth/nonce", {
      data: {
        walletAddress: account.address
      }
    });
    const noncePayload = authNonceResponseSchema.parse(
      await nonceResponse.json()
    );
    const signature = await account.signMessage({
      message: noncePayload.message
    });
    const verifyResponse = await apiContext.post("/api/auth/verify", {
      data: {
        displayName: browserSmokeOperatorName,
        nonce: noncePayload.nonce,
        signature,
        walletAddress: account.address
      }
    });
    const sessionPayload = authSessionResponseSchema.parse(
      await verifyResponse.json()
    );
    const storageState = await apiContext.storageState();

    if (!sessionPayload.session) {
      throw new Error("Browser smoke authentication did not create a session.");
    }

    return {
      session: sessionPayload.session,
      storageState
    };
  } finally {
    await apiContext.dispose();
  }
}

export async function seedBrowserSmokeData(input: {
  userId: string;
}): Promise<BrowserSmokeSeededState> {
  const databaseClient = createDatabaseClient(process.env);
  const prefix = createBrowserSmokePrefix();
  const now = Date.now();
  const sourceAssetContentType = "image/png";
  const mainAssetFilename = "portrait-main.png";
  const invalidDraftTitle = "Broken Launch Draft";
  const runningAssetFilename = "portrait-running.png";

  try {
    const workspace = await databaseClient.workspace.create({
      data: {
        name: "Browser Smoke Workspace",
        ownerUserId: input.userId,
        slug: `browser-smoke-${crypto.randomUUID().slice(0, 8)}`,
        status: "active"
      }
    });
    const mainSourceObject = await storePrivateObject({
      contentType: sourceAssetContentType,
      key: `${prefix}/source/main.png`
    });
    const failedOneSourceObject = await storePrivateObject({
      contentType: sourceAssetContentType,
      key: `${prefix}/source/failure-one.png`
    });
    const failedTwoSourceObject = await storePrivateObject({
      contentType: sourceAssetContentType,
      key: `${prefix}/source/failure-two.png`
    });
    const runningSourceObject = await storePrivateObject({
      contentType: sourceAssetContentType,
      key: `${prefix}/source/running.png`
    });
    const mainAsset = await databaseClient.sourceAsset.create({
      data: {
        byteSize: mainSourceObject.byteSize,
        contentType: sourceAssetContentType,
        createdAt: new Date(now - 75 * 60 * 1000),
        originalFilename: mainAssetFilename,
        ownerUserId: input.userId,
        status: "uploaded",
        storageBucket: mainSourceObject.bucket,
        storageObjectKey: mainSourceObject.key,
        uploadedAt: new Date(now - 75 * 60 * 1000),
        workspaceId: workspace.id
      }
    });
    const failedAlertOneAsset = await databaseClient.sourceAsset.create({
      data: {
        byteSize: failedOneSourceObject.byteSize,
        contentType: sourceAssetContentType,
        createdAt: new Date(now - 35 * 60 * 1000),
        originalFilename: "portrait-failure-one.png",
        ownerUserId: input.userId,
        status: "uploaded",
        storageBucket: failedOneSourceObject.bucket,
        storageObjectKey: failedOneSourceObject.key,
        uploadedAt: new Date(now - 35 * 60 * 1000),
        workspaceId: workspace.id
      }
    });
    const failedAlertTwoAsset = await databaseClient.sourceAsset.create({
      data: {
        byteSize: failedTwoSourceObject.byteSize,
        contentType: sourceAssetContentType,
        createdAt: new Date(now - 25 * 60 * 1000),
        originalFilename: "portrait-failure-two.png",
        ownerUserId: input.userId,
        status: "uploaded",
        storageBucket: failedTwoSourceObject.bucket,
        storageObjectKey: failedTwoSourceObject.key,
        uploadedAt: new Date(now - 25 * 60 * 1000),
        workspaceId: workspace.id
      }
    });
    const runningAsset = await databaseClient.sourceAsset.create({
      data: {
        byteSize: runningSourceObject.byteSize,
        contentType: sourceAssetContentType,
        createdAt: new Date(now - 40 * 60 * 1000),
        originalFilename: runningAssetFilename,
        ownerUserId: input.userId,
        status: "uploaded",
        storageBucket: runningSourceObject.bucket,
        storageObjectKey: runningSourceObject.key,
        uploadedAt: new Date(now - 40 * 60 * 1000),
        workspaceId: workspace.id
      }
    });
    const mainSucceededGeneration =
      await databaseClient.generationRequest.create({
        data: {
          completedAt: new Date(now - 48 * 60 * 1000),
          createdAt: new Date(now - 50 * 60 * 1000),
          ownerUserId: input.userId,
          pipelineKey: "collectible-portrait-v1",
          queueJobId: "browser-smoke-main-succeeded",
          requestedVariantCount: 2,
          resultJson: {
            generatedVariantCount: 2,
            outputGroupKey: `${prefix}/generated/main-succeeded`,
            storedAssetCount: 2
          },
          sourceAssetId: mainAsset.id,
          startedAt: new Date(now - 49 * 60 * 1000),
          status: "succeeded",
          workspaceId: workspace.id
        }
      });
    const generatedVariantOneObject = await storePrivateObject({
      contentType: sourceAssetContentType,
      key: `${prefix}/generated/main-succeeded/variant-1.png`
    });
    const generatedVariantTwoObject = await storePrivateObject({
      contentType: sourceAssetContentType,
      key: `${prefix}/generated/main-succeeded/variant-2.png`
    });

    await databaseClient.generatedAsset.createMany({
      data: [
        {
          byteSize: generatedVariantOneObject.byteSize,
          contentType: sourceAssetContentType,
          generationRequestId: mainSucceededGeneration.id,
          ownerUserId: input.userId,
          sourceAssetId: mainAsset.id,
          storageBucket: generatedVariantOneObject.bucket,
          storageObjectKey: generatedVariantOneObject.key,
          variantIndex: 1,
          workspaceId: workspace.id
        },
        {
          byteSize: generatedVariantTwoObject.byteSize,
          contentType: sourceAssetContentType,
          generationRequestId: mainSucceededGeneration.id,
          ownerUserId: input.userId,
          sourceAssetId: mainAsset.id,
          storageBucket: generatedVariantTwoObject.bucket,
          storageObjectKey: generatedVariantTwoObject.key,
          variantIndex: 2,
          workspaceId: workspace.id
        }
      ]
    });
    const invalidSourceObject = await storePrivateObject({
      contentType: sourceAssetContentType,
      key: `${prefix}/source/invalid.png`
    });
    const invalidSourceAsset = await databaseClient.sourceAsset.create({
      data: {
        byteSize: invalidSourceObject.byteSize,
        contentType: sourceAssetContentType,
        createdAt: new Date(now - 55 * 60 * 1000),
        originalFilename: "portrait-invalid.png",
        ownerUserId: input.userId,
        status: "uploaded",
        storageBucket: invalidSourceObject.bucket,
        storageObjectKey: invalidSourceObject.key,
        uploadedAt: new Date(now - 55 * 60 * 1000),
        workspaceId: workspace.id
      }
    });
    const invalidGeneration = await databaseClient.generationRequest.create({
      data: {
        completedAt: new Date(now - 52 * 60 * 1000),
        createdAt: new Date(now - 54 * 60 * 1000),
        ownerUserId: input.userId,
        pipelineKey: "collectible-portrait-v1",
        queueJobId: "browser-smoke-invalid-succeeded",
        requestedVariantCount: 1,
        resultJson: {
          generatedVariantCount: 1,
          outputGroupKey: `${prefix}/generated/invalid`,
          storedAssetCount: 1
        },
        sourceAssetId: invalidSourceAsset.id,
        startedAt: new Date(now - 53 * 60 * 1000),
        status: "succeeded",
        workspaceId: workspace.id
      }
    });
    const invalidGeneratedObject = await storePrivateObject({
      contentType: sourceAssetContentType,
      key: `${prefix}/generated/invalid/variant-1.png`
    });
    const invalidGeneratedAsset = await databaseClient.generatedAsset.create({
      data: {
        byteSize: invalidGeneratedObject.byteSize,
        contentType: sourceAssetContentType,
        generationRequestId: invalidGeneration.id,
        moderatedAt: new Date(now - 45 * 60 * 1000),
        moderationStatus: "rejected",
        ownerUserId: input.userId,
        sourceAssetId: invalidSourceAsset.id,
        storageBucket: invalidGeneratedObject.bucket,
        storageObjectKey: invalidGeneratedObject.key,
        variantIndex: 1,
        workspaceId: workspace.id
      }
    });
    const brand = await databaseClient.brand.create({
      data: {
        customDomain: null,
        name: "Browser Smoke Brand",
        slug: `browser-smoke-brand-${crypto.randomUUID().slice(0, 8)}`,
        themeJson: {
          accentColor: "#f58a44",
          featuredReleaseLabel: "Browser smoke",
          landingDescription:
            "Browser smoke brand seeded for reconciliation coverage.",
          landingHeadline: "Browser smoke launch",
          themePreset: "editorial_warm"
        },
        workspaceId: workspace.id
      }
    });
    const invalidDraft = await databaseClient.collectionDraft.create({
      data: {
        description: "Draft seeded with a later-rejected curated asset.",
        ownerUserId: input.userId,
        slug: "broken-launch-draft",
        status: "review_ready",
        title: invalidDraftTitle,
        workspaceId: workspace.id
      }
    });

    await databaseClient.collectionDraftItem.create({
      data: {
        collectionDraftId: invalidDraft.id,
        generatedAssetId: invalidGeneratedAsset.id,
        position: 1
      }
    });

    const brokenPublication = await databaseClient.publishedCollection.create({
      data: {
        brandName: brand.name,
        brandSlug: brand.slug,
        description: invalidDraft.description,
        displayOrder: 0,
        heroGeneratedAssetId: invalidGeneratedAsset.id,
        isFeatured: false,
        ownerUserId: input.userId,
        publishedAt: new Date(now - 40 * 60 * 1000),
        slug: invalidDraft.slug,
        soldCount: 0,
        sourceCollectionDraftId: invalidDraft.id,
        storefrontStatus: "live",
        title: invalidDraft.title,
        workspaceId: workspace.id
      }
    });

    await databaseClient.publishedCollectionItem.create({
      data: {
        generatedAssetId: invalidGeneratedAsset.id,
        position: 1,
        publicStorageBucket: null,
        publicStorageObjectKey: null,
        publishedCollectionId: brokenPublication.id
      }
    });

    const mainFailedGeneration = await databaseClient.generationRequest.create({
      data: {
        createdAt: new Date(now - 14 * 60 * 1000),
        failedAt: new Date(now - 12 * 60 * 1000),
        failureCode: "MODEL_BACKEND_ERROR",
        failureMessage: "The generation backend rejected the request.",
        ownerUserId: input.userId,
        pipelineKey: "collectible-portrait-v1",
        queueJobId: "browser-smoke-main-failed",
        requestedVariantCount: 4,
        sourceAssetId: mainAsset.id,
        startedAt: new Date(now - 13 * 60 * 1000),
        status: "failed",
        workspaceId: workspace.id
      }
    });

    await databaseClient.generationRequest.createMany({
      data: [
        {
          createdAt: new Date(now - 10 * 60 * 1000),
          failedAt: new Date(now - 9 * 60 * 1000),
          failureCode: "MODEL_BACKEND_TIMEOUT",
          failureMessage: "The backend timed out before outputs were stored.",
          ownerUserId: input.userId,
          pipelineKey: "collectible-portrait-v1",
          queueJobId: "browser-smoke-failure-one",
          requestedVariantCount: 4,
          sourceAssetId: failedAlertOneAsset.id,
          startedAt: new Date(now - 10 * 60 * 1000),
          status: "failed",
          workspaceId: workspace.id
        },
        {
          createdAt: new Date(now - 7 * 60 * 1000),
          failedAt: new Date(now - 6 * 60 * 1000),
          failureCode: "MODEL_BACKEND_ERROR",
          failureMessage: "The model backend returned a non-retryable error.",
          ownerUserId: input.userId,
          pipelineKey: "collectible-portrait-v1",
          queueJobId: "browser-smoke-failure-two",
          requestedVariantCount: 3,
          sourceAssetId: failedAlertTwoAsset.id,
          startedAt: new Date(now - 7 * 60 * 1000),
          status: "failed",
          workspaceId: workspace.id
        },
        {
          createdAt: new Date(now - 21 * 60 * 1000),
          ownerUserId: input.userId,
          pipelineKey: "collectible-portrait-v1",
          queueJobId: "browser-smoke-running",
          requestedVariantCount: 2,
          sourceAssetId: runningAsset.id,
          startedAt: new Date(now - 20 * 60 * 1000),
          status: "running",
          workspaceId: workspace.id
        }
      ]
    });

    return {
      invalidDraftTitle,
      mainAssetFilename,
      mainFailedGenerationId: mainFailedGeneration.id,
      runningAssetFilename
    };
  } finally {
    await databaseClient.$disconnect();
  }
}

export async function seedPublicStorefrontData(input: {
  userId: string;
}): Promise<BrowserSmokeStorefrontState> {
  const databaseClient = createDatabaseClient(process.env);
  const prefix = createBrowserSmokePrefix();
  const now = Date.now();
  const contentType = "image/png";
  const brandSlug = "demo-launch";
  const collectionSlug = "midnight-portraits";

  try {
    const workspace = await databaseClient.workspace.create({
      data: {
        name: "Demo Launch Workspace",
        ownerUserId: input.userId,
        slug: "demo-launch-workspace",
        status: "active"
      }
    });
    const sourceAsset = await storePrivateObject({
      contentType,
      key: `${prefix}/storefront/source/portrait-main.png`
    });
    const storefrontSourceAsset = await databaseClient.sourceAsset.create({
      data: {
        byteSize: sourceAsset.byteSize,
        contentType,
        createdAt: new Date(now - 66 * 60 * 1000),
        originalFilename: "storefront-source.png",
        ownerUserId: input.userId,
        status: "uploaded",
        storageBucket: sourceAsset.bucket,
        storageObjectKey: sourceAsset.key,
        uploadedAt: new Date(now - 66 * 60 * 1000),
        workspaceId: workspace.id
      }
    });
    const generation = await databaseClient.generationRequest.create({
      data: {
        completedAt: new Date(now - 62 * 60 * 1000),
        createdAt: new Date(now - 65 * 60 * 1000),
        ownerUserId: input.userId,
        pipelineKey: "collectible-portrait-v1",
        queueJobId: "browser-smoke-storefront-succeeded",
        requestedVariantCount: 2,
        resultJson: {
          generatedVariantCount: 2,
          storedAssetCount: 2
        },
        sourceAssetId: storefrontSourceAsset.id,
        startedAt: new Date(now - 64 * 60 * 1000),
        status: "succeeded",
        workspaceId: workspace.id
      },
      include: {
        sourceAsset: true
      }
    });
    const publicVariantOne = await storePublicObject({
      contentType,
      key: `${prefix}/storefront/public/variant-1.png`
    });
    const publicVariantTwo = await storePublicObject({
      contentType,
      key: `${prefix}/storefront/public/variant-2.png`
    });
    const privateVariantOne = await storePrivateObject({
      contentType,
      key: `${prefix}/storefront/private/variant-1.png`
    });
    const privateVariantTwo = await storePrivateObject({
      contentType,
      key: `${prefix}/storefront/private/variant-2.png`
    });
    const generatedAssets = await Promise.all([
      databaseClient.generatedAsset.create({
        data: {
          byteSize: privateVariantOne.byteSize,
          contentType,
          generationRequestId: generation.id,
          ownerUserId: input.userId,
          sourceAssetId: generation.sourceAssetId,
          storageBucket: privateVariantOne.bucket,
          storageObjectKey: privateVariantOne.key,
          variantIndex: 1,
          workspaceId: workspace.id
        }
      }),
      databaseClient.generatedAsset.create({
        data: {
          byteSize: privateVariantTwo.byteSize,
          contentType,
          generationRequestId: generation.id,
          ownerUserId: input.userId,
          sourceAssetId: generation.sourceAssetId,
          storageBucket: privateVariantTwo.bucket,
          storageObjectKey: privateVariantTwo.key,
          variantIndex: 2,
          workspaceId: workspace.id
        }
      })
    ]);
    const brand = await databaseClient.brand.create({
      data: {
        customDomain: null,
        name: "Demo Launch",
        slug: brandSlug,
        themeJson: {
          accentColor: "#f58a44",
          featuredReleaseLabel: "Featured launch",
          heroKicker: "Phase 5 smoke test",
          landingDescription:
            "A branded storefront smoke fixture seeded directly into the published snapshot boundary.",
          landingHeadline: "Curated launch storefront",
          primaryCtaLabel: "Open featured release",
          secondaryCtaLabel: "Browse archive",
          storyBody:
            "This seed proves the public routes render from saved brand configuration and published collection data only.",
          storyHeadline: "Published storefront data only.",
          themePreset: "midnight_launch",
          wordmark: "Demo Launch"
        },
        workspaceId: workspace.id
      }
    });
    const draft = await databaseClient.collectionDraft.create({
      data: {
        description: "A launch-ready portrait release for browser smoke.",
        ownerUserId: input.userId,
        slug: collectionSlug,
        status: "review_ready",
        title: "Midnight Portraits",
        workspaceId: workspace.id
      }
    });

    await databaseClient.collectionDraftItem.createMany({
      data: generatedAssets.map((asset, index) => ({
        collectionDraftId: draft.id,
        generatedAssetId: asset.id,
        position: index + 1
      }))
    });

    const publication = await databaseClient.publishedCollection.create({
      data: {
        brandName: brand.name,
        brandSlug: brand.slug,
        description: draft.description,
        displayOrder: 0,
        heroGeneratedAssetId: generatedAssets[1]!.id,
        isFeatured: true,
        launchAt: new Date("2026-04-10T12:00:00.000Z"),
        ownerUserId: input.userId,
        priceLabel: "0.18 ETH",
        primaryCtaHref: "https://example.com/mint",
        primaryCtaLabel: "Enter mint",
        publishedAt: new Date(now - 45 * 60 * 1000),
        secondaryCtaHref: "https://example.com/lookbook",
        secondaryCtaLabel: "View lookbook",
        slug: collectionSlug,
        soldCount: 2,
        sourceCollectionDraftId: draft.id,
        storefrontBody:
          "This public collection page is seeded for browser smoke coverage.",
        storefrontHeadline: "Midnight Portraits",
        storefrontStatus: "live",
        title: draft.title,
        totalSupply: 8,
        workspaceId: workspace.id
      }
    });

    await databaseClient.publishedCollectionItem.createMany({
      data: [
        {
          generatedAssetId: generatedAssets[0]!.id,
          position: 1,
          publicStorageBucket: publicVariantOne.bucket,
          publicStorageObjectKey: publicVariantOne.key,
          publishedCollectionId: publication.id
        },
        {
          generatedAssetId: generatedAssets[1]!.id,
          position: 2,
          publicStorageBucket: publicVariantTwo.bucket,
          publicStorageObjectKey: publicVariantTwo.key,
          publishedCollectionId: publication.id
        }
      ]
    });

    return {
      brandPath: `/brands/${brandSlug}`,
      brandSlug,
      collectionPath: `/brands/${brandSlug}/collections/${collectionSlug}`,
      collectionSlug
    };
  } finally {
    await databaseClient.$disconnect();
  }
}

export function getBrowserSmokeBaseURLFromConfig(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL;

  if (typeof baseURL !== "string" || baseURL.length === 0) {
    throw new Error("Playwright baseURL is required for browser smoke tests.");
  }

  return baseURL;
}
