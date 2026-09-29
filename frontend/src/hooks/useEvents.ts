/**
 * Events for a time window, refetched whenever that window changes.
 *
 * The window is part of the query key, so a response arriving after the user has
 * paged on belongs to a key that is no longer rendered and cannot overwrite the
 * current view.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createEvent, listEvents, type EventCreate, type EventQuery } from '../api/events';

/**
 * The key for a window. Empty strings from the date inputs are normalised away, so
 * "" and undefined do not produce two cache entries for one window.
 */
function eventsQueryKey(query: EventQuery = {}) {
  return [
    'events',
    {
      startDate: query.startDate || undefined,
      endDate: query.endDate || undefined,
      organizationId: query.organizationId,
    },
  ] as const;
}

export function useEvents(query: EventQuery = {}) {
  const key = eventsQueryKey(query);

  console.log(`useEvents query: ${query}`);

  return useQuery({
    queryKey: key,
    queryFn: () => listEvents(key[1]),
    // Keeps the previous month on screen while the next loads.
    placeholderData: (previous) => previous,
  });
}

/** Publishes an event, then invalidates every cached window it could belong to. */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EventCreate) => createEvent(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
}
