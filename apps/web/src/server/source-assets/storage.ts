import { randomUUID } from "node:crypto";

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  parseStorageEnv,
  sourceAssetUploadDescriptorSchema,
  type SourceAssetContentType,
  type StorageEnv
} from "@ai-nft-forge/shared";

type StorageObjectHead = {
  byteSize: number | null;
  contentType: string | null;
};

function sanitizeSourceAssetFileName(fileName: string): string {
  const trimmedFileName = fileName.trim();
  const lastPathSegment =
    trimmedFileName.split(/[/\\]/).pop()?.normalize("NFKD") ?? "source-image";
  const asciiFileName = [...lastPathSegment]
    .filter((character) => character.charCodeAt(0) <= 0x7f)
    .join("");
  const sanitizedFileName = asciiFileName
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120);

  return sanitizedFileName.length > 0 ? sanitizedFileName : "source-image";
}

function isStorageObjectMissingError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybeError = error as {
    $metadata?: {
      httpStatusCode?: number;
    };
    Code?: string;
    name?: string;
  };

  return (
    maybeError.$metadata?.httpStatusCode === 404 ||
    maybeError.Code === "NotFound" ||
    maybeError.name === "NotFound"
  );
}

export function getStorageConfig(
  rawEnvironment: NodeJS.ProcessEnv = process.env
): StorageEnv {
  return parseStorageEnv(rawEnvironment);
}

export function createObjectStorageClient(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const env = getStorageConfig(rawEnvironment);

  return new S3Client({
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY
    },
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    region: env.S3_REGION
  });
}

export async function createSignedSourceAssetUpload(input: {
  client: S3Client;
  contentType: SourceAssetContentType;
  env: StorageEnv;
  fileName: string;
  ownerUserId: string;
}) {
  const objectKey = [
    "source-assets",
    input.ownerUserId,
    `${randomUUID()}-${sanitizeSourceAssetFileName(input.fileName)}`
  ].join("/");
  const expiresAt = new Date(
    Date.now() + input.env.SOURCE_ASSET_UPLOAD_URL_TTL_SECONDS * 1000
  );
  const url = await getSignedUrl(
    input.client,
    new PutObjectCommand({
      Bucket: input.env.S3_BUCKET_PRIVATE,
      ContentType: input.contentType,
      Key: objectKey
    }),
    {
      expiresIn: input.env.SOURCE_ASSET_UPLOAD_URL_TTL_SECONDS
    }
  );

  return sourceAssetUploadDescriptorSchema.parse({
    expiresAt: expiresAt.toISOString(),
    headers: {
      "content-type": input.contentType
    },
    method: "PUT",
    objectKey,
    url
  });
}

export async function headPrivateStorageObject(input: {
  bucket: string;
  client: S3Client;
  key: string;
}): Promise<StorageObjectHead | null> {
  try {
    const objectHead = await input.client.send(
      new HeadObjectCommand({
        Bucket: input.bucket,
        Key: input.key
      })
    );

    return {
      byteSize:
        typeof objectHead.ContentLength === "number"
          ? objectHead.ContentLength
          : null,
      contentType: objectHead.ContentType ?? null
    };
  } catch (error) {
    if (isStorageObjectMissingError(error)) {
      return null;
    }

    throw error;
  }
}
