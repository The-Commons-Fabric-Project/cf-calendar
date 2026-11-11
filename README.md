# The Commons Fabric Calendar
A shared calendar app for various organizations in a community hub to plan and coordinate events.

## Directory Structure
- `backend` - code to build/run backend
- `frontend` - code to build/run frontend
- `design` - UX design artifacts, code files here are NOT to be used in app
- `docs` - documentation
- `packages` - npm workspaces

## Branches (Active)
- `dev` for developing actual code
- `docs` for adding/editing documentation
- Nothing on `main` yet!

## Installation and Setup (Whole Repo)

To install subrepos separately, follow the setup instructions in their own READMEs. To install all packages:

1. First, make sure the following dependencies are installed and up-to-date.
   - Node.js and NPM: [installation instructions](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
   - Docker: [installation instructions](https://docs.docker.com/get-started/get-docker/)

2. Install NPM dependencies:

  ```bash
    npm install
  ```
3. Set up your development environment. First, navigate to the `backend` subrepo:

  ``` bash
    cd backend
  ```
  From this point, these instructions are exactly the same as the [backend setup instructions steps 2-6](./backend/README.md#setup).

  Create your local env file:

   ```bash
    cp .env.example .env
   ```

   `DATABASE_URL` should already be filled in with a `postgres://` address.

4. Generate your auth secret and set the `SESSION_SECRET` in `.env`. First, run:

   ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   which outputs a 64-character string to the terminal. Copy the string to your clipboard and paste it into the local env file `./.env` at the `SESSION_SECRET` field.

5. Initialize the Prisma database:

   ```bash
   npm run db:migrate
   ```

   This applies all migrations in `prisma/migrations` to a PostgresSQL database (creating a `dev.db` file if it doesn't already exist) and regenerates the Prisma client. Re-run this command whenever you pull new migrations.

6. Generate the Prisma client:

   ```bash
   npm run db:generate
   ```

   Creates `src/generated` directories among others.

7. Populate the database with example data:

   ```bash
   npm run db:seed
   ```

## Building and Running the App

To build and run everything:

  ```bash
 docker compose --profile app up --build
  ```

To run just the database backend:

  ```bash
   docker compose up -d
  ```

To stop the database:

  ```bash
   docker compose down
  ```

## To do:

- MORE DOCUMENTATION
- update (and verify) installation instructions for Docker after postgres migration
- guidelines for monorepo structure, any future subfolders?
- AI policy -- link to doc
