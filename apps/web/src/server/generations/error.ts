export class GenerationServiceError extends Error {
  constructor(
    public readonly code:
      | "ACTIVE_GENERATION_EXISTS"
      | "GENERATION_NOT_FOUND"
      | "GENERATION_NOT_RETRYABLE"
      | "GENERATION_QUEUE_ERROR"
      | "INVALID_REQUEST"
      | "SESSION_REQUIRED"
      | "SOURCE_ASSET_NOT_FOUND"
      | "SOURCE_ASSET_NOT_READY",
    message: string,
    public readonly statusCode: 400 | 401 | 404 | 409 | 500
  ) {
    super(message);
    this.name = "GenerationServiceError";
  }
}
