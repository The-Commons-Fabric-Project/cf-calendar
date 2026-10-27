# Production image: the backend serving the built frontend. Used by the `app`
# service in docker-compose.yml.

FROM node:22-bookworm-slim AS build
WORKDIR /app

# Manifests first, so dependency installs are cached until one changes.
COPY package.json package-lock.json ./
COPY packages/ packages/
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN npm ci

COPY frontend/ frontend/
COPY backend/ backend/
RUN npm run db:generate -w backend \
 && npm run build -w backend \
 && npm run build -w frontend

FROM node:22-bookworm-slim
# Prisma's migration engine links against OpenSSL.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copied whole rather than file by file: workspaces can hold their own
# node_modules when versions conflict, and devDependencies are kept because
# `prisma migrate deploy` needs the prisma CLI and the dotenv that
# prisma.config.ts imports.
COPY --from=build /app ./

WORKDIR /app/backend
ENV NODE_ENV=production
EXPOSE 3000

# Not `npm start`: its --env-file=.env fails when no .env exists, and compose
# supplies the environment directly.
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/main.js"]
