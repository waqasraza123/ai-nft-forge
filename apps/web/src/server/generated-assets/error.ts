export class GeneratedAssetServiceError extends Error {
  constructor(
    public readonly code:
      | "GENERATED_ASSET_NOT_FOUND"
      | "INVALID_REQUEST"
      | "SESSION_REQUIRED",
    message: string,
    public readonly statusCode: 400 | 401 | 404
  ) {
    super(message);
    this.name = "GeneratedAssetServiceError";
  }
}
