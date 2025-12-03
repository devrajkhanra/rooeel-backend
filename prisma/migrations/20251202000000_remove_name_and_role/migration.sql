-- Add name column to Admin (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Admin' AND column_name = 'name'
  ) THEN
    ALTER TABLE "Admin" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';
    UPDATE "Admin" SET "name" = email WHERE "name" = '';
  END IF;
END $$;

-- Drop role column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Admin' AND column_name = 'role'
  ) THEN
    ALTER TABLE "Admin" DROP COLUMN "role";
  END IF;
END $$;
