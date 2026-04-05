import type { DatabaseClient, DatabaseTransactionClient } from "../client.js";

export async function runDatabaseTransaction<T>(
  client: DatabaseClient,
  operation: (transaction: DatabaseTransactionClient) => Promise<T>
): Promise<T> {
  return client.$transaction(async (transaction) => operation(transaction));
}
