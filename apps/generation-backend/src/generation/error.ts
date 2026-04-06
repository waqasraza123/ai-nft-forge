export class GenerationBackendServiceError extends Error {
  constructor(
    public readonly code:
      | "INVALID_REQUEST"
      | "SOURCE_ASSET_UNSUPPORTED"
      | "SOURCE_OBJECT_MISSING",
    message: string,
    public readonly statusCode: 400 | 404 | 422,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "GenerationBackendServiceError";
  }
}
