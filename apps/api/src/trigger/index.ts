import { pointsExpirationJob } from "./points-expiration.js";
import { rewardRedemptionJob } from "./reward-redemption.js";

// Register all jobs
export function registerJobs() {
  console.log("Registering Trigger.dev jobs...");
  
  // The jobs are already defined in their respective files using schemaTask
  // We don't need to register them again, just log that they're available
  
  console.log(`Registered job: ${pointsExpirationJob.id}`);
  console.log(`Registered job: ${rewardRedemptionJob.id}`);
  
  console.log("Trigger.dev jobs registered successfully");
}
