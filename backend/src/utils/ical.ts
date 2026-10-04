import ical, { escape } from 'ical-generator';

/** An event row joined to its owner's organization - what a VEVENT is built from. */
export type CalendarEvent = {
  uid: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  description: string | null;
  registrationLink: string | null;
  volunteerContact: string | null;
  createdAt: Date;
  organization: { name: string; contact: string | null };
};

const REFRESH_SECONDS = 60 * 60;

/**
 * The fields iCalendar has no property for, folded into DESCRIPTION so they
 * survive the import. The host goes here rather than in ORGANIZER - see toCalendar.
 */
function describe(event: CalendarEvent): string {
  const { name, contact } = event.organization;
  return [
    event.description,
    event.registrationLink && `Registration: ${event.registrationLink}`,
    event.volunteerContact && `Volunteers wanted: ${event.volunteerContact}`,
    contact ? `Hosted by ${name} (${contact})` : `Hosted by ${name}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Serializes events as an RFC 5545 VCALENDAR.
 *
 * Deliberately has no METHOD, making it a snapshot rather than a scheduling
 * message: RFC 5545 forbids ORGANIZER on an event that is not group-scheduled,
 * and METHOD:PUBLISH (RFC 5546) would require one. Without a METHOD, DTSTAMP is
 * the last revision, so createdAt is right until events become editable - then
 * it needs an updatedAt column and a SEQUENCE that increments with it.
 *
 * Times are written in UTC: the stored instant is authoritative, and the
 * subscriber's calendar renders it in their own zone, so no VTIMEZONE is needed.
 */
export function toCalendar(events: CalendarEvent[], name: string): string {
  const calendar = ical({
    // ical-generator writes NAME and X-WR-CALNAME unescaped.
    name: escape(name, false),
    prodId: { company: 'Commons Fabric', product: 'Events', language: 'EN' },
    ttl: REFRESH_SECONDS,
  });

  for (const event of events) {
    calendar.createEvent({
      id: event.uid,
      start: event.startsAt,
      end: event.endsAt,
      stamp: event.createdAt,
      summary: event.title,
      location: event.location,
      description: describe(event),
      url: event.registrationLink,
    });
  }

  return calendar.toString();
}
