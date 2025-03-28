import { TriggerClient } from "@trigger.dev/sdk";
import { env } from "./env.js";

export const trigger = new TriggerClient({
  id: "loyaltystudio-api",
  apiKey: env.TRIGGER_API_KEY,
  apiUrl: env.TRIGGER_API_URL,
  logLevel: env.NODE_ENV === "development" ? "debug" : "info",
});

// Configure job settings
trigger.configure({
  retry: {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoff: "exponential",
  },
  monitoring: {
    enabled: true,
    logLevel: env.NODE_ENV === "development" ? "debug" : "info",
    metrics: {
      enabled: true,
      interval: 60000, // 1 minute
    },
    alerts: {
      enabled: true,
      onFailure: true,
      onTimeout: true,
    },
  },
}); 