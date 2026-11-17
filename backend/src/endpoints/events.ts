import { Router, type Request, type Response, type NextFunction } from 'express';

import { prisma } from '../db/client.js';
import { Prisma } from '../generated/prisma/client.js';
import { requireAuth } from '../middleware/auth.js';
import { badRequest, notFound, unauthorized } from '../utils/problems.js';

export const eventsRouter = Router();

type EventRow = Awaited<ReturnType<typeof prisma.event.findMany>>[number] & {
  owner: { organizationId: number };
};

/**
 * Maps a row to the `Event` schema.
 *
 * Timestamps are converted explicitly: response validation inspects the object
 * handed to res.json rather than the serialised JSON, so a Date would fail
 * `type: string`.
 */
const toEvent = (row: EventRow) => ({
  id: row.id,
  ownerId: row.ownerId,
  organizationId: row.owner.organizationId,
  title: row.title,
  startsAt: row.startsAt.toISOString(),
  endsAt: row.endsAt.toISOString(),
  location: row.location,
  description: row.description,
  thumbnail: row.thumbnail,
  registrationLink: row.registrationLink,
  volunteerContact: row.volunteerContact,
  createdAt: row.createdAt.toISOString(),
});

const withOwnerOrganization = { owner: { select: { organizationId: true } } } as const;

/**
 * GET /v1/events
 * Events overlapping a time window, ordered by startsAt.
 */
eventsRouter.get('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, organizationId, selectedIds } = req.query as {
      startDate?: string;
      endDate?: string;
      organizationId?: number;
      selectedIds?: number[];
    };

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : undefined;

    if (end && end <= start) {
      throw badRequest('endDate must be later than startDate.', '/query/endDate');
    }

    const orgs = (selectedIds !== undefined && selectedIds.length > 0) ? selectedIds : undefined;

    const rows = await prisma.event.findMany({
      where: {
        endsAt: { gte: start },
        ...(end ? { startsAt: { lte: end } } : {}),
        ...(organizationId !== undefined ? { owner: { organizationId } } : {}),
        ...(orgs ? { owner: { organizationId: { in: orgs}}} : {})
      },
      orderBy: { startsAt: 'asc' },
      include: withOwnerOrganization,
    });

    res.json(rows.map(toEvent));
  } catch (err) {
    next(err);
  }
});

type EventCreateBody = {
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  registrationLink?: string | null;
  volunteerContact?: string | null;
};

/**
 * POST /v1/events
 *
 * Publishes an event owned by the signed-in user - the owner comes from the
 * session cookie, never from the body.
 */
eventsRouter.post('/events', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerId = req.user?.userId;
    if (ownerId === undefined) {
      next(unauthorized('Authentication is required to access this resource.'));
      return;
    }

    const body = req.body as EventCreateBody;
    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);

    if (endsAt <= startsAt) {
      throw badRequest('endsAt must be later than startsAt.', '/body/endsAt');
    }

    const row = await prisma.event.create({
      data: {
        title: body.title,
        ownerId,
        startsAt,
        endsAt,
        location: body.location ?? null,
        description: body.description ?? null,
        thumbnail: body.thumbnail ?? null,
        registrationLink: body.registrationLink ?? null,
        volunteerContact: body.volunteerContact ?? null,
      },
      include: withOwnerOrganization,
    });

    res.status(201).location(`/v1/events/${row.id}`).json(toEvent(row));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      next(unauthorized('The user for this session no longer exists.'));
      return;
    }
    next(err);
  }
});

/** GET /v1/events/{eventId} */
eventsRouter.get('/events/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = Number(req.params.eventId);

    const row = await prisma.event.findUnique({
      where: { id: eventId },
      include: withOwnerOrganization,
    });

    if (!row) throw notFound(`No event with id ${eventId}.`);

    res.json(toEvent(row));
  } catch (err) {
    next(err);
  }
});
