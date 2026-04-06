import { randomUUID } from "node:crypto";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  createObjectStorageClient,
  getStorageConfig as getSharedStorageConfig,
  headStorageObject,
  sanitizeStorageFileName,
  sourceAssetUploadDescriptorSchema,
  type SourceAssetContentType,
  type StorageEnv
} from "@ai-nft-forge/shared";

export { createObjectStorageClient };

export function getStorageConfig(
  rawEnvironment: NodeJS.ProcessEnv = process.env
): StorageEnv {
  return getSharedStorageConfig(rawEnvironment);
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
    `${randomUUID()}-${sanitizeStorageFileName(input.fileName)}`
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
}) {
  return headStorageObject(input);
}
