/**
 * The /v1/events operations, and the one place a timestamp crosses between the
 * API's RFC 3339 strings and the `Date`s the rest of the app holds.
 *
 * The offset the database stores is authoritative: `toEvent` resolves each
 * timestamp into an absolute instant, which utils/datetime then renders in the
 * viewer's own timezone. Every Event in the app comes through here, so nothing
 * downstream ever parses a timestamp string.
 */

import { dayEdge } from '../utils/datetime';
import type { DateKey, DBTimestamp } from '../utils/types/dates';

import { get, post, type QueryString } from './client';
import type { components as c } from './openapi.gen';


type EventResponse = c["schemas"]["Event"];

export type Event = Omit<EventResponse, "startsAt" | "endsAt" | "createdAt"> & {
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
};

export const requiresRegistration = (event: Event) => Boolean(event.registrationLink);
export const needsVolunteers = (event: Event) => Boolean(event.volunteerContact);


function instant(value: DBTimestamp, field: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`${field} is not a valid timestamp: ${value}`);
  return parsed;
}

/** Wire event -> app event. Exported for the Storybook fixtures in mocks/. */
export const toEvent = (event: EventResponse): Event => ({
  ...event,
  startsAt: instant(event.startsAt, "startsAt"),
  endsAt: instant(event.endsAt, "endsAt"),
  createdAt: instant(event.createdAt, "createdAt"),
});

export type EventQuery = {
  startDate?: DateKey;
  endDate?: DateKey;
  organizationId?: number;
  selectedIds?: number[];
};

function queryString(query: EventQuery = {}): QueryString | '' {
  const params = new URLSearchParams();
  if (query.startDate) params.set('startDate', dayEdge(query.startDate, 'start'));
  if (query.endDate) params.set('endDate', dayEdge(query.endDate, 'end'));
  if (query.organizationId !== undefined) params.set('organizationId', String(query.organizationId));
  if (query.selectedIds !== undefined) {
    const ids = query.selectedIds;
    if (ids.length) 
    params.set('selectedIds', ids.sort().join(','))
  }

  const search = params.toString();
  return search ? `?${search}` : '';
}

/** GET /v1/events - events whose startsAt falls in the window, in that order. */
export const listEvents = async (query?: EventQuery): Promise<Event[]> =>
  (await get<EventResponse[]>(`/events${queryString(query)}`)).map(toEvent);

export type EventCreate = c["schemas"]["EventCreate"];

/**
 * POST /v1/events - publishes an event owned by the signed-in user. Throws ApiError
 * 401 without a session, or when the cookie does not verify.
 */
export const createEvent = async (input: EventCreate): Promise<Event> =>
  toEvent(await post<EventResponse>('/events', input));
