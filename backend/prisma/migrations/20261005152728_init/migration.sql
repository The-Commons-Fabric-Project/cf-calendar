-- Postgres baseline, replacing the SQLite migration history. Prisma generates
-- everything down to the foreign keys; the CHECKs below are added by hand because
-- Prisma cannot express them, and are taken verbatim from src/docs/db/schema.dbml.

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "fullname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "uid" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "thumbnail" TEXT,
    "registration_link" TEXT,
    "volunteer_contact" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "blurb" TEXT,
    "contact" TEXT,
    "website" TEXT,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations_tags" (
    "organization_id" INTEGER NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "organizations_tags_pkey" PRIMARY KEY ("organization_id","tag")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "events_uid_key" ON "events"("uid");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations_tags" ADD CONSTRAINT "organizations_tags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraints
ALTER TABLE "users"
    ADD CONSTRAINT "users_fullname_check" CHECK (length(trim("fullname")) > 0),
    ADD CONSTRAINT "users_email_check" CHECK ("email" ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    ADD CONSTRAINT "users_password_hash_check" CHECK (length("password_hash") > 0);

ALTER TABLE "events"
    ADD CONSTRAINT "events_title_check" CHECK (length(trim("title")) > 0),
    ADD CONSTRAINT "events_ends_after_starts_check" CHECK ("ends_at" > "starts_at"),
    ADD CONSTRAINT "events_registration_link_check" CHECK ("registration_link" IS NULL OR "registration_link" ~* '^https?://[^\s/$.?#].[^\s]*$'),
    ADD CONSTRAINT "events_volunteer_contact_check" CHECK ("volunteer_contact" IS NULL OR "volunteer_contact" ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

ALTER TABLE "organizations"
    ADD CONSTRAINT "organizations_name_check" CHECK (length(trim("name")) > 0),
    ADD CONSTRAINT "organizations_contact_check" CHECK ("contact" IS NULL OR "contact" ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    ADD CONSTRAINT "organizations_website_check" CHECK ("website" IS NULL OR "website" ~* '^https?://[^\s/$.?#].[^\s]*$');

-- Mirrors the org_tags enum in the DBML; see the note at the top of schema.prisma.
ALTER TABLE "organizations_tags"
    ADD CONSTRAINT "organizations_tags_tag_check" CHECK ("tag" IN (
        'Advocacy', 'Civic', 'Community', 'Culture', 'Education', 'Equity',
        'Indigenous', 'Makers', 'Policy', 'Research', 'Seniors', 'Settlement',
        'Tech', 'Volunteer', 'Youth'
    ));
