import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { parseStorageEnv, type StorageEnv } from "./env/storage-env.js";

export type StorageObjectHead = {
  byteSize: number | null;
  contentType: string | null;
};

export function sanitizeStorageFileName(fileName: string): string {
  const trimmedFileName = fileName.trim();
  const lastPathSegment =
    trimmedFileName.split(/[/\\]/).pop()?.normalize("NFKD") ?? "asset";
  const asciiFileName = [...lastPathSegment]
    .filter((character) => character.charCodeAt(0) <= 0x7f)
    .join("");
  const sanitizedFileName = asciiFileName
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120);

  return sanitizedFileName.length > 0 ? sanitizedFileName : "asset";
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
    maybeError.name === "NotFound" ||
    maybeError.name === "NoSuchKey"
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

export async function headStorageObject(input: {
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

export async function copyStorageObject(input: {
  bucket: string;
  client: S3Client;
  contentType?: string;
  key: string;
  metadata?: Record<string, string>;
  sourceBucket: string;
  sourceKey: string;
}) {
  await input.client.send(
    new CopyObjectCommand({
      Bucket: input.bucket,
      ContentType: input.contentType,
      CopySource: `/${input.sourceBucket}/${input.sourceKey}`,
      Key: input.key,
      Metadata: input.metadata,
      MetadataDirective:
        input.contentType || input.metadata ? "REPLACE" : undefined
    })
  );
}

export async function deleteStorageObject(input: {
  bucket: string;
  client: S3Client;
  key: string;
}) {
  await input.client.send(
    new DeleteObjectCommand({
      Bucket: input.bucket,
      Key: input.key
    })
  );
}

export async function createSignedStorageDownload(input: {
  bucket: string;
  client: S3Client;
  expiresInSeconds: number;
  key: string;
}) {
  const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
  const url = await getSignedUrl(
    input.client,
    new GetObjectCommand({
      Bucket: input.bucket,
      Key: input.key
    }),
    {
      expiresIn: input.expiresInSeconds
    }
  );

  return {
    expiresAt: expiresAt.toISOString(),
    method: "GET" as const,
    url
  };
}
