-- Adds events.uid, the event's iCalendar UID (see src/utils/ical.ts).
--
-- RFC 7986 5.3 updates RFC 5545: a UID MUST NOT identify a user, host or domain,
-- and SHOULD be a random v4 UUID. It must also never change for the life of the
-- event, or subscribed calendars show a duplicate. So it is stored rather than
-- derived from the id, which a reset reuses for an unrelated event.
--
-- New rows get theirs from Prisma (@default(uuid(4)) generates it client-side,
-- so there is no SQL default). Existing rows are backfilled below with a v4 UUID
-- built from randomblob: version nibble 4, variant nibble one of 8/9/a/b.
--
-- The table is rebuilt for the same reason as in 20260806120000_restore_event_end_time:
-- ALTER TABLE ADD COLUMN cannot add a NOT NULL column without a constant default.
-- Every other column, default, CHECK and foreign key is carried across unchanged.

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- RedefineTables
CREATE TABLE "new_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uid" TEXT NOT NULL,
    "title" TEXT NOT NULL CHECK (length(trim("title")) > 0),
    "owner_id" INTEGER NOT NULL,
    "starts_at" DATETIME NOT NULL,
    "ends_at" DATETIME NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "thumbnail" TEXT,
    "registration_link" TEXT,
    "volunteer_contact" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ("ends_at" > "starts_at"),
    CHECK ("volunteer_contact" IS NULL OR (
        length("volunteer_contact") - length(replace("volunteer_contact", '@', '')) = 1
        AND instr("volunteer_contact", ' ') = 0
        AND instr("volunteer_contact", char(9)) = 0
        AND instr("volunteer_contact", char(10)) = 0
        AND instr("volunteer_contact", char(13)) = 0
        AND instr("volunteer_contact", '@') > 1
        AND instr(substr("volunteer_contact", instr("volunteer_contact", '@') + 1), '.') > 1
        AND substr("volunteer_contact", length("volunteer_contact"), 1) <> '.'
    )),
    CHECK ("registration_link" IS NULL OR (
        ("registration_link" LIKE 'http://%' OR "registration_link" LIKE 'https://%')
        AND instr("registration_link", ' ') = 0
        AND instr("registration_link", char(9)) = 0
        AND instr("registration_link", char(10)) = 0
        AND instr("registration_link", char(13)) = 0
        AND length(substr("registration_link", CASE WHEN "registration_link" LIKE 'https://%' THEN 9 ELSE 8 END)) >= 2
        AND instr('/$.?#', substr("registration_link", CASE WHEN "registration_link" LIKE 'https://%' THEN 9 ELSE 8 END, 1)) = 0
    )),
    CONSTRAINT "events_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_events" ("id", "uid", "title", "owner_id", "starts_at", "ends_at", "location", "description", "thumbnail", "registration_link", "volunteer_contact", "created_at")
    SELECT
        "id",
        lower(hex(randomblob(4))) || '-' ||
            lower(hex(randomblob(2))) || '-' ||
            '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
            substr('89ab', 1 + (abs(random()) % 4), 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
            lower(hex(randomblob(6))),
        "title",
        "owner_id",
        "starts_at",
        "ends_at",
        "location",
        "description",
        "thumbnail",
        "registration_link",
        "volunteer_contact",
        "created_at"
    FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
CREATE UNIQUE INDEX "events_uid_key" ON "events"("uid");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
