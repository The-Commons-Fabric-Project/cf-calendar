import type { ReactElement } from 'react';
import { type Event, needsVolunteers, requiresRegistration } from '../../api/events'
import { fmtPlainDate, fmtTime } from '../../utils/datetime';
import Icon from '../../assets/Icons';
import Modal, { CloseButton } from './Modal';
import Button from '../_controls/Button';
import { useToast } from '../../hooks/useOverlayContext';
import { accentStops, colorKey } from '../../utils/palette';

type DetailRowProps = {
  icon: ReturnType<typeof Icon>,
  text: string | undefined | ReactElement
}

function DetailRow({ icon, text }: DetailRowProps) {
  return (
    <div className="flex gap-2.5 align-items-start text-[14px] text-ink leading-[1.45]">
      <span className="text-muted mt-px">{icon}</span><span>{text}</span>
    </div>
  );
}

type EventDetailModalProps = {
  event: Event;
  orgName?: string;
  onClose: () => void;
};

/** Pop-up with event details when clicked */
export default function EventDetailModal({ 
  event, orgName, onClose
}: EventDetailModalProps) {
  const { toast } = useToast();
  const accent = colorKey(event.organizationId);
  const stops = accentStops(event.organizationId);

  return (
    <Modal onClose={onClose} width={500}>
      {/* top edge decoration with gradient stops */}
      <div className='flex gap-0.5'>
        {stops.map((c, i) => (
          <span key={i} className={`flex-1 h-0.75`}
            style={{ background: `var(--color-${c})`}}
          /> // IDK why this doesn't work in Tailwind classes
        ))}
      </div>
      <CloseButton onClose={onClose}/>
      <div className="pt-5.5 pr-11 pb-0 pl-[24px]">
        <h2 className="font-bold text-ink m-0 leading-tight">{event.title}</h2>
        <p className="text-[11px] font-bold mt-1.5 tracking-[0.04em] uppercase"
        style={{ color: `var(--color-${accent}-text)`}}>{orgName}</p>
      </div>
      <div className="pt-4.5 pb-[24px] px-[24px]">
        {event.description && <p className="text-[13.5px] text-ink leading-[1.6] mb-4">{event.description}</p>}
        <div className="flex flex-col gap-2.5 mb-4.5 border-t border-line pt-4">
          <DetailRow 
            icon={<Icon name="calendar" size={15} />}  
            text={fmtPlainDate(event.startsAt)} />
          <DetailRow 
            icon={<Icon name="clock" size={15} />} 
            text={fmtTime(event.startsAt)} />
          <DetailRow 
            icon={<Icon name="pin" size={15} />} 
            text={event.location ?? "Location to come"} />
          <DetailRow 
            icon={<Icon name="ticket" size={15} />} 
            text={
              requiresRegistration(event) ? (
                <>Registration required — <a href={event.registrationLink || "#"} target="_blank" rel="noreferrer" onClick={(e) => { if (!event.registrationLink) e.preventDefault(); }} className="text-slate-900 font-semibold underline break-all">{event.registrationLink || "link to come"}</a></>
              ) : "No registration required — just show up"
            } />
          {needsVolunteers(event) && (
            <DetailRow icon={<Icon name="user" size={15}/>} text={<>Volunteers wanted — <a href={
              `mailto:${event.volunteerContact}`} className="text-slate-900 font-semibold underline">{event.volunteerContact}</a></>} />
          )}
          {requiresRegistration(event) && (
            <a href={event.registrationLink || "#"} target="_blank" rel="noreferrer"
              onClick={(e) => { if (!event.registrationLink) e.preventDefault();
              toast("Opening registration…"); }}
              className="no-underline">
                {/* TODO: add real functionality*/}
              <Button className="w-full" onClick={() => {}}>Register on host's site ↗</Button>
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}
