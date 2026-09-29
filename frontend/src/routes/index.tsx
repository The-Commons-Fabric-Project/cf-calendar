import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import Button from '../components/_controls/Button';
import EventCardGrid from '../components/views/EventCardGrid'
import { CalendarView } from '../components/views/Calendar'
import { useAuth } from '../hooks/useAuth'
import { useEvents } from '../hooks/useEvents'
import { useOrganizations, useOrgLookup } from '../hooks/useOrganizations'
import { useModal, useToast } from '../hooks/useOverlayContext';
import CreateEventModal from '../components/modals/CreateEventModal';
import EventDetailModal from '../components/modals/EventDetailModal';
import { monthBounds, toDateKey } from '../utils/datetime';
import type { DateKey } from '../utils/types/dates';
import type { Event } from '../api/events';
import type { EventsView } from '../utils/types/views';
import { FilterDropdown } from '../components/nav/FilterDropdown';

function Index() {
  const [view, setView] = useState<EventsView>('calendar')
  const [gridStart, setGridStart] = useState<DateKey>("");
  const [gridEnd, setGridEnd] = useState<DateKey>("");
  const [calendarWindow, setCalendarWindow] = useState(() => monthBounds(new Date()));

  const activeWindow = view === 'cards'
    ? { startDate: gridStart, endDate: gridEnd }
    : { startDate: calendarWindow.start, endDate: calendarWindow.end };

  const { data: events, isLoading, error } = useEvents(activeWindow);
  const { data: orgs } = useOrganizations();
  
  const [selectedOrgs, setSelectedOrgs] = useState<number[]>(orgs ? orgs.map(o => o.id) : []);  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const orgName = useOrgLookup();
  const { user } = useAuth();
  const { modal, setModal } = useModal();
  const { toast } = useToast();

  /** organizations with events currently visible on calendar 
   * 
   * TODO: change to useMemo
  */
  const visibleOrgs = events ? [...new Set(events?.map(e => e.organizationId))].map(o => {
    const name = orgName(o) ? orgName(o) as string : '';
    return { id: o, name: name}
  }) : [];

  // TODO: add routes for individual events, follow https://www.notanumber.in/blog/render-modal-on-a-route-with-the-parent-in-background-in-tanstack-router

  return (
    <div className="w-260 pt-9 px-6 pb-20 my-0 mx-auto">
      <h1>What's happening at the Hub</h1>
      <p className="lede">
        One shared place to discover and share events across the Rideau Community Hub network.
      </p>

      <div className="w-full flex centered justify-between items-center mt-6">
        <div className="flex mt-5 gap-3 items-center"> 
          {/* left side: view slider + create event button */}
          <div className="inline-flex bg-white border border-line p-0.75 rounded-full">
            <button
              onClick={() => setView('calendar')}
              className={`text-[11px] rounded-full px-4 py-1.75 transition-colors border-0 ${view === 'calendar' ? `bg-accent text-white` : 'bg-transparent text-muted'}`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('cards')}
              className={`text-[11px] rounded-full px-4 py-1.75 transition-colors border-0 ${view === 'cards' ? `bg-accent text-white` : 'bg-transparent text-muted'}`}
            >
              Card grid
            </button>
          </div>

          {/* If signed in, display create event button */}
          {user && (
            <Button onClick={() => setModal("create_event")}>+ Create an event</Button>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* right side */}
          { orgs && (
            <FilterDropdown orgs={orgs ?? []} appliedIds={selectedOrgs} onApply={(ids) => {
              setSelectedOrgs(ids);
              toast("Organization filter applied.");
            }} />
          )}
        </div>
      </div>

      {/* MAIN VIEW PANEL: CALENDAR OR CARDS  */}
      <div className="w-full pt-6">
        {error ? (
          <div className="text-muted">Could not load events. {error.message}</div>
        ) : isLoading ? (
          <div className="text-muted">Loading events…</div>
        ) : view === 'cards' ? (
          <EventCardGrid
            events={events ?? []}
            onSelect={setSelectedEvent}
            orgName={orgName}
            rangeStart={gridStart} rangeEnd={gridEnd}
            setRangeStart={setGridStart} setRangeEnd={setGridEnd}
          />
        ) : (
          <CalendarView
            events={events ?? []}
            visibleOrgs={visibleOrgs}
            span={"month"}
            onSelect={setSelectedEvent}
            rangeStart={calendarWindow.start}
            showLegend={true}
            onWindowChange={(start, end) => setCalendarWindow({ start, end })}
          />
        )}
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          orgName={orgName(selectedEvent.organizationId)}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* the create event flow is meaningless without a signed-in user */}
      {user && modal === "create_event" && (
        <CreateEventModal
          onClose={() => setModal(undefined)}
          session={user}
          onCreate={(created) => {
            const day = toDateKey(created.startsAt);
            setView('cards');
            setGridStart(day);
            setGridEnd(day);
          }}
        />
      )}
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: Index,
})
