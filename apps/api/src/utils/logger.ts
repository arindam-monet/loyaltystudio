// Create a simple logger to avoid ESM issues with pino
export const logger = {
  info: (messageOrObj: string | object, messageOrArgs?: string | any[], ...args: any[]) => {
    if (typeof messageOrObj === 'object') {
      const message = typeof messageOrArgs === 'string' ? messageOrArgs : '';
      console.log(`[INFO] ${message}`, messageOrObj, ...(Array.isArray(messageOrArgs) ? messageOrArgs : args));
    } else {
      console.log(`[INFO] ${messageOrObj}`, ...(messageOrArgs ? [messageOrArgs, ...args] : args));
    }
  },
  error: (messageOrObj: string | object, messageOrArgs?: string | any[], ...args: any[]) => {
    if (typeof messageOrObj === 'object') {
      const message = typeof messageOrArgs === 'string' ? messageOrArgs : '';
      console.error(`[ERROR] ${message}`, messageOrObj, ...(Array.isArray(messageOrArgs) ? messageOrArgs : args));
    } else {
      console.error(`[ERROR] ${messageOrObj}`, ...(messageOrArgs ? [messageOrArgs, ...args] : args));
    }
  },
  warn: (messageOrObj: string | object, messageOrArgs?: string | any[], ...args: any[]) => {
    if (typeof messageOrObj === 'object') {
      const message = typeof messageOrArgs === 'string' ? messageOrArgs : '';
      console.warn(`[WARN] ${message}`, messageOrObj, ...(Array.isArray(messageOrArgs) ? messageOrArgs : args));
    } else {
      console.warn(`[WARN] ${messageOrObj}`, ...(messageOrArgs ? [messageOrArgs, ...args] : args));
    }
  },
  debug: (messageOrObj: string | object, messageOrArgs?: string | any[], ...args: any[]) => {
    if (typeof messageOrObj === 'object') {
      const message = typeof messageOrArgs === 'string' ? messageOrArgs : '';
      console.debug(`[DEBUG] ${message}`, messageOrObj, ...(Array.isArray(messageOrArgs) ? messageOrArgs : args));
    } else {
      console.debug(`[DEBUG] ${messageOrObj}`, ...(messageOrArgs ? [messageOrArgs, ...args] : args));
    }
  },
  trace: (messageOrObj: string | object, messageOrArgs?: string | any[], ...args: any[]) => {
    if (typeof messageOrObj === 'object') {
      const message = typeof messageOrArgs === 'string' ? messageOrArgs : '';
      console.trace(`[TRACE] ${message}`, messageOrObj, ...(Array.isArray(messageOrArgs) ? messageOrArgs : args));
    } else {
      console.trace(`[TRACE] ${messageOrObj}`, ...(messageOrArgs ? [messageOrArgs, ...args] : args));
    }
  },
  fatal: (messageOrObj: string | object, messageOrArgs?: string | any[], ...args: any[]) => {
    if (typeof messageOrObj === 'object') {
      const message = typeof messageOrArgs === 'string' ? messageOrArgs : '';
      console.error(`[FATAL] ${message}`, messageOrObj, ...(Array.isArray(messageOrArgs) ? messageOrArgs : args));
    } else {
      console.error(`[FATAL] ${messageOrObj}`, ...(messageOrArgs ? [messageOrArgs, ...args] : args));
    }
  },
  child: () => logger,
};