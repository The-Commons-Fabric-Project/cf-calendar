/**
 * Development-only seed for the dev database. AI generated and unreviewed.
 *
 * Loads dev-organizations-seed.json, validates it, then wipes and repopulates
 * organizations, organizations_tags, users and events. Validation mirrors the
 * database's CHECKs, so a malformed fixture is reported in full before anything is
 * written rather than failing on the first rejected row.
 *
 * Fixture ids are local cross-references only and are never written: the database
 * assigns every primary key, and each fixture id is mapped to the row created for
 * it. Writing explicit ids leaves Postgres' sequences behind, so the next insert
 * from the API would collide with a seeded row.
 *
 * Usage (from backend/):
 *   npm run db:seed                 wipe and reseed
 *   npm run db:seed -- --dry-run    validate the fixture only, leave the DB alone
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../src/generated/prisma/client.js';
import { EMAIL_RE, URL_RE } from '../../src/utils/constraints.js';
import { ORG_TAGS, isOrgTag, type OrgTag } from '../../src/utils/orgTags.js';
import { hashPassword } from '../../src/utils/encryption.js';

const SEED_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dev-organizations-seed.json');

interface SeedOrganization {
  id: number;
  name: string;
  logo: string | null;
  blurb: string | null;
  contact: string | null;
  website: string | null;
  tags: OrgTag[];
}

interface SeedUser {
  id: number;
  fullname: string;
  email: string;
  devPassword?: string;
  organizationId: number;
}

interface SeedEvent {
  id: number;
  title: string;
  ownerId: number;
  startsAt: string;
  endsAt: string;
  location: string | null;
  description: string | null;
  thumbnail: string | null;
  registrationLink: string | null;
  volunteerContact: string | null;
}

interface SeedFile {
  defaultDevPassword?: string;
  organizations: SeedOrganization[];
  users: SeedUser[];
  events: SeedEvent[];
}

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isOptionalString = (v: unknown): v is string | null | undefined =>
  v === null || v === undefined || typeof v === 'string';

/**
 * Checks every fixture row against the schema's constraints. An empty list means the
 * parsed JSON is a valid SeedFile; all problems are collected rather than thrown on
 * the first, so one run reports everything.
 */
