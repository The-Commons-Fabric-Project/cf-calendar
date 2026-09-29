import type { Event } from "../../api/events";

import DateChip from "../_chips/DateChip";
import { fmtTime } from "../../utils/datetime";

export default function EventRow({ event, onClick }: { event: Event; onClick: () => void }) {
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
