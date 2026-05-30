export type LogLevel = "verbose" | "info" | "warning" | "error";

type LogLevelValue = { [key in LogLevel]: number };

const LOG_LEVELS: LogLevelValue = {
  verbose: 0,
  info: 1,
  warning: 2,
  error: 3,
};

export class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = "info") {
    this.level = level;
  }

  private shouldLog(targetLevel: LogLevel): boolean {
    return LOG_LEVELS[targetLevel] >= LOG_LEVELS[this.level];
  }

  verbose(message: string, data?: any) {
    if (this.shouldLog("verbose")) {
      console.log(`[nitro-spec] ${message}`, data ? data : "");
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog("info")) {
      console.log(`[nitro-spec] ${message}`, data ? data : "");
    }
  }

  warning(message: string, data?: any) {
    if (this.shouldLog("warning")) {
      console.warn(`[nitro-spec] ${message}`, data ? data : "");
    }
  }

  error(message: string, data?: any) {
    if (this.shouldLog("error")) {
      console.error(`[nitro-spec] ${message}`, data ? data : "");
    }
  }
}
