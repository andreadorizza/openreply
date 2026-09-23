-- AlterTable
ALTER TABLE "Automation" ADD COLUMN     "nextReelArmedAt" TIMESTAMP(3);

-- Campaigns already waiting were armed when they were created.
UPDATE "Automation" SET "nextReelArmedAt" = "createdAt" WHERE "pendingNextReel" = true;
