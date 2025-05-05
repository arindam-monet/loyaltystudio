-- Add isExpired field to PointsTransaction if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'PointsTransaction' 
        AND column_name = 'isExpired'
    ) THEN
        ALTER TABLE "PointsTransaction" ADD COLUMN "isExpired" BOOLEAN NOT NULL DEFAULT false;
        CREATE INDEX "PointsTransaction_isExpired_idx" ON "PointsTransaction"("isExpired");
    END IF;
END $$;

-- Add loyaltyProgramId field to PointsTransaction if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'PointsTransaction' 
        AND column_name = 'loyaltyProgramId'
    ) THEN
        ALTER TABLE "PointsTransaction" ADD COLUMN "loyaltyProgramId" TEXT;
        CREATE INDEX "PointsTransaction_loyaltyProgramId_idx" ON "PointsTransaction"("loyaltyProgramId");
        
        -- Add foreign key constraint if LoyaltyProgram table exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = 'LoyaltyProgram'
        ) THEN
            ALTER TABLE "PointsTransaction" 
            ADD CONSTRAINT "PointsTransaction_loyaltyProgramId_fkey" 
            FOREIGN KEY ("loyaltyProgramId") 
            REFERENCES "LoyaltyProgram"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;
