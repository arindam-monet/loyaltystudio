-- Step 1: Add new columns to ProgramMember
ALTER TABLE "ProgramMember" ADD COLUMN "email" TEXT;
ALTER TABLE "ProgramMember" ADD COLUMN "name" TEXT;
ALTER TABLE "ProgramMember" ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "ProgramMember" ADD COLUMN "externalId" TEXT;

-- Step 2: Update the PointsTransaction table
ALTER TABLE "PointsTransaction" ADD COLUMN "programMemberId" TEXT;
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_programMemberId_fkey" FOREIGN KEY ("programMemberId") REFERENCES "ProgramMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 3: Update the RewardRedemption table
ALTER TABLE "RewardRedemption" ADD COLUMN "programMemberId" TEXT;
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_programMemberId_fkey" FOREIGN KEY ("programMemberId") REFERENCES "ProgramMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 4: Create indexes
CREATE INDEX "ProgramMember_email_idx" ON "ProgramMember"("email");
CREATE INDEX "PointsTransaction_programMemberId_idx" ON "PointsTransaction"("programMemberId");
CREATE INDEX "RewardRedemption_programMemberId_idx" ON "RewardRedemption"("programMemberId");

-- Step 5: Make userId optional in ProgramMember
ALTER TABLE "ProgramMember" ALTER COLUMN "userId" DROP NOT NULL;
