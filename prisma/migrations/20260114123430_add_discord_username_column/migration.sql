-- Add discordUsername column to Participant table
-- First add as nullable with default to handle existing rows
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "discordUsername" TEXT;

-- Set default value for any existing rows
UPDATE "Participant" SET "discordUsername" = '' WHERE "discordUsername" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "Participant" ALTER COLUMN "discordUsername" SET NOT NULL;

