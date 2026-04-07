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
  mainAssetFilename: string;
  mainFailedGenerationId: string;
  runningAssetFilename: string;
};

function createBrowserSmokePrefix() {
  const storagePrefix = process.env.BROWSER_SMOKE_STORAGE_PREFIX?.trim();

  if (!storagePrefix) {
    throw new Error("BROWSER_SMOKE_STORAGE_PREFIX is required.");
  }

  return `${storagePrefix}/${crypto.randomUUID()}`;
}

async function clearBrowserSmokeStoragePrefix() {
  const storagePrefix = process.env.BROWSER_SMOKE_STORAGE_PREFIX?.trim();

  if (!storagePrefix) {
    throw new Error("BROWSER_SMOKE_STORAGE_PREFIX is required.");
  }

  const storageConfig = getStorageConfig(process.env);
  const storageClient = createObjectStorageClient(process.env);
  let continuationToken: string | undefined;

  do {
    const response = await storageClient.send(
      new ListObjectsV2Command({
        Bucket: storageConfig.S3_BUCKET_PRIVATE,
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
          Bucket: storageConfig.S3_BUCKET_PRIVATE,
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

async function clearBrowserSmokeDatabase() {
  const databaseClient = createDatabaseClient(process.env);

  try {
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

async function storePrivateObject(input: { contentType: string; key: string }) {
  const storageConfig = getStorageConfig(process.env);
  const storageClient = createObjectStorageClient(process.env);

  await putStorageObject({
    body: pngFixtureBytes,
    bucket: storageConfig.S3_BUCKET_PRIVATE,
    client: storageClient,
    contentType: input.contentType,
    key: input.key
  });

  return {
    bucket: storageConfig.S3_BUCKET_PRIVATE,
    byteSize: pngFixtureBytes.byteLength,
    key: input.key
  };
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
  const runningAssetFilename = "portrait-running.png";

  try {
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
        uploadedAt: new Date(now - 75 * 60 * 1000)
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
        uploadedAt: new Date(now - 35 * 60 * 1000)
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
        uploadedAt: new Date(now - 25 * 60 * 1000)
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
        uploadedAt: new Date(now - 40 * 60 * 1000)
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
          status: "succeeded"
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
          variantIndex: 1
        },
        {
          byteSize: generatedVariantTwoObject.byteSize,
          contentType: sourceAssetContentType,
          generationRequestId: mainSucceededGeneration.id,
          ownerUserId: input.userId,
          sourceAssetId: mainAsset.id,
          storageBucket: generatedVariantTwoObject.bucket,
          storageObjectKey: generatedVariantTwoObject.key,
          variantIndex: 2
        }
      ]
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
        status: "failed"
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
          status: "failed"
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
          status: "failed"
        },
        {
          createdAt: new Date(now - 21 * 60 * 1000),
          ownerUserId: input.userId,
          pipelineKey: "collectible-portrait-v1",
          queueJobId: "browser-smoke-running",
          requestedVariantCount: 2,
          sourceAssetId: runningAsset.id,
          startedAt: new Date(now - 20 * 60 * 1000),
          status: "running"
        }
      ]
    });

    return {
      mainAssetFilename,
      mainFailedGenerationId: mainFailedGeneration.id,
      runningAssetFilename
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
