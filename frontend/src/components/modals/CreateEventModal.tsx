/** Create event modal (Org Admin only). */

import { useState } from "react";
import { useToast } from "../../hooks/useOverlayContext";
import { useCreateEvent } from "../../hooks/useEvents";
import { ApiError } from "../../api/client";
import type { Event, EventCreate } from "../../api/events";
import type { User } from "../../api/auth";

import Modal from "./Modal";
import Field from "../_controls/Field";
import Button from "../_controls/Button";
import Toggle from "../_controls/Toggle";
import Summary from "../_chips/Summary";

import { EMAIL_RE } from "../../utils/stringcheck";
import { fmtTime, fmtPlainDate, fromDateAndTime, localDateTime } from "../../utils/datetime";
import { useOrgLookup } from "../../hooks/useOrganizations";

/**
 * What this form collects - deliberately not derived from `Event`. The form takes
 * separate startDate and startTime inputs and registration toggles; the API takes one
 * `startsAt` and infers registration from the link. The submit handler converts.
 */
type EventStringFields = {
  /**
   * title: string;
   * startsAt: string;
   * endsAt: string;
   * location: string;
   * description: string;
   * registrationLink: string;
   * volunteerContact: string;
   */
  [K in keyof EventCreate]-?: NonNullable<EventCreate[K]>
}

type CreateEventFormData = Omit<EventStringFields, "startsAt" | "endsAt" | "thumbnail"> & {
  /** "YYYY-MM-DD", straight from <input type="date">. */
  startDate: string;
  /** "HH:MM", straight from <input type="time">. */
  startTime: string;
  endDate: string;
  endTime: string;
  registrationRequired: boolean;
  volunteersNeeded: boolean;
};

type EventFormErrors = Partial<CreateEventFormData>;

type CreateEventModalProps = {
  onClose: () => void,
  session: User,
  /** Called with the published event once the server has accepted it. */
  onCreate: (event: Event) => void,
}

