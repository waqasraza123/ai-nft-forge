import { describe, expect, it } from "vitest";

import { parseStorageEnv } from "./storage-env.js";

describe("parseStorageEnv", () => {
  it("parses explicit storage environment values", () => {
    expect(
      parseStorageEnv({
        S3_ACCESS_KEY_ID: "minio",
        S3_BUCKET_PRIVATE: "private",
        S3_BUCKET_PUBLIC: "public",
        S3_ENDPOINT: "http://127.0.0.1:59000",
        S3_FORCE_PATH_STYLE: "false",
        S3_REGION: "us-east-1",
        S3_SECRET_ACCESS_KEY: "secret",
        S3_USE_SSL: "false",
        SOURCE_ASSET_UPLOAD_URL_TTL_SECONDS: "600"
      })
    ).toEqual({
      S3_ACCESS_KEY_ID: "minio",
      S3_BUCKET_PRIVATE: "private",
      S3_BUCKET_PUBLIC: "public",
      S3_ENDPOINT: "http://127.0.0.1:59000",
      S3_FORCE_PATH_STYLE: false,
      S3_REGION: "us-east-1",
      S3_SECRET_ACCESS_KEY: "secret",
      S3_USE_SSL: false,
      SOURCE_ASSET_UPLOAD_URL_TTL_SECONDS: 600
    });
  });

  it("applies defaults for force path style, ssl, region, and upload ttl", () => {
    expect(
      parseStorageEnv({
        S3_ACCESS_KEY_ID: "minio",
        S3_BUCKET_PRIVATE: "private",
        S3_BUCKET_PUBLIC: "public",
        S3_ENDPOINT: "http://127.0.0.1:59000",
        S3_SECRET_ACCESS_KEY: "secret"
      })
    ).toEqual({
      S3_ACCESS_KEY_ID: "minio",
      S3_BUCKET_PRIVATE: "private",
      S3_BUCKET_PUBLIC: "public",
      S3_ENDPOINT: "http://127.0.0.1:59000",
      S3_FORCE_PATH_STYLE: true,
      S3_REGION: "us-east-1",
      S3_SECRET_ACCESS_KEY: "secret",
      S3_USE_SSL: false,
      SOURCE_ASSET_UPLOAD_URL_TTL_SECONDS: 900
    });
  });
});
