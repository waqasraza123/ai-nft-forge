export type HealthPayload = {
  phase: "phase-1";
  service: "web";
  status: "ok";
  timestamp: string;
};

export function createHealthPayload(): HealthPayload {
  return {
    phase: "phase-1",
    service: "web",
    status: "ok",
    timestamp: new Date().toISOString()
  };
}
