/**
 * CalendarView component
 * 
 * Shell for everything that displays in "calendar" view (as opposed to "card" view) = main child is the grid view (month, week, day) with nav buttons and filters surrounding it
 * 
 * Built from the design team's HTML rather than react-big-calendar, which was
 * harder to theme. Revisit if we need Google Calendar/Outlook integration.
 */

import { useState } from 'react'
import { addMonths, format, startOfMonth, subMonths } from 'date-fns';
import type { Event } from '../../api/events';
import type { Org } from '../../api/organizations';
import { fromDateKey, monthBounds } from '../../utils/datetime';
import { type DateKey } from '../../utils/types/dates';
import { MonthGrid } from './MonthGrid';
import { CALENDAR_MAX_PER_DAY as maxPerDay, type CalendarView } from '../../utils/types/views';
import { LegendBar } from '../nav/LegendBar';

type CalendarViewProps = {
  events: Event[];
  visibleOrgs: Pick<Org, "id" | "name">[];
  /** timespan visible on the calendar -> which grid is visible */
  span: CalendarView; // day | week | month
  onSelect: (event: Event) => void;

  /**
   * Start of the calendar's own fetch window, "YYYY-MM-DD". Owned by
   * routes/index.tsx and separate from the card grid's range. Falls back to today.
   */
  rangeStart: DateKey;
  /** Asks the route to fetch a new month/week/day depending on the span. Called on every month navigation (? make sure this is efficient). */
  showLegend: boolean;
  onWindowChange: (start: DateKey, end: DateKey) => void;
};

export function CalendarView({ events, visibleOrgs, showLegend, onSelect, rangeStart, onWindowChange }: CalendarViewProps) {
  // Seeded from the current window, falling back to today. The month decides which
  // data is fetched, so it cannot be derived from the events.
  
  const [cursor, setCursor] = useState(() => (rangeStart ? fromDateKey(rangeStart) : new Date()));

  // Moving the cursor also moves the fetch window.
  const goToMonth = (next: Date) => {
    setCursor(next);
    const { start, end } = monthBounds(next);
    onWindowChange(start, end);
  };

  const goToPrev = () => { goToMonth(startOfMonth(subMonths(cursor, 1))) };
  const goToNext = () => { goToMonth(startOfMonth(addMonths(cursor, 1))) };

  const arrowButtonStyles = "cf-press font-semibold text-sm px-3 py-1.5 rounded-md cursor-pointer border border-line leading-tight tracking-tight bg-transparent text-ink";

  return (
    <div className="card p-4.5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="uppercase text-[14px] font-bold text-ink m-0">
          {format(cursor, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <button
            className={arrowButtonStyles}
            onClick={goToPrev}
          >
            ‹
          </button>
          <button
            className={arrowButtonStyles}
            onClick={goToNext}
          >
            ›
          </button>
        </div>
      </div>

      <div className="overflow-y-auto overflow-x-hidden h-124">
        {/* TODO: add day/week views */}
        <MonthGrid year={cursor.getFullYear()} month={cursor.getMonth()} events={events} maxPerDay={maxPerDay} onSelect={onSelect} />
      </div>
      

      {/* OrgLegend below */}
      {showLegend && (
        <LegendBar visible={visibleOrgs} onSelect={()=>{}}/>
      )}
    </div>
  )
}
