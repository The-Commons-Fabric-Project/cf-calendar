/**
 * The organization directory, fetched once and shared by every component. No
 * provider: the query cache keyed by ['organizations'] already is the shared store.
 */

import { queryOptions, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { listOrganizations } from '../api/organizations';
import type { Org } from '../api/organizations';

const organizationsQueryKey = ['organizations'] as const;

export const organizationsQueryOptions = () => 
  queryOptions({
    queryKey: organizationsQueryKey,
    queryFn: listOrganizations,
    staleTime: 'static',
  })

export function useOrganizations() {
  return useQuery({
    queryKey: organizationsQueryKey,
    queryFn: listOrganizations,
    staleTime: 'static',
  });
}

export function useOrgLookup() {
  const { data } = useOrganizations();

  return useCallback(
    (organizationId: number): string | undefined =>
      data?.find((org: Org) => org.id === organizationId)?.name,
    [data],
  );
}

export function useOrgData() {
  const { data } = useOrganizations();
  return useCallback(
    (id: number): Org | undefined =>
      data?.find((o: Org) => o.id === id), [data]
  );
}

export function useOrgIDList() {
  const { data } = useOrganizations();

  return useCallback(
    () => data?.map((o: Org) => o.id), [data]
  )
}
