# Backup and Restore

Procurvin stores all lab data in a single PostgreSQL database. This guide covers
the two supported backup paths and how to restore them safely.

- [1. In-app JSON backup](#1-in-app-json-backup-admin-only)
- [2. Restore from a JSON backup](#2-restore-from-a-json-backup)
- [3. PostgreSQL logical backups (pg_dump / pg_restore)](#3-postgresql-logical-backups-pg_dump--pg_restore)
- [4. Backup schedule](#4-backup-schedule)
- [5. Restore procedure checklist](#5-restore-procedure-checklist)
- [6. Test restores on a scratch database](#6-test-restores-on-a-scratch-database)
- [7. Neon plan limits](#7-neon-plan-limits)

---

## 1. In-app JSON backup (admin only)

Signed-in administrators can download a complete copy of the lab data from
**Dashboard → Data Backup → Download Backup**. The request goes to
`GET /api/backup`, which requires an `ADMIN` session (technicians receive `403`).

The file is named `procurvin-backup-YYYY-MM-DD.json` and has this shape:

```json
{
  "app": "procurvin",
  "format_version": 1,
  "created_at": "2026-10-31T09:00:00.000Z",
  "counts": { "users": 3, "laboratoryRooms": 3, "...": 0 },
  "data": { "users": [], "laboratoryRooms": [], "...": [] }
}
```

### What it contains

Every row from the application tables, including **soft-deleted** records:

| Table key              | Prisma model          |
| ---------------------- | --------------------- |
| `users`                | `User`                |
| `laboratoryRooms`      | `LaboratoryRoom`      |
| `computerUnits`        | `ComputerUnit`        |
| `computerComponents`   | `ComputerComponent`   |
| `installedApplications`| `InstalledApplication`|
| `inventoryItems`       | `InventoryItem`       |
| `purchaseRequests`     | `PurchaseRequest`     |
| `requestItems`         | `RequestItem`         |

Dates are stored as ISO 8601 strings and `Decimal` values as strings so the
file round-trips losslessly through JSON.

### What it does not contain

- **Password reset tokens** (`PasswordResetToken`). They are short-lived and
  intentionally excluded; users simply request a new reset link after a restore.
- Any database-level objects: users/roles/grants, extensions, indexes, or the
  schema itself. Use `pg_dump` (section 3) if you need a full database copy.
- Any uploaded files. Procurvin currently stores no file attachments.

### Confidentiality

The file contains **user password hashes** and **software license keys**. It
must be treated as confidential:

- Store it on an encrypted disk or in a private, access-controlled location.
- Never email it, commit it, or upload it to a public/share link.
- Delete temporary copies you no longer need.

> The file is a plain JSON document with no encryption. If you need at-rest
> encryption, place it in an encrypted archive (for example
> `7z a -p backup.7z procurvin-backup-*.json`) or an encrypted drive.

---

## 2. Restore from a JSON backup

There is intentionally **no web UI for restore**; a restore is a destructive,
one-off operator action.

```bash
# Safe: validate the file and print row counts, no database connection
pnpm restore:backup ./procurvin-backup-2026-10-31.json --dry-run

# Real restore against the database in DATABASE_URL
DATABASE_URL="postgresql://.../scratch" pnpm restore:backup ./procurvin-backup-2026-10-31.json
```

Flags:

| Flag        | Effect                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| `--dry-run` | Validates the file and prints per-table counts. Writes nothing.        |
| `--yes`     | Skips the typed confirmation prompt. Intended for scripted restores.   |

Without `--yes` the script prints the **target database name and host** (never
the password) and asks you to type `RESTORE` before touching anything.

The restore:

1. Validates the JSON (`app`, `format_version`, every table, and every count).
2. Revives ISO dates into `Date` objects and decimal strings into `Prisma.Decimal`.
3. Deletes existing rows in reverse foreign-key order.
4. Inserts the backup rows in foreign-key-safe order (`users` → rooms → units →
   components → applications → inventory → purchase requests → request items).
5. Runs everything in **one transaction**: if anything fails, nothing changes.
6. Preserves ids, `created_at`, and `updated_at` so references stay valid.

> `DATABASE_URL` is loaded from the environment. If it is not set in your shell,
> the Prisma client falls back to `.env` — which points at the live database.
> Always pass an explicit `DATABASE_URL` when restoring, and check the host the
> script prints before confirming.

---

## 3. PostgreSQL logical backups (pg_dump / pg_restore)

The JSON backup is great for moving lab data between Procurvin instances, but a
native dump also captures the schema and database-level objects.

For Neon, use the **direct (non-pooled) connection string** shown in the Neon
console (the host without `-pooler`). Pooled connections are not suitable for
`pg_dump`/`pg_restore`.

```bash
# Create a compressed custom-format dump
pg_dump --format=custom --no-owner --no-privileges \
  --file="procurvin-$(date +%Y-%m-%d).dump" \
  "postgresql://USER:PASSWORD@ep-xxxx-direct.region.aws.neon.tech/neondb?sslmode=require"

# Inspect it
pg_restore --list "procurvin-2026-10-31.dump"

# Restore into an empty scratch database
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname="postgresql://USER:PASSWORD@ep-scratch-direct.region.aws.neon.tech/neondb?sslmode=require" \
  "procurvin-2026-10-31.dump"
```

Notes:

- Credentials are not stored in this repository. Export the connection string
  from the Neon console for the duration of the command, or use a password file
  (`PGPASSFILE`).
- `--format=custom` produces a single compressed file and allows selective
  restore with `pg_restore`.
- `--no-owner --no-privileges` avoids failures when the source and target roles
  differ (common with Neon branches).

---

## 4. Backup schedule

At minimum:

- **Weekly** (or **monthly** if the lab changes rarely) JSON backups from the
  Dashboard, plus
- **Before every update/deploy**, migration, or bulk data change.

Bulk-import days (new lab rooms, new batch of units) are a good moment for an
extra backup.

### Keep copies off the machine

A backup on the same laptop or in the same database project does not protect
against disk failure, theft, or account loss. Keep at least two copies:

1. One local copy on an encrypted drive.
2. One off-site copy (private cloud drive, university storage, or encrypted
   archive) that only authorised staff can access.

Label copies with the date and rotation (for example keep the last 8 weekly
backups and the most recent pre-update backup).

---

## 5. Restore procedure checklist

1. **Stop writes** — announce a maintenance window and sign out other users.
2. **Take a fresh backup of the current state** before replacing it.
3. **Choose the target** — a scratch database for testing, or production only
   for a real recovery.
4. **Dry run** the file: `pnpm restore:backup <file> --dry-run`.
5. **Check the target host** printed by the script. If it is not the database you
   intend to restore, stop.
6. **Restore** and let the transaction finish. Any error rolls everything back.
7. **Verify** counts against the file (the script prints them) and spot-check the
   app: log in, open rooms/units/inventory, open one purchase request.
8. **Record** what was restored, when, and by whom.

If you used `pg_restore`, run the app against the restored database and repeat
the same verification steps.

---

## 6. Test restores on a scratch database

**Never test a restore against production.** Use a Neon branch or a local
PostgreSQL instance:

1. Create a Neon branch (`scratch`) of the project, or start a local Postgres.
2. Copy its **direct** connection string.
3. Apply the schema:
   `DATABASE_URL="<scratch>" pnpm prisma migrate deploy`
4. Restore the backup with an explicit `DATABASE_URL`:
   `DATABASE_URL="<scratch>" pnpm restore:backup <file> --yes`
5. Compare row counts with the backup (`--dry-run` output) and the Dashboard.
6. Delete the scratch branch when finished.

Restoring to a scratch database is also the only way to prove that a backup file
is usable. Do it at least once per quarter.

---

## 7. Neon plan limits

Neon's Free plan keeps only **about 6 hours** of restore history
(point-in-time restore). That is useful for accidental deletes, but it is **not
a backup strategy**:

- It expires after ~6 hours.
- It disappears if the project itself is deleted or the account is lost.
- It does not protect against bad code that ran more than 6 hours ago.

Keep regular JSON and `pg_dump` backups regardless of the plan.
