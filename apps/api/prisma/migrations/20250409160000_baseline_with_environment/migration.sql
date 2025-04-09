-- This is a baseline migration that ensures the environment field exists in the ApiKey table
-- It's designed to be idempotent, so it can be run multiple times without error

-- First, check if the ApiKey table exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'ApiKey'
    ) THEN
        -- Check if the environment column already exists
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
    END IF;
END $$;
