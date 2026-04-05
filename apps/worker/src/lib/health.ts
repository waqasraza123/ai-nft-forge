import { queueCatalog, parseWorkerEnv } from "@ai-nft-forge/shared";

export type WorkerHealthSnapshot = {
  queueNames: string[];
  redisUrl: string;
  service: string;
  status: "ok";
};

export function createWorkerHealthSnapshot(
  rawEnvironment: NodeJS.ProcessEnv
): WorkerHealthSnapshot {
  const env = parseWorkerEnv(rawEnvironment);

  return {
    queueNames: queueCatalog.map((entry) => entry.queueName),
    redisUrl: env.REDIS_URL,
    service: env.WORKER_SERVICE_NAME,
    status: "ok"
  };
}
