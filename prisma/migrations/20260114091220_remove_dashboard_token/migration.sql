-- Remove the index on dashboardToken first
DROP INDEX IF EXISTS "Participant_dashboardToken_idx";

-- Remove the dashboardToken column
ALTER TABLE "Participant" DROP COLUMN IF EXISTS "dashboardToken";

