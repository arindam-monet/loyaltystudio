import { TriggerClient } from "@trigger.dev/sdk/v3";
import { env } from "../config/env.js";
import { pointsExpirationJob } from "./points-expiration.js";

// Initialize the Trigger.dev client
export const triggerClient = new TriggerClient({
  id: "loyalty-studio-api",
  apiKey: env.TRIGGER_API_KEY,
  apiUrl: env.TRIGGER_API_URL,
});

// Register all jobs
export function registerJobs() {
  // Register the points expiration job
  triggerClient.defineJob(pointsExpirationJob);

  // Schedule the points expiration job to run daily at midnight
  triggerClient.defineSchedule({
    id: "daily-points-expiration",
    schedule: {
      type: "cron",
      cron: "0 0 * * *", // Run daily at midnight
    },
    endpoint: pointsExpirationJob.id,
    payload: {},
  });

  console.log("Trigger.dev jobs registered");
}
