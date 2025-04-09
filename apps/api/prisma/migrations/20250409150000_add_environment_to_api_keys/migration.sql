-- This migration adds the environment field to the ApiKey table
-- It's included here for reference, but the field has already been added to the database
-- using a direct SQL query

-- Check if the environment column already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ApiKey' 
        AND column_name = 'environment'
    ) THEN
        -- Add environment field to ApiKey table
        ALTER TABLE "ApiKey" ADD COLUMN "environment" TEXT NOT NULL DEFAULT 'test';
        
        -- Create index for faster queries
        CREATE INDEX "ApiKey_environment_idx" ON "ApiKey"("environment");
    END IF;
END $$;
