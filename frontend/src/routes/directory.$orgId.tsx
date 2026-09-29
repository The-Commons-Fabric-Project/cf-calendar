import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { type Org, type OrgTag } from '../api/organizations'
import { type Event } from '../api/events'
import { useEvents } from '../hooks/useEvents'
import { organizationsQueryOptions as orgList } from '../hooks/useOrganizations'

import EventRow from '../components/cards/EventRow'
import Tag from '../components/_chips/Tag'
import EventDetailModal from '../components/modals/EventDetailModal'

import Icon from '../assets/Icons'
import { classesForID, colorKey } from '../utils/palette'
import { orgInitials } from '../utils/stringcheck';

export const Route = createFileRoute('/directory/$orgId')({
  loader: async ({ context, params }) => {
    // console.log(`running loader`);
    const { orgId } = params;
    const { queryClient } = context;
    const orgs = await queryClient.ensureQueryData(orgList()) as Org[];
    const id = parseInt(orgId);
    return orgs.find(o => o.id === id);
  },
  component: ProfileView,
})

/** Current design doesn't use organization tags, so this is a placeholder method for styling them/indexing their color */
function makeOrgTagChip(k: string, tag: OrgTag) {
  const idx = tag.charCodeAt(0)+tag.charCodeAt(1);
  return <Tag key={k} variant={colorKey(idx)}>{tag}</Tag>
}

function ProfileView(
//   {
//   org,
//   onBack,
//   onSelectEvent,
// }: {
//   org: Org
//   onBack: () => void
//   onSelectEvent: (e: Event) => void
// }
) {
  const org = Route.useLoaderData() as Org;
  // Filtered by the server rather than by matching display names. The events
  // table has no organization name to match on - it has an id - and two
  // organizations are free to share a name.
  const { data: orgEvents = [], isLoading } = useEvents({ organizationId: org?.id });
  const color = classesForID(org.id);
  const inits = orgInitials(org.name);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  return (
    <>
    <div style={{ animation: 'cf-fade .3s ease' }}>
      {/* <Link to={'/directory'}
        className="bg-transparent border-0 text-primary font-semibold text-[14px] cursor-pointer p-0 mb-4.5 block font-body"
        style={{ transition: 'color .15s ease' }}
      >
        ‹ Back to directory
      </Link> */}

      {/* Org header card */}
      <div className="bg-white border border-line rounded-2xl p-7 mb-6 flex gap-6 items-start flex-wrap">
        <div
          className={`rounded-md size-15 shrink-0 flex items-center justify-center text-base font-bold ${color.plate}`}
        >
          {orgInitials(org.name)}
        </div>
        <div className="flex-1 min-w-65">
          <div className="flex gap-2 flex-wrap mb-3">
            {(org?.tags ?? []).map((t, i) => makeOrgTagChip(`${inits}-${i}`,t))}
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink m-0 mb-3 leading-[1.15]">
            {org?.name}
          </h1>
          <p className="text-[15px] text-ink leading-[1.6] m-0 mb-4.5 max-w-160 font-body">
            {org?.blurb}
          </p>
          <div className="flex gap-6 flex-wrap text-sm text-muted font-body">
            <span className="flex gap-1 items-center">
              <Icon name="mail" size={14} />
              <a href={`mailto:${org.contact}`} className="text-primary no-underline hover:underline">
                {org.contact}
              </a>
            </span>
            <span className='flex gap-1 items-center'>
              <Icon name="link" size={14}/>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-primary no-underline hover:underline"
              >
                {org.website}
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Upcoming events */}
      <h2 className="font-display text-[22px] font-semibold text-ink m-0 mb-3.5">
        Upcoming events
      </h2>
      {isLoading ? (
        <div className="bg-surface rounded-xl p-6 text-center text-muted text-[14px] font-body">
          Loading events…
        </div>
      ) : orgEvents.length === 0 ? (
        <div className="bg-surface rounded-xl p-6 text-center text-muted text-[14px] font-body">
          No upcoming events from this organization yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {orgEvents.map((e) => (
            <EventRow key={e.id} event={e} onClick={() => setSelectedEvent(e)} />
          ))}
        </div>
      )}
    </div>
       {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          orgName={org.name}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  )
}

