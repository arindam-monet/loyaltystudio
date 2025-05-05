import { handlePointsExpiration } from "../trigger/points-expiration.js";

async function main() {
  try {
    console.log("Testing points expiration job...");
    
    // Get program ID from command line arguments if provided
    const programId = process.argv[2];
    
    if (programId) {
      console.log(`Running points expiration for program ID: ${programId}`);
    } else {
      console.log("Running points expiration for all programs");
    }
    
    const result = await handlePointsExpiration(programId);
    console.log("Points expiration job completed:", result);
  } catch (error) {
    console.error("Error running points expiration job:", error);
    process.exit(1);
  }
}

main();
