# Commons Fabric Calendar: Back End

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local env file:

   ```bash
   cp .env.example .env
   ```

   `DATABASE_URL` defaults to a local SQLite file at `./dev.db` (relative to `backend/`) and should work out of the box.

3. Generate your auth secret and set the `SESSION_SECRET` in env. First, run:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   which outputs a 64-character string to the terminal. Copy the string to your clipboard and paste it into the local env file `./.env` at the `SESSION_SECRET` field.

4. Initialize the Prisma database:

   ```bash
   npm run db:migrate
   ```

   This applies all migrations in `prisma/migrations` to a PostgresSQL database (creating a `dev.db` file if it doesn't already exist) and regenerates the Prisma client. Re-run this command whenever you pull new migrations.

5. Generate the Prisma client:

   ```bash
   npm run db:generate
   ```

   Creates `src/generated` directories among others.

6. Populate the database with example data:

   ```bash
   npm run db:seed
   ```

7. Start the dev server:

   ```bash
   npm run dev
   ```

## Prisma scripts

- `npm run db:migrate` — create/apply migrations against your local dev database (use this during development when you change `prisma/schema.prisma`).
- `npm run db:deploy` — apply existing migrations without generating new ones (used in production/CI).
- `npm run db:generate` — regenerate the Prisma client from the schema without touching migrations.
- `npm run db:studio` — open Prisma Studio to browse/edit local data.
- `npm run db:seed` — populates dev database with data from `prisma/seed`.
