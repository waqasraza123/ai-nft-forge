export class GeneratedAssetServiceError extends Error {
  constructor(
    public readonly code: "GENERATED_ASSET_NOT_FOUND" | "SESSION_REQUIRED",
    message: string,
    public readonly statusCode: 401 | 404
  ) {
    super(message);
    this.name = "GeneratedAssetServiceError";
  }
}
