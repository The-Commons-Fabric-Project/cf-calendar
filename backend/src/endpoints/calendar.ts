import { Router, type Request, type Response, type NextFunction } from 'express';

import { prisma } from '../db/client.js';
import { toCalendar, type CalendarEvent } from '../utils/ical.js';
import { notFound } from '../utils/problems.js';

export const calendarRouter = Router();

/**
 * How far back the feed reaches. Starting at "now" would pull an event out of
 * subscribers' calendars while it is still running, and erase what they attended.
 */
const FEED_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;

const withOrganization = {
  owner: { select: { organization: { select: { name: true, contact: true } } } },
} as const;

type CalendarRow = Awaited<ReturnType<typeof prisma.event.findMany<{ include: typeof withOrganization }>>>[number];

const toCalendarEvent = ({ owner, ...row }: CalendarRow): CalendarEvent => ({
  ...row,
  organization: owner.organization,
});

const sendCalendar = (res: Response, ics: string) =>
  res.set('Cache-Control', `public, max-age=3600`).type('text/calendar; charset=utf-8').send(ics);

/** Title -> a filename a download dialog will accept, falling back to the id. */
const filenameFor = (id: number, title: string) =>
  `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `event-${id}`}.ics`;

/**
 * GET /v1/calendar.ics
 * The subscription feed: recent and upcoming events, optionally for one organization.
 */
calendarRouter.get('/calendar.ics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.query as { organizationId?: number };

    let name = 'Commons Fabric events';
    if (organizationId !== undefined) {
      const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { name: true } });
      if (!org) throw notFound(`No organization with id ${organizationId}.`);
      name = `${org.name} - Commons Fabric`;
    }

    const rows = await prisma.event.findMany({
      where: {
        endsAt: { gte: new Date(Date.now() - FEED_LOOKBACK_MS) },
        ...(organizationId !== undefined ? { owner: { organizationId } } : {}),
      },
      orderBy: { startsAt: 'asc' },
      include: withOrganization,
    });

    sendCalendar(res, toCalendar(rows.map(toCalendarEvent), name));
  } catch (err) {
    next(err);
  }
});

/** GET /v1/events/{eventId}/calendar.ics - one event, as a download. */
calendarRouter.get('/events/:eventId/calendar.ics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = Number(req.params.eventId);

    const row = await prisma.event.findUnique({ where: { id: eventId }, include: withOrganization });
    if (!row) throw notFound(`No event with id ${eventId}.`);

    res.attachment(filenameFor(row.id, row.title));
    sendCalendar(res, toCalendar([toCalendarEvent(row)], row.title));
  } catch (err) {
    next(err);
  }
});
