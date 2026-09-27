import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import type { Org } from '../api/organizations'
import type { Event } from '../api/events'
import { useEvents } from '../hooks/useEvents'
import { useOrganizations } from '../hooks/useOrganizations'
import { fmtTime } from '../utils/datetime'

import EventDetailModal from '../components/modals/EventDetailModal'
import OrgCard, { OrgTagChip } from '../components/cards/OrgCard'
import DateChip from '../components/_chips/DateChip'
import Icon from '../assets/Icons'
import { classesForID } from '../utils/palette'
import { orgInitials } from '../utils/stringcheck';

export const Route = createFileRoute('/directory')({
  component: Directory,
})

function EventRow({ event, onClick }: { event: Event; onClick: () => void }) {
  const start = event.startsAt;
  return (
    <div
      onClick={onClick}
      className="flex gap-3.5 items-center bg-white border border-line rounded-xl p-3.5 cursor-pointer hover:shadow-[0_4px_12px_rgba(65,65,66,0.08)] active:scale-[0.99]"
      style={{ transition: 'box-shadow .18s ease, transform .08s ease' }}
    >
      <DateChip date={start} large={false}/>
      <div className="flex-1 min-w-0">
        <h4 className="font-display text-[16px] font-semibold text-ink m-0 leading-[1.2]">
          {event.title}
        </h4>
        <p className="text-[12.5px] text-muted m-0 mt-1 font-body">
          {fmtTime(start)} · {event.location}
        </p>
      </div>
    </div>
  )
}

function ProfileView({
  org,
  onBack,
  onSelectEvent,
}: {
  org: Org
  onBack: () => void
  onSelectEvent: (e: Event) => void
}) {
  // Filtered by the server rather than by matching display names. The events
  // table has no organization name to match on - it has an id - and two
  // organizations are free to share a name.
  const { data: orgEvents = [], isLoading } = useEvents({ organizationId: org.id });
  const color = classesForID(org.id);

  return (
    <div style={{ animation: 'cf-fade .3s ease' }}>
      <button
        onClick={onBack}
        className="bg-transparent border-0 text-primary font-semibold text-[14px] cursor-pointer p-0 mb-4.5 block font-body"
        style={{ transition: 'color .15s ease' }}
      >
        ‹ Back to directory
      </button>

      {/* Org header card */}
      <div className="bg-white border border-line rounded-2xl p-7 mb-6 flex gap-6 items-start flex-wrap">
        <div
                className={`rounded-md size-15 shrink-0 flex items-center justify-center text-base font-bold ${color.plate}`}
              >
                {orgInitials(org.name)}
              </div>
        <div className="flex-1 min-w-65">
          <div className="flex gap-2 flex-wrap mb-3">
            {(org.tags ?? []).map((t) => <OrgTagChip key={t} tag={t}/>)}
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink m-0 mb-3 leading-[1.15]">
            {org.name}
          </h1>
          <p className="text-[15px] text-ink leading-[1.6] m-0 mb-4.5 max-w-160 font-body">
            {org.blurb}
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
            <EventRow key={e.id} event={e} onClick={() => onSelectEvent(e)} />
          ))}
        </div>
      )}
    </div>
  )
}

function Directory() {
  const [activeOrg, setActiveOrg] = useState<Org | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  // Served from the query cache after the first route that asks for it, so
  // arriving here from the events page costs no request.
  const { data: orgs, isLoading, error } = useOrganizations()

  const openProfile = (org: Org) => {
    setActiveOrg(org)
    window.scrollTo(0, 0)
  }

  const closeProfile = () => {
    setActiveOrg(null)
    window.scrollTo(0, 0)
  }

  return (
    <div className="w-260 pt-9 px-6 pb-20">
      {activeOrg ? (
        <ProfileView
          org={activeOrg}
          onBack={closeProfile}
          onSelectEvent={setSelectedEvent}
        />
      ) : (
        <>
          <h1>Organizations on the Hub</h1>
          <p className="lede">
            Browse member organizations of the Rideau Community Hub network.
          </p>
          <div className="flex flex-col gap-3 mt-6">
            {error ? (
              <div className="text-muted">Could not load organizations. {error.message}</div>
            ) : isLoading ? (
              <div className="text-muted">Loading organizations…</div>
            ) : (
              (orgs ?? []).map((org, i) => (
                <OrgCard key={org.id} org={org} idx={i} onClick={() => openProfile(org)} />
              ))
            )}
          </div>
        </>
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          orgName={activeOrg?.name}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  )
}
