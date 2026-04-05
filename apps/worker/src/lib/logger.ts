import type { WorkerLogLevel } from "@ai-nft-forge/shared";

type LogContext = Record<string, unknown>;

type LoggerOptions = {
  level: WorkerLogLevel;
  service: string;
};

type LogMethod = (message: string, context?: LogContext) => void;

export type Logger = {
  debug: LogMethod;
  error: LogMethod;
  info: LogMethod;
  warn: LogMethod;
};

const logPriority: Record<WorkerLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

export function createLogger({ level, service }: LoggerOptions): Logger {
  const minimumPriority = logPriority[level];

  const writeLog = (
    logLevel: WorkerLogLevel,
    message: string,
    context: LogContext = {}
  ) => {
    if (logPriority[logLevel] < minimumPriority) {
      return;
    }

    const payload = JSON.stringify({
      level: logLevel,
      message,
      service,
      timestamp: new Date().toISOString(),
      ...context
    });

    if (logLevel === "error") {
      process.stderr.write(`${payload}\n`);
      return;
    }

    process.stdout.write(`${payload}\n`);
  };

  return {
    debug: (message, context) => writeLog("debug", message, context),
    error: (message, context) => writeLog("error", message, context),
    info: (message, context) => writeLog("info", message, context),
    warn: (message, context) => writeLog("warn", message, context)
  };
}
