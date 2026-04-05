export class AuthServiceError extends Error {
  constructor(
    public readonly code:
      | "INVALID_REQUEST"
      | "NONCE_INVALID"
      | "SESSION_INVALID"
      | "SIGNATURE_INVALID"
      | "WALLET_ADDRESS_INVALID",
    message: string,
    public readonly statusCode: 400 | 401
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}
