export class GeneratedAssetServiceError extends Error {
  constructor(
    public readonly code:
      | "GENERATED_ASSET_NOT_FOUND"
      | "INVALID_REQUEST"
      | "SESSION_REQUIRED"
      | "WORKSPACE_NOT_ACTIVE",
    message: string,
    public readonly statusCode: 400 | 401 | 404 | 409
  ) {
    super(message);
    this.name = "GeneratedAssetServiceError";
  }
}
