-- Add name column to User if table already exists but column doesn't
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'User'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'name'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';
    UPDATE "User" SET "name" = email WHERE "name" = '';
  END IF;
END $$;
