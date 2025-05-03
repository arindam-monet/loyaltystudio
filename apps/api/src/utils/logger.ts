// Create a simple logger to avoid ESM issues with pino
export const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`[DEBUG] ${message}`, ...args),
  trace: (message: string, ...args: any[]) => console.trace(`[TRACE] ${message}`, ...args),
  fatal: (message: string, ...args: any[]) => console.error(`[FATAL] ${message}`, ...args),
  child: () => logger,
};