export default function CreateEventModal({ 
  onClose, 
  session, // need to know the user who's creating the account for their org affiliation
  onCreate
}: CreateEventModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CreateEventFormData>({
    title: "", 
    startDate: "", startTime: "", 
    endDate: "", endTime: "", 
    location: "", description: "",
    registrationRequired: false, registrationLink: "",
    volunteersNeeded: false, volunteerContact: "",
  });
  const [errors, setErrors] = useState<EventFormErrors>({});
  const { toast } = useToast();
  const createEvent = useCreateEvent();
  const org = useOrgLookup();

  /**
   * Maps the form onto the API's `EventCreate` and publishes it. Untouched optional
   * fields become null rather than "", the toggles are dropped, and `ownerId` is
   * not sent - the session decides it.
   */
  const publish = () => {
    const blank = (value: string) => (value.trim() === "" ? null : value.trim());

    createEvent.mutate(
      {
        title: form.title.trim(),
        startsAt: fromDateAndTime(form.startDate, form.startTime),
        endsAt: fromDateAndTime(form.endDate, form.endTime),
        location: blank(form.location),
        description: blank(form.description),
        registrationLink: form.registrationRequired ? blank(form.registrationLink) : null,
        volunteerContact: form.volunteersNeeded ? blank(form.volunteerContact) : null,
      },
      {
        onSuccess: (created) => {
          onCreate(created);
          toast("Event created and confirmed.");
          onClose();
        },
        onError: (err: unknown) => {
          // ApiError.detail is the server's own wording, so it names the field.
          toast(err instanceof ApiError ? err.detail : "Could not publish the event.");
        },
      },
    );
  };

  const setF = (patch: Partial<CreateEventFormData>) => setForm((f) => ({ ...f, ...patch }));

  const validate = () => {
    const e: EventFormErrors = {};
    if (!form.title?.trim()) e.title = "Title is required.";
    if (!form.startDate) e.startDate = "Event start date is required.";
    if (!form.startTime) e.startTime = "Event start time is required.";
    if (!form.location?.trim()) e.location = "Location is required.";
    if (form.registrationRequired && !form.registrationLink?.trim()) e.registrationLink = "Add the link people register through.";
    if (form.volunteersNeeded && !EMAIL_RE.test(form.volunteerContact)) e.volunteerContact = "Add a valid contact email for volunteers.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // The review step reads the two inputs back as the one instant they will be
  // published as, so the confirmation shows the same clock the form collected.
  const startsAt = form.startDate && form.startTime
    ? localDateTime(form.startDate, form.startTime)
    : null;
  const endsAt = form.endDate && form.endTime ? localDateTime(form.endDate, form.endTime) : null;

  const whenSummary = startsAt ? 
    `${fmtPlainDate(startsAt)} · ${fmtTime(startsAt)}${ endsAt ? 
      `${form.endDate !== form.startDate ? 
        ` - ${fmtPlainDate(endsAt)} · ` 
        : " - "}` + fmtTime(endsAt)
      : ""}` : "";

  const inputStyle = (err: EventFormErrors[keyof EventFormErrors]) => `w-full px-2.5 py-2 rounded-md text-sm font-sans outline-none border ${err ? 'border-danger' : 'border-line'} bg-white text-ink`;

  return (
    <Modal onClose={onClose} width={500} title="Create event" subtitle={`Hosting as ${org(session.organizationId)}`}>
      <div className="px-4.5 py-6">
        {step === 1 ? (
          <>
            <Field label="Title" error={errors.title}>
              <input className={inputStyle(errors.title)} value={form.title}
                onChange={(e) => setF({ title: e.target.value })} placeholder="Event title" />
            </Field>

            <div className="border border-line rounded-md py-3 px-3.25 mb-3.5 bg-field grid gap-x-2.5 gap-y-2">
              <Field inline={true} label="starts" error={errors.startDate} className="grid gap-x-2.5 gap-y-2">
                <input type="date" 
                  className={`${inputStyle(errors.startDate)} col-2`} 
                  value={form.startDate}
                  onChange={(e) => setF({ startDate: e.target.value })} 
                />
                <input type="time"
                  className={`${inputStyle(errors.startTime)} col-3`}
                  value={form.startTime}
                  onChange={(e) => setF({ startTime: e.target.value})}
                />
              </Field>
              <Field inline={true} label="Ends" error={errors.startTime} className="grid gap-x-2.5 gap-y-2">
                <input type="date" 
                  className={`${inputStyle(errors.endDate)} col-2`} 
                  value={form.endDate}
                  onChange={(e) => setF({ endDate: e.target.value })} 
                />
                <input type="time"
                  className={`${inputStyle(errors.endTime)} col-3`}
                  value={form.endTime}
                  onChange={(e) => setF({ endTime: e.target.value})}
                />
              </Field>
              {/* TODO: add recurrence here */}
            </div>
            
            <Field label="Location" error={errors.location}>
              <input className={inputStyle(errors.location)} value={form.location}
                onChange={(e) => setF({ location: e.target.value })} placeholder="e.g. RCH Room 2" />
            </Field>
            <Field label="Description (optional)">
              <textarea className={inputStyle(false)} value={form.description}
                onChange={(e) => setF({ description: e.target.value })} placeholder="What's happening?" />
            </Field>

            <Toggle label="Registration required?" hint="Members register on your platform of choice. (ex. Eventbrite, Meetup, etc)"
              checked={form.registrationRequired}
              onChange={(v) => setF({ registrationRequired: v, ...(v ? {} : { registrationLink: "" }) })} />
            {form.registrationRequired && (
              <Field label="Registration link" error={errors.registrationLink}>
                <input className={inputStyle(errors.registrationLink)} value={form.registrationLink}
                  onChange={(e) => setF({ registrationLink: e.target.value })} placeholder="https://…" />
              </Field>
            )}

            <Toggle label="Volunteers needed?" hint="Recruiting volunteers for this event."
              checked={form.volunteersNeeded}
              onChange={(v) => setF({ volunteersNeeded: v, ...(v ? {} : { volunteerContact: "" }) })} />
            {form.volunteersNeeded && (
              <Field label="Volunteer contact email" error={errors.volunteerContact}>
                <input className={inputStyle(errors.volunteerContact)} value={form.volunteerContact}
                  onChange={(e) => setF({ volunteerContact: e.target.value })} placeholder="staff@org.example" />
              </Field>
            )}

            <Button className="w-full mt-[4px]"
            onClick={() => { if (validate()) setStep(2); }}>Continue</Button>
          </>
        ) : (
          <>
            <div className="bg-surface-alt border border-line rounded-md p-4 mb-4 flex flex-col"
            >
              <Summary label="Title" value={form.title} />
              <Summary label="When" value={whenSummary} />
              <Summary label="Where" value={form.location} />
              <Summary label="Host" value={org(session.organizationId) ?? ""} />
              <Summary label="Registration" value={form.registrationRequired ? form.registrationLink : "Not required"} />
              <Summary label="Volunteers" value={form.volunteersNeeded ? form.volunteerContact : "Not recruiting"} last />
            </div>
            <p className="text-[14px] font-semibold text-ink m-[0 0 14px]"
            >Is this information correct?</p>
            <div className="flex gap-2.5"
            >
              <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}
                disabled={createEvent.isPending}>No, edit</Button>
              <Button className="flex-1" onClick={publish} disabled={createEvent.isPending}>
                {createEvent.isPending ? "Publishing…" : "Yes, publish"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}