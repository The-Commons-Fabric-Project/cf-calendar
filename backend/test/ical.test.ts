/**
 * The iCalendar serializer, without the database or the HTTP layer. What matters
 * is what a calendar app will do with the output: a UID that drifts duplicates
 * every event, and an unescaped comma or an unfolded line breaks the import.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { toCalendar, type CalendarEvent } from '../src/utils/ical.js';

const UID = '3b241101-e2bb-4255-8caf-4136c566a962';

const event = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  uid: UID,
  title: 'Repair Cafe',
  startsAt: new Date('2026-10-03T14:00:00-04:00'),
  endsAt: new Date('2026-10-03T17:00:00-04:00'),
  location: null,
  description: null,
  registrationLink: null,
  volunteerContact: null,
  createdAt: new Date('2026-09-01T12:00:00Z'),
  organization: { name: 'Makers Guild', contact: null },
  ...overrides,
});

const NAME = 'Test';

/** The logical lines, with RFC 5545 folding undone. */
const unfold = (ics: string) => ics.replace(/\r\n[ \t]/g, '').split('\r\n');

const property = (ics: string, name: string) =>
  unfold(ics).find((line) => line.startsWith(`${name}:`) || line.startsWith(`${name};`));

test('every line ends in CRLF', () => {
  const ics = toCalendar([event()], NAME);
  assert.equal(ics.replace(/\r\n/g, '').includes('\n'), false, 'no bare LF may survive');
});

test('times are written as UTC instants', () => {
  const ics = toCalendar([event()], NAME);
  assert.equal(property(ics, 'DTSTART'), 'DTSTART:20261003T180000Z', 'the -04:00 offset resolves to 18:00Z');
  assert.equal(property(ics, 'DTEND'), 'DTEND:20261003T210000Z');
  assert.equal(property(ics, 'DTSTAMP'), 'DTSTAMP:20260901T120000Z');
  assert.doesNotMatch(ics, /VTIMEZONE/);
});

test('the UID is the stored one, untouched by edits to the event', () => {
  const a = toCalendar([event()], NAME);
  const b = toCalendar([event({ title: 'Renamed', startsAt: new Date('2027-01-01T00:00:00Z') })], NAME);
  assert.equal(property(a, 'UID'), `UID:${UID}`);
  assert.equal(property(a, 'UID'), property(b, 'UID'));
});

test('text is escaped', () => {
  const ics = toCalendar([event({ title: 'Soup, bread; and\\more', location: 'Room 1, Floor 2' })], NAME);
  assert.equal(property(ics, 'SUMMARY'), 'SUMMARY:Soup\\, bread\\; and\\\\more');
  assert.equal(property(ics, 'LOCATION'), 'LOCATION:Room 1\\, Floor 2');
});

test('the calendar name is escaped', () => {
  // The single-event download is named after the title - left raw, a newline in
  // one would let it write properties of its own.
  const ics = toCalendar([], 'Soup, bread;\nX-INJECTED:1');
  assert.equal(property(ics, 'X-WR-CALNAME'), 'X-WR-CALNAME:Soup\\, bread\\;\\nX-INJECTED:1');
  assert.equal(property(ics, 'X-INJECTED'), undefined);
});

test('long lines are folded to 75 octets', () => {
  const ics = toCalendar([event({ description: 'é'.repeat(200) })], NAME);
  for (const line of ics.split('\r\n')) {
    assert.ok(Buffer.byteLength(line) <= 75, `line exceeds 75 octets: ${line}`);
  }
  assert.equal(
    property(ics, 'DESCRIPTION'),
    `DESCRIPTION:${'é'.repeat(200)}\\n\\nHosted by Makers Guild`,
    'folding round-trips',
  );
});

test('registration, volunteer and host details are folded into the description', () => {
  const ics = toCalendar(
    [
      event({
        description: 'Bring a toaster.',
        registrationLink: 'https://example.org/r',
        volunteerContact: 'v@example.org',
        organization: { name: 'Makers Guild', contact: 'hi@makers.org' },
      }),
    ],
    NAME,
  );
  assert.equal(
    property(ics, 'DESCRIPTION'),
    'DESCRIPTION:Bring a toaster.\\n\\nRegistration: https://example.org/r' +
      '\\n\\nVolunteers wanted: v@example.org\\n\\nHosted by Makers Guild (hi@makers.org)',
  );
  assert.equal(property(ics, 'URL'), 'URL;VALUE=URI:https://example.org/r');
});

test('there is no METHOD, and so no ORGANIZER', () => {
  // RFC 5545 3.8.4.3: ORGANIZER MUST NOT appear on an event that is not
  // group-scheduled - even when the host has a contact address to give.
  const ics = toCalendar([event({ organization: { name: 'Makers Guild', contact: 'hi@makers.org' } })], NAME);
  assert.equal(property(ics, 'METHOD'), undefined);
  assert.equal(property(ics, 'ORGANIZER'), undefined);
});

test('absent optional fields are omitted rather than written empty', () => {
  const ics = toCalendar([event()], NAME);
  for (const name of ['LOCATION', 'URL']) {
    assert.equal(property(ics, name), undefined, `${name} should be absent`);
  }
});

test('an empty feed is still a valid calendar', () => {
  const lines = unfold(toCalendar([], NAME));
  assert.equal(lines[0], 'BEGIN:VCALENDAR');
  assert.equal(lines.at(-1), 'END:VCALENDAR');
  assert.equal(lines.includes('BEGIN:VEVENT'), false);
});
