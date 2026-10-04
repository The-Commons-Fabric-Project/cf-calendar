/**
 * Asserts that the OpenAPI document is actually enforcing the request contract.
 *
 * The handlers trust the validator to have rejected anything the document
 * disallows, and that trust is only safe if something proves it is still mounted
 * and still refusing.
 *
 * Nothing here reaches the database - every request is rejected before a handler
 * queries it - so these need no seeded data. The happy path of POST /events is
 * therefore the one thing they cannot cover.
 */
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

let server: Server;
let base: string;
/** A Cookie header carrying a session for a user who need not exist - see sessionFor. */
let session: string;

before(async () => {
  // development turns response validation on, the stricter configuration.
  process.env.NODE_ENV ??= 'development';
  // `npm test` runs without --env-file, and signing has no default secret.
  process.env.SESSION_SECRET ??= 'test-secret-not-used-outside-this-process';

  const { createApp } = await import('../src/app.js');
  const { SESSION_COOKIE_NAME, signSessionToken } = await import('../src/utils/userSessions.js');

  // A genuine session, not a stub. The userId is never dereferenced - every test
  // using it is answered before the insert that would need the row.
  session = `${SESSION_COOKIE_NAME}=${signSessionToken({ userId: 1 })}`;

  server = createApp().listen(0); // port 0: let the OS pick, so tests never collide
  await once(server, 'listening');
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  // db/client.ts opens a pool at import time; without this the process hangs.
  const { prisma } = await import('../src/db/client.js');
  await prisma.$disconnect();
});

/**
 * A JSON POST, optionally signed in. The validator checks security first, so a
 * test targeting body validation must send a cookie to reach the rule under test.
 */
const json = (body: unknown, cookie?: string) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
  body: JSON.stringify(body),
});

const validEvent = {
  title: 'Repair Cafe',
  startsAt: '2026-09-01T17:00:00Z',
  endsAt: '2026-09-01T20:00:00Z',
};

/** Asserts the status and that the body is a problem+json document, and returns it. */
async function expectProblem(response: Response, status: number) {
  assert.equal(response.status, status);
  assert.equal(
    response.headers.get('content-type')?.split(';')[0],
    'application/problem+json',
    'errors must be problem+json - the document describes no other error media type',
  );

  const body = (await response.json()) as Record<string, unknown>;
  assert.equal(body.status, status, 'the status member must agree with the HTTP status');
  assert.equal(typeof body.title, 'string');
  assert.equal(typeof body.detail, 'string');
  return body;
}

test('a path parameter of the wrong type is rejected', async () => {
  const body = await expectProblem(await fetch(`${base}/v1/events/abc`), 400);
  assert.match(String(body.detail), /eventId/);
});

test('the calendar routes validate their parameters', async () => {
  const single = await expectProblem(await fetch(`${base}/v1/events/abc/calendar.ics`), 400);
  assert.match(String(single.detail), /eventId/);

  const feed = await expectProblem(await fetch(`${base}/v1/calendar.ics?organizationId=abc`), 400);
  assert.match(String(feed.detail), /organizationId/);
});

test('a server-assigned field cannot be smuggled into a create', async () => {
  // If unevaluatedProperties regresses, a client can choose who owns its event.
  const response = await fetch(`${base}/v1/events`, json({ ...validEvent, ownerId: 9 }, session));
  const body = await expectProblem(response, 400);
  assert.match(String(body.detail), /unevaluated properties/i);

  const errors = body.errors as { pointer: string }[];
  assert.ok(Array.isArray(errors) && errors.length > 0, 'field-level failures carry an errors array');
  assert.equal(errors[0]!.pointer, '/body/ownerId', 'the pointer names the offending field');
});

test('an undeclared query parameter is rejected', async () => {
  const body = await expectProblem(await fetch(`${base}/v1/events?bogus=1`), 400);
  assert.match(String(body.detail), /bogus/);
});

test('a timestamp with unencoded colons is accepted', async () => {
  // Without allowReserved the colons in an RFC 3339 timestamp are a 400 on their
  // own. Both windows are inverted on purpose, so the assertion is about which
  // 400 comes back - the handler's - rather than whether one does.
  const window = (start: string, end: string) => `${base}/v1/events?startDate=${start}&endDate=${end}`;

  const raw = await expectProblem(await fetch(window('2026-12-01T00:00:00Z', '2026-08-01T00:00:00Z')), 400);
  assert.match(String(raw.detail), /endDate must be later/, 'a raw colon must reach the handler, not be refused as unencoded');

  // Percent-encoded values must keep working - allowReserved permits, it does not require.
  const encoded = await expectProblem(
    await fetch(window(encodeURIComponent('2026-12-01T00:00:00Z'), encodeURIComponent('2026-08-01T00:00:00Z'))),
    400,
  );
  assert.match(String(encoded.detail), /endDate must be later/);
});

test('a path outside the document is a problem+json 404', async () => {
  await expectProblem(await fetch(`${base}/v1/nope`), 404);
});

test('a method the document does not describe is a 405', async () => {
  await expectProblem(await fetch(`${base}/v1/events`, { method: 'DELETE' }), 405);
});

test('a request body that is not JSON is a 415', async () => {
  const response = await fetch(`${base}/v1/events`, {
    method: 'POST',
    headers: { 'content-type': 'text/plain', cookie: session },
    body: 'hi',
  });
  await expectProblem(response, 415);
});

test('a create with no session cookie is refused by the document', async () => {
  // The outer auth layer: cookieAuth, which only asks whether a cookie is there.
  const body = await expectProblem(await fetch(`${base}/v1/events`, json(validEvent)), 401);
  assert.match(String(body.detail), /cookie/i);
});

test('a create with a forged session is refused by the handler', async () => {
  // The inner layer: the name satisfies the document, then requireAuth rejects the
  // signature. Failing differently from the test above is the point.
  const response = await fetch(`${base}/v1/events`, json(validEvent, 'session=not.a.real.token'));
  const body = await expectProblem(response, 401);
  assert.match(String(body.detail), /invalid or has expired/i);
});

test('the auth gate runs ahead of body validation', async () => {
  // Security is checked before the body, so an anonymous caller cannot use
  // validation errors to probe the schema.
  const body = await expectProblem(await fetch(`${base}/v1/events`, json({ ...validEvent, ownerId: 9 })), 401);
  assert.doesNotMatch(String(body.detail), /ownerId|unevaluated/i, 'an unauthenticated 401 must not describe the body');
});

test('a create whose interval is inverted is refused', async () => {
  // endsAt <= startsAt is the rule JSON Schema cannot express, so it is the one the
  // handler still owns. Reaching it proves the session above was accepted.
  const response = await fetch(
    `${base}/v1/events`,
    json({ ...validEvent, startsAt: '2026-09-01T20:00:00Z', endsAt: '2026-09-01T17:00:00Z' }, session),
  );
  const body = await expectProblem(response, 400);

  const errors = body.errors as { pointer: string }[];
  assert.equal(errors[0]!.pointer, '/body/endsAt', 'the pointer names the offending field');
});

test('an inverted query window is refused', async () => {
  // The query-window rule, which constrains the parameters rather than the event.
  const body = await expectProblem(
    await fetch(`${base}/v1/events?startDate=2026-12-01T00:00:00Z&endDate=2026-08-01T00:00:00Z`),
    400,
  );
  assert.match(String(body.detail), /endDate must be later/);

  const errors = body.errors as { pointer: string }[];
  assert.equal(errors[0]!.pointer, '/query/endDate', 'the pointer names the offending parameter');
});
