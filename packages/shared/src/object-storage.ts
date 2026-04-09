import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { parseStorageEnv, type StorageEnv } from "./env/storage-env.js";

export type StorageObjectHead = {
  byteSize: number | null;
  contentType: string | null;
};

export type StorageObjectData = {
  body: Uint8Array;
  byteSize: number;
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

export async function getStorageObjectBytes(input: {
  bucket: string;
  client: S3Client;
  key: string;
}): Promise<StorageObjectData> {
  const response = await input.client.send(
    new GetObjectCommand({
      Bucket: input.bucket,
      Key: input.key
    })
  );

  if (!response.Body) {
    throw new Error(
      `Storage object ${input.key} did not include a response body.`
    );
  }

  const body = await response.Body.transformToByteArray();

  return {
    body,
    byteSize:
      typeof response.ContentLength === "number"
        ? response.ContentLength
        : body.byteLength,
    contentType: response.ContentType ?? null
  };
}

export async function putStorageObject(input: {
  body: Uint8Array;
  bucket: string;
  client: S3Client;
  contentType: string;
  key: string;
  metadata?: Record<string, string>;
}) {
  await input.client.send(
    new PutObjectCommand({
      Body: input.body,
      Bucket: input.bucket,
      ContentType: input.contentType,
      Key: input.key,
      Metadata: input.metadata
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

export function createPublicStorageUrl(input: {
  bucket: string;
  endpoint: string;
  forcePathStyle: boolean;
  key: string;
}) {
  const normalizedKey = input.key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const endpointUrl = new URL(input.endpoint);

  if (input.forcePathStyle) {
    endpointUrl.pathname = `/${input.bucket}/${normalizedKey}`;

    return endpointUrl.toString();
  }

  endpointUrl.hostname = `${input.bucket}.${endpointUrl.hostname}`;
  endpointUrl.pathname = `/${normalizedKey}`;

  return endpointUrl.toString();
}
