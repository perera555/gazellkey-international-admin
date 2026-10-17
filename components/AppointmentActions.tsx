"use client";

import { FormEvent, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ConfirmAction from "@/components/ConfirmAction";
import { apiRequest } from "@/lib/api-client";
import { formatDateTime, fromOfficeInput, MODE_LABELS, toOfficeInput } from "@/lib/format";
import { Appointment, StaffName } from "@/lib/types";

const DURATIONS = [15, 30, 45, 60, 90, 120];

function useSaved() {
  const router = useRouter();
  const pathname = usePathname();
  return (notice: string) => {
    router.replace(`${pathname}?notice=${encodeURIComponent(notice)}`, { scroll: false });
    router.refresh();
  };
}

function ErrorText({ text }: { text: string }) {
  return text ? (
    <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
      {text}
    </p>
  ) : null;
}

// Confirm / complete / no-show / cancel buttons for the current status
export function StatusActions({ appointment }: { appointment: Appointment }) {
  const path = `/api/appointments/${appointment.id}`;

  if (appointment.status == "REQUESTED") {
    return (
      <div className="flex flex-wrap gap-3">
        <ConfirmAction
          tone="gold"
          label="Confirm appointment"
          title="Confirm this appointment?"
          message="The customer gets a confirmation email with an 'Add to Google Calendar' link, and the appointment is added to the company calendar."
          method="PUT"
          path={path}
          body={{ status: "CONFIRMED" }}
        />
        <CancelButton appointmentId={appointment.id} />
      </div>
    );
  }

  if (appointment.status == "CONFIRMED") {
    return (
      <div className="flex flex-wrap gap-3">
        <ConfirmAction
          tone="gold"
          label="Mark completed"
          title="Mark as completed?"
          message="Use this after the meeting has taken place."
          method="PUT"
          path={path}
          body={{ status: "COMPLETED" }}
        />
        <ConfirmAction
          tone="outline"
          label="No-show"
          title="Customer did not come?"
          message="Marks the appointment as a no-show and removes it from Google Calendar."
          method="PUT"
          path={path}
          body={{ status: "NO_SHOW" }}
        />
        <CancelButton appointmentId={appointment.id} />
      </div>
    );
  }

  return <p className="text-sm text-slate-500">This appointment is finished. Book a new one if needed.</p>;
}

function CancelButton({ appointmentId }: { appointmentId: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const saved = useSaved();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function cancel(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await apiRequest("PUT", `/api/appointments/${appointmentId}`, {
      status: "CANCELLED",
      cancelReason: reason.trim(),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.data.message ?? "Could not cancel.");
      return;
    }
    dialog.current?.close();
    saved("Appointment cancelled");
  }

  return (
    <>
      <button type="button" className="btn-danger" onClick={() => dialog.current?.showModal()}>
        Cancel appointment
      </button>
      <dialog ref={dialog} className="modal" aria-labelledby="cancel-title">
        <form onSubmit={cancel} className="card space-y-4 p-6">
          <h2 id="cancel-title" className="heading-display text-xl">
            Cancel this appointment?
          </h2>
          <p className="text-sm text-slate-600">
            The customer is emailed with your reason and the event is removed from Google Calendar.
          </p>
          <div>
            <label htmlFor="cancel-reason" className="label">
              Reason *
            </label>
            <textarea
              id="cancel-reason"
              required
              maxLength={1000}
              rows={3}
              className="input"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Our consultant is unavailable - please book another time."
            />
          </div>
          <ErrorText text={error} />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => dialog.current?.close()} className="btn-outline">
              Keep it
            </button>
            <button type="submit" disabled={busy} className="btn-danger-solid">
              {busy ? "Cancelling..." : "Cancel appointment"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

// New date/time and length (typed in Sri Lanka time)
export function RescheduleForm({ appointment }: { appointment: Appointment }) {
  const saved = useSaved();
  const currentMinutes = Math.round(
    (new Date(appointment.endAt).getTime() - new Date(appointment.startAt).getTime()) / 60_000,
  );
  const [start, setStart] = useState(toOfficeInput(appointment.startAt));
  const [minutes, setMinutes] = useState(currentMinutes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await apiRequest("PUT", `/api/appointments/${appointment.id}`, {
      startAt: fromOfficeInput(start),
      durationMinutes: minutes,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.data.message ?? "Could not reschedule.");
      return;
    }
    saved("Appointment time updated - the customer has been emailed");
  }

  const durations = DURATIONS.includes(currentMinutes) ? DURATIONS : [...DURATIONS, currentMinutes].sort((a, b) => a - b);

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <div>
          <label htmlFor="startAt" className="label">
            Date and time (Sri Lanka)
          </label>
          <input
            id="startAt"
            type="datetime-local"
            required
            step={300}
            className="input"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="duration" className="label">
            Length
          </label>
          <select
            id="duration"
            className="input"
            value={minutes}
            onChange={(event) => setMinutes(Number(event.target.value))}
          >
            {durations.map((value) => (
              <option key={value} value={value}>
                {value} min
              </option>
            ))}
          </select>
        </div>
      </div>
      <ErrorText text={error} />
      <button type="submit" disabled={busy} className="btn-navy">
        {busy ? "Saving..." : "Save new time"}
      </button>
    </form>
  );
}

// Who takes it, how, where, and internal notes
export function DetailsForm({ appointment, staff }: { appointment: Appointment; staff: StaffName[] }) {
  const saved = useSaved();
  const [mode, setMode] = useState(appointment.mode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const text = (name: string) => {
      const value = String(form.get(name) ?? "").trim();
      return value == "" ? null : value;
    };
    const result = await apiRequest("PUT", `/api/appointments/${appointment.id}`, {
      mode: mode,
      assignedToId: text("assignedToId"),
      location: text("location"),
      meetingLink: text("meetingLink"),
      staffNotes: text("staffNotes"),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.data.message ?? "Could not save.");
      return;
    }
    saved("Appointment details saved");
  }

  return (
    <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="assignedToId" className="label">
          Staff member
        </label>
        <select id="assignedToId" name="assignedToId" className="input" defaultValue={appointment.assignedTo?.id ?? ""}>
          <option value="">Unassigned</option>
          {staff.map((person) => (
            <option key={person.id} value={person.id}>
              {person.firstName} {person.lastName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="mode" className="label">
          Type
        </label>
        <select
          id="mode"
          className="input"
          value={mode}
          onChange={(event) => setMode(event.target.value as Appointment["mode"])}
        >
          {Object.entries(MODE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {mode == "IN_PERSON" && (
        <div className="sm:col-span-2">
          <label htmlFor="location" className="label">
            Office / address
          </label>
          <input
            id="location"
            name="location"
            maxLength={300}
            className="input"
            defaultValue={appointment.location ?? ""}
            placeholder="Leave empty to use the main office address"
          />
        </div>
      )}
      {mode == "VIDEO" && (
        <div className="sm:col-span-2">
          <label htmlFor="meetingLink" className="label">
            Video call link
          </label>
          <input
            id="meetingLink"
            name="meetingLink"
            type="url"
            maxLength={500}
            className="input"
            defaultValue={appointment.meetingLink ?? ""}
            placeholder="https://meet.google.com/..."
          />
        </div>
      )}
      <div className="sm:col-span-2">
        <label htmlFor="staffNotes" className="label">
          Internal notes <span className="font-normal text-slate-500">(never shown to the customer)</span>
        </label>
        <textarea
          id="staffNotes"
          name="staffNotes"
          rows={3}
          maxLength={5000}
          className="input"
          defaultValue={appointment.staffNotes ?? ""}
        />
      </div>
      <div className="space-y-3 sm:col-span-2">
        <ErrorText text={error} />
        <button type="submit" disabled={busy} className="btn-navy">
          {busy ? "Saving..." : "Save details"}
        </button>
      </div>
    </form>
  );
}

// Google Calendar state of this appointment + "Sync again"
export function CalendarPanel({ appointment, canEdit }: { appointment: Appointment; canEdit: boolean }) {
  const saved = useSaved();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sync() {
    setBusy(true);
    setError("");
    const result = await apiRequest("POST", `/api/appointments/${appointment.id}/calendar`);
    setBusy(false);
    if (!result.ok) {
      setError(result.data.message ?? "Could not reach Google Calendar.");
      return;
    }
    saved(result.data.message ?? "Google Calendar updated");
  }

  const wantsEvent = appointment.status == "CONFIRMED" || appointment.status == "COMPLETED";

  let state;
  if (!appointment.calendarEnabled) {
    state = (
      <p className="text-sm text-slate-600">
        The company calendar is not connected yet. Add the <code className="text-xs">GOOGLE_*</code> settings to
        the backend <code className="text-xs">.env</code> to copy confirmed appointments automatically.
      </p>
    );
  } else if (appointment.calendarError) {
    state = (
      <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
        Last sync failed: {appointment.calendarError}
      </p>
    );
  } else if (appointment.googleEventLink) {
    state = (
      <p className="flex items-center gap-2 text-sm text-green-800">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-green-600 text-[0.65rem] text-white">✓</span>
        In the company calendar
        {appointment.calendarSyncedAt && (
          <span className="text-slate-500">· synced {formatDateTime(appointment.calendarSyncedAt)}</span>
        )}
      </p>
    );
  } else {
    state = (
      <p className="text-sm text-slate-600">
        {wantsEvent ? "Not in the calendar yet." : "Added to the company calendar when it is confirmed."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {state}
      <ErrorText text={error} />
      <div className="flex flex-wrap gap-2">
        {appointment.googleEventLink && (
          <a href={appointment.googleEventLink} target="_blank" rel="noreferrer" className="btn-gold btn-sm">
            Open in Google Calendar
          </a>
        )}
        {appointment.googleCalendarUrl && wantsEvent && (
          <a href={appointment.googleCalendarUrl} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
            Add to my calendar
          </a>
        )}
        {canEdit && appointment.calendarEnabled && (appointment.calendarError || (wantsEvent && !appointment.googleEventId)) && (
          <button type="button" onClick={sync} disabled={busy} className="btn-navy btn-sm">
            {busy ? "Syncing..." : "Sync again"}
          </button>
        )}
      </div>
    </div>
  );
}
