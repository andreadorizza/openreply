-- A campaign can listen on several chosen posts. Each one becomes a row of its
-- own, so it keeps its own permalink.
CREATE TABLE "AutomationPost" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "postUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AutomationPost_postId_idx" ON "AutomationPost"("postId");
CREATE UNIQUE INDEX "AutomationPost_automationId_postId_key" ON "AutomationPost"("automationId", "postId");

ALTER TABLE "AutomationPost" ADD CONSTRAINT "AutomationPost_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Every campaign bound to a post keeps it, as its first and only post.
INSERT INTO "AutomationPost" ("id", "automationId", "postId", "postUrl", "createdAt")
SELECT gen_random_uuid()::text, "id", "postId", "postUrl", "createdAt"
FROM "Automation"
WHERE "postId" IS NOT NULL;

DROP INDEX "Automation_postId_idx";
ALTER TABLE "Automation" DROP COLUMN "postId",
DROP COLUMN "postUrl";

-- Which campaign post a comment belonged to. Older rows stay null: a campaign
-- may have changed posts since, so their post cannot be known for sure.
ALTER TABLE "DmLog" ADD COLUMN "postId" TEXT;
