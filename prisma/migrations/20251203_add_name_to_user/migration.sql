-- Add firstName and lastName columns to User
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'firstName'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'lastName'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Drop name column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'name'
  ) THEN
    ALTER TABLE "User" DROP COLUMN "name";
  END IF;
END $$;
