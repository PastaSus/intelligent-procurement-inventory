-- Rename the HDD component type to STORAGE without rewriting existing rows.
ALTER TYPE "ComponentType" RENAME VALUE 'HDD' TO 'STORAGE';
