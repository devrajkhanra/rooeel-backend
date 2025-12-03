-- Add firstName and lastName columns to Admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Admin' AND column_name = 'firstName'
  ) THEN
    ALTER TABLE "Admin" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Admin' AND column_name = 'lastName'
  ) THEN
    ALTER TABLE "Admin" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Drop name and role columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Admin' AND column_name = 'name'
  ) THEN
    ALTER TABLE "Admin" DROP COLUMN "name";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Admin' AND column_name = 'role'
  ) THEN
    ALTER TABLE "Admin" DROP COLUMN "role";
  END IF;
END $$;
