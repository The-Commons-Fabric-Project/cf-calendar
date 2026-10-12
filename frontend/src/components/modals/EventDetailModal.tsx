import type { ReactElement } from 'react';
import { type Event, needsVolunteers, requiresRegistration } from '../../api/events'
import { fmtPlainDate, fmtTime } from '../../utils/datetime';
import Icon from '../../assets/Icons';
import Modal from './Modal';
import Button from '../_controls/Button';
import { useToast } from '../../hooks/useOverlayContext';
import { colorKey } from '../../utils/palette';

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

  return (
    <Modal onClose={onClose} width={500} accent={accent}>
      <div className="pt-5.5 pr-11 pb-0 pl-[24px]">
        <h2 className="font-bold text-ink m-0 leading-tight">{event.title}</h2>
        <p className={`text-[11px] font-bold mt-1.5 tracking-[0.04em] uppercase text-${accent}-text`}
        >{orgName}</p>
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
                <>Registration required — <a href={event.registrationLink || "#"} target="_blank" rel="noreferrer" onClick={(e) => { if (!event.registrationLink) e.preventDefault(); }}>{event.registrationLink || "link to come"}</a></>
              ) : "No registration required — just show up"
            } />
          {needsVolunteers(event) && (
            <DetailRow icon={<Icon name="user" size={15}/>} text={<>Volunteers wanted — <a href={
              `mailto:${event.volunteerContact}`}>{event.volunteerContact}</a></>} />
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