function validate(raw: unknown): string[] {
  const problems: string[] = [];
  const file = (raw ?? {}) as Record<string, unknown>;

  for (const key of ['organizations', 'users', 'events']) {
    if (!Array.isArray(file[key])) problems.push(`"${key}" must be an array`);
  }
  if (problems.length > 0) return problems;

  const organizations = file.organizations as Record<string, unknown>[];
  const users = file.users as Record<string, unknown>[];
  const events = file.events as Record<string, unknown>[];
  const defaultPassword = file.defaultDevPassword;

  const orgIds = new Set<number>();
  organizations.forEach((org, i) => {
    const at = `organizations[${i}]`;
    if (typeof org.id !== 'number') {
      problems.push(`${at}: id must be a number`);
    } else if (orgIds.has(org.id)) {
      problems.push(`${at}: duplicate id ${org.id}`);
    } else {
      orgIds.add(org.id);
    }

    if (!isNonEmptyString(org.name)) problems.push(`${at}: name must be a non-empty string`);
    if (!isOptionalString(org.logo)) problems.push(`${at}: logo must be a string or null`);
    if (!isOptionalString(org.blurb)) problems.push(`${at}: blurb must be a string or null`);

    if (!isOptionalString(org.contact)) {
      problems.push(`${at}: contact must be a string or null`);
    } else if (org.contact != null && !EMAIL_RE.test(org.contact)) {
      problems.push(`${at}: contact "${org.contact}" is not a valid email address`);
    }

    if (!isOptionalString(org.website)) {
      problems.push(`${at}: website must be a string or null`);
    } else if (org.website != null && !URL_RE.test(org.website)) {
      problems.push(`${at}: website "${org.website}" must be an http:// or https:// URL`);
    }

    if (!Array.isArray(org.tags)) {
      problems.push(`${at}: tags must be an array`);
    } else {
      const seenTags = new Set<unknown>();
      for (const tag of org.tags) {
        if (!isOrgTag(tag)) {
          problems.push(`${at}: unknown tag ${JSON.stringify(tag)} (allowed: ${ORG_TAGS.join(', ')})`);
        } else if (seenTags.has(tag)) {
          // organizations_tags is keyed on (organization_id, tag) - a repeat is a
          // primary key collision.
          problems.push(`${at}: tag "${tag}" listed more than once`);
        }
        seenTags.add(tag);
      }
    }
  });

  const userIds = new Set<number>();
  const emails = new Set<string>();
  users.forEach((user, i) => {
    const at = `users[${i}]`;
    if (typeof user.id !== 'number') {
      problems.push(`${at}: id must be a number`);
    } else if (userIds.has(user.id)) {
      problems.push(`${at}: duplicate id ${user.id}`);
    } else {
      userIds.add(user.id);
    }

    if (!isNonEmptyString(user.fullname)) problems.push(`${at}: fullname must be a non-empty string`);

    if (typeof user.email !== 'string' || !EMAIL_RE.test(user.email)) {
      problems.push(`${at}: email ${JSON.stringify(user.email)} is not a valid email address`);
    } else {
      // users.email is UNIQUE and Postgres compares case-sensitively, but two casings
      // of one address are the same account to any auth layer.
      const key = user.email.toLowerCase();
      if (emails.has(key)) problems.push(`${at}: duplicate email "${user.email}"`);
      emails.add(key);
    }

    if (!isNonEmptyString(user.devPassword ?? defaultPassword)) {
      problems.push(`${at}: needs a devPassword, or a top-level defaultDevPassword to fall back on`);
    }

    if (typeof user.organizationId !== 'number') {
      problems.push(`${at}: organizationId must be a number`);
    } else if (!orgIds.has(user.organizationId)) {
      problems.push(`${at}: organizationId ${user.organizationId} does not match any organization in this file`);
    }
  });

  const eventIds = new Set<number>();
  events.forEach((event, i) => {
    const at = `events[${i}]`;
    if (typeof event.id !== 'number') {
      problems.push(`${at}: id must be a number`);
    } else if (eventIds.has(event.id)) {
      problems.push(`${at}: duplicate id ${event.id}`);
    } else {
      eventIds.add(event.id);
    }

    if (!isNonEmptyString(event.title)) problems.push(`${at}: title must be a non-empty string`);

    if (typeof event.ownerId !== 'number') {
      problems.push(`${at}: ownerId must be a number`);
    } else if (!userIds.has(event.ownerId)) {
      problems.push(`${at}: ownerId ${event.ownerId} does not match any user in this file`);
    }

    const startsAt = typeof event.startsAt === 'string' ? new Date(event.startsAt) : null;
    const endsAt = typeof event.endsAt === 'string' ? new Date(event.endsAt) : null;
    if (!startsAt || Number.isNaN(startsAt.getTime())) {
      problems.push(`${at}: startsAt ${JSON.stringify(event.startsAt)} is not an ISO 8601 datetime`);
    }
    if (!endsAt || Number.isNaN(endsAt.getTime())) {
      problems.push(`${at}: endsAt ${JSON.stringify(event.endsAt)} is not an ISO 8601 datetime`);
    }
    if (startsAt && endsAt && !Number.isNaN(startsAt.getTime()) && !Number.isNaN(endsAt.getTime())) {
      if (endsAt <= startsAt) problems.push(`${at}: endsAt must be after startsAt`);
    }

    for (const field of ['location', 'description', 'thumbnail'] as const) {
      if (!isOptionalString(event[field])) problems.push(`${at}: ${field} must be a string or null`);
    }

    if (!isOptionalString(event.registrationLink)) {
      problems.push(`${at}: registrationLink must be a string or null`);
    } else if (event.registrationLink != null && !URL_RE.test(event.registrationLink)) {
      problems.push(`${at}: registrationLink "${event.registrationLink}" must be an http:// or https:// URL`);
    }

    if (!isOptionalString(event.volunteerContact)) {
      problems.push(`${at}: volunteerContact must be a string or null`);
    } else if (event.volunteerContact != null && !EMAIL_RE.test(event.volunteerContact)) {
      problems.push(`${at}: volunteerContact "${event.volunteerContact}" is not a valid email address`);
    }
  });

  return problems;
}

