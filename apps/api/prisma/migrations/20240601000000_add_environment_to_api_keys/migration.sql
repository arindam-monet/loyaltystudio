-- Add environment field to ApiKey table
ALTER TABLE "ApiKey" ADD COLUMN "environment" TEXT NOT NULL DEFAULT 'test';

-- Create index for faster queries
CREATE INDEX "ApiKey_environment_idx" ON "ApiKey"("environment");
