export class GenerationBackendServiceError extends Error {
  constructor(
    public readonly code:
      | "INVALID_REQUEST"
      | "MODEL_BACKEND_ERROR"
      | "MODEL_BACKEND_TIMEOUT"
      | "SOURCE_ASSET_UNSUPPORTED"
      | "SOURCE_OBJECT_MISSING",
    message: string,
    public readonly statusCode: 400 | 404 | 422 | 502 | 504,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "GenerationBackendServiceError";
  }
}