/**
 * Hashes each user's plaintext devPassword via the shared hashPassword helper.
 *
 * Hashed per user even on a shared plaintext, since argon2 salts per call and
 * identical digests would misrepresent production. Run concurrently.
 */
async function hashPasswords(users: SeedUser[], defaultPassword?: string): Promise<Map<number, string>> {
  const digests = await Promise.all(
    users.map((user) => {
      const plaintext = user.devPassword ?? defaultPassword;
      if (plaintext === undefined) throw new Error(`user ${user.id} has no password to hash`); // validate() already guarantees this
      return hashPassword(plaintext);
    }),
  );

  return new Map(users.map((user, i) => [user.id, digests[i]!]));
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  // This script deletes every row in four tables.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('refusing to run: NODE_ENV is "production" and this seed wipes existing data');
  }

  const raw: unknown = JSON.parse(await readFile(SEED_FILE, 'utf8'));
  const problems = validate(raw);
  if (problems.length > 0) {
    console.error(`${path.basename(SEED_FILE)} has ${problems.length} problem(s):`);
    for (const problem of problems) console.error(`  - ${problem}`);
    throw new Error('seed data is invalid; nothing was written');
  }

  const { organizations, users, events, defaultDevPassword } = raw as SeedFile;
  console.log(
    `${path.basename(SEED_FILE)} is valid: ${organizations.length} organizations, ${users.length} users, ${events.length} events.`,
  );

  if (dryRun) {
    console.log('--dry-run: database left untouched.');
    return;
  }

  // Not src/db/client.ts, which logs every query and would bury this output. A
  // one-shot process, so the single-client rule does not apply.
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: ['warn', 'error'],
  });

  const passwords = await hashPasswords(users, defaultDevPassword);

  try {
    await prisma.$transaction(async (tx) => {
      // Delete children before parents: events -> users, organizations_tags -> users -> organizations.
      await tx.event.deleteMany();
      await tx.organizationTag.deleteMany();
      await tx.user.deleteMany();
      await tx.organization.deleteMany();

      const orgIds = new Map<number, number>();
      for (const org of organizations) {
        const row = await tx.organization.create({
          data: {
            name: org.name,
            logo: org.logo,
            blurb: org.blurb,
            contact: org.contact,
            website: org.website,
            tags: { create: org.tags.map((tag) => ({ tag })) },
          },
          select: { id: true },
        });
        orgIds.set(org.id, row.id);
      }

      const userIds = new Map<number, number>();
      for (const user of users) {
        const row = await tx.user.create({
          data: {
            fullname: user.fullname,
            email: user.email,
            passwordHash: passwords.get(user.id)!,
            organizationId: orgIds.get(user.organizationId)!,
          },
          select: { id: true },
        });
        userIds.set(user.id, row.id);
      }

      await tx.event.createMany({
        data: events.map((event) => ({
          title: event.title,
          ownerId: userIds.get(event.ownerId)!,
          startsAt: new Date(event.startsAt),
          endsAt: new Date(event.endsAt),
          location: event.location,
          description: event.description,
          thumbnail: event.thumbnail,
          registrationLink: event.registrationLink,
          volunteerContact: event.volunteerContact,
        })),
      });
    });

    const tagCount = await prisma.organizationTag.count();
    console.log(
      `Seeded ${organizations.length} organizations (${tagCount} tags), ${users.length} users and ${events.length} events.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

try {
  await main();
} catch (err) {
  console.error(err instanceof Error ? `Seed failed: ${err.message}` : err);
  process.exitCode = 1;
}
