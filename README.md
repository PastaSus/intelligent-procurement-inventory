# Procurvin — Intelligent Procurement & Inventory

Procurvin is a lab asset management app for tracking laboratory rooms, computer
units, components, spare parts, purchase requests, and hardware/software reports.

## Documentation

- [Backup and restore guide](./docs/backup-and-restore.md) — in-app JSON backups,
  `pg_dump`/`pg_restore` for Neon, restore procedure, and scratch-database testing.
- [Database schema](./docs/SCHEMA.md)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Database and demo data

Procurvin requires `DATABASE_URL` (PostgreSQL). Apply migrations, then seed demo
data:

```bash
pnpm prisma migrate deploy
```

Seeding **deletes all existing lab data**, so it refuses to run unless you opt in
and provide the demo credentials explicitly:

```bash
ALLOW_SEED=true \
SEED_ADMIN_EMAIL="admin@example.com" \
SEED_ADMIN_PASSWORD="admin123" \
SEED_TECH_EMAIL="tech@example.com" \
SEED_TECH_PASSWORD="tech123" \
pnpm seed
```

| Variable              | Purpose                                             |
| --------------------- | --------------------------------------------------- |
| `ALLOW_SEED`          | Must be `true`; guards against accidental reseeding |
| `SEED_ADMIN_EMAIL`    | Email for the seeded administrator account          |
| `SEED_ADMIN_PASSWORD` | Password for the seeded administrator account       |
| `SEED_TECH_EMAIL`     | Email for the seeded technician account             |
| `SEED_TECH_PASSWORD`  | Password for the seeded technician account          |

Use throwaway demo credentials. The seed removes the legacy placeholder accounts
(`admin@example.com`, `staff@example.com`, `tech@example.com`) unless they match
the configured values, so reseeding does not leave duplicate accounts behind.

End-to-end tests sign in with `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`, which
default to `admin@example.com` / `admin123`. Set them to match your seed values.

For backup, restore, and the CLI restore script, see
[Backup and restore](./docs/backup-and-restore.md).


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
