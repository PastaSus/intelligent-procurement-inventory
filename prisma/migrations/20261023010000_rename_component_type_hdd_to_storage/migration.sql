DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'ComponentType' AND e.enumlabel = 'HDD'
  ) THEN
    EXECUTE 'ALTER TYPE "ComponentType" RENAME VALUE ''HDD'' TO ''STORAGE''';
  END IF;
END
$$;
