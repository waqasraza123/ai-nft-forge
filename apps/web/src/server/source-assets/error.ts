export class SourceAssetServiceError extends Error {
  constructor(
    public readonly code:
      | "ASSET_NOT_FOUND"
      | "CONTENT_TYPE_UNSUPPORTED"
      | "INVALID_REQUEST"
      | "OBJECT_MISSING"
      | "SESSION_REQUIRED",
    message: string,
    public readonly statusCode: 400 | 401 | 404 | 409
  ) {
    super(message);
    this.name = "SourceAssetServiceError";
  }
}
