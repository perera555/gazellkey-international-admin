import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import { CalendarPanel, DetailsForm, RescheduleForm, StatusActions } from "@/components/AppointmentActions";
import PageHeader from "@/components/PageHeader";
import StatusBadge, { DIVISION_COLOURS, DivisionTag } from "@/components/StatusBadge";
import { apiGet, apiGetOne } from "@/lib/api";
import {
  customerName,
  formatAppointmentTime,
  formatDateTime,
  formatOfficeClock,
  humanize,
  MODE_LABELS,
} from "@/lib/format";
import { hasPrivilege, requireStaff } from "@/lib/session";
import { Appointment, StaffName } from "@/lib/types";

export const metadata: Metadata = { title: "Appointment" };

export default async function AppointmentPage({ params }: PageProps<"/appointments/[id]">) {
  const { id } = await params;
  const [appointment, user] = await Promise.all([
    apiGetOne<Appointment>(`/api/appointments/${encodeURIComponent(id)}`),
    requireStaff(),
  ]);
  const canEdit = hasPrivilege(user, "appointments:edit");
  const staff = canEdit ? await apiGet<StaffName[]>(`/api/appointments/${appointment.id}/assignees`) : null;
  const isActive = appointment.status == "REQUESTED" || appointment.status == "CONFIRMED";
  const minutes = Math.round(
    (new Date(appointment.endAt).getTime() - new Date(appointment.startAt).getTime()) / 60_000,
  );

  return (
    <>
      <PageHeader
        eyebrow={`Appointment ${appointment.reference}`}
        title={appointment.subject}
        description={`${formatAppointmentTime(appointment.startAt)} - ${formatOfficeClock(appointment.endAt)} (Sri Lanka) · ${MODE_LABELS[appointment.mode]}`}
        color={DIVISION_COLOURS[appointment.division]}
        back={{ href: "/appointments", label: "Appointments" }}
        actions={<StatusBadge value={appointment.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          {canEdit && (
            <Panel title="Actions">
              <StatusActions appointment={appointment} />
            </Panel>
          )}

          <Panel title="Details">
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <Field label="When">
                {formatAppointmentTime(appointment.startAt)} ({minutes} min)
              </Field>
              <Field label="Type">{MODE_LABELS[appointment.mode]}</Field>
              <Field label="Division">
                <DivisionTag division={appointment.division} />
              </Field>
              <Field label="Service">{humanize(appointment.serviceType) || "General"}</Field>
              {appointment.mode == "IN_PERSON" && (
                <Field label="Office">{appointment.location ?? "Main office"}</Field>
              )}
              {appointment.mode == "VIDEO" && (
                <Field label="Video link">
                  {appointment.meetingLink ? (
                    <a href={appointment.meetingLink} target="_blank" rel="noreferrer" className="text-navy-700 underline">
                      {appointment.meetingLink}
                    </a>
                  ) : (
                    <span className="text-amber-700">Not added yet</span>
                  )}
                </Field>
              )}
              <Field label="Staff member">
                {appointment.assignedTo ? (
                  `${appointment.assignedTo.firstName} ${appointment.assignedTo.lastName}`
                ) : (
                  <span className="text-slate-400">Unassigned</span>
                )}
              </Field>
              {appointment.enquiry && (
                <Field label="From enquiry">
                  {appointment.enquiry.reference} · {appointment.enquiry.subject}
                </Field>
              )}
              <Field label="Booked">{formatDateTime(appointment.createdAt)}</Field>
              {appointment.cancelReason && <Field label="Cancel reason">{appointment.cancelReason}</Field>}
            </dl>
            {appointment.message && (
              <div className="mt-5 rounded-xl bg-navy-50 p-4 text-sm whitespace-pre-line text-slate-700">
                <p className="mb-1 text-xs font-semibold tracking-wide text-navy-800 uppercase">Customer message</p>
                {appointment.message}
              </div>
            )}
            {!canEdit && appointment.staffNotes && (
              <div className="mt-5 rounded-xl bg-gold-100 p-4 text-sm whitespace-pre-line text-slate-700">
                <p className="mb-1 text-xs font-semibold tracking-wide text-navy-800 uppercase">Internal notes</p>
                {appointment.staffNotes}
              </div>
            )}
          </Panel>

          {canEdit && isActive && (
            <Panel title="Reschedule" text="The customer is emailed the new time. Other appointments of the division cannot overlap.">
              <RescheduleForm appointment={appointment} />
            </Panel>
          )}

          {canEdit && (
            <Panel title="Staff, place and notes">
              <DetailsForm appointment={appointment} staff={staff?.ok ? staff.data : []} />
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <p className="font-medium text-navy-900">{customerName(appointment.customer)}</p>
            <p className="mt-1 text-sm text-slate-600">{appointment.customer.email}</p>
            {appointment.customer.phone && <p className="text-sm text-slate-600">{appointment.customer.phone}</p>}
            {appointment.customer.country && <p className="text-sm text-slate-500">{appointment.customer.country}</p>}
            {hasPrivilege(user, "customers:read") && (
              <Link href={`/customers/${appointment.customer.id}`} className="btn-outline btn-sm mt-4">
                Open customer {appointment.customer.reference}
              </Link>
            )}
          </Panel>

          <Panel title="Google Calendar">
            <CalendarPanel appointment={appointment} canEdit={canEdit} />
          </Panel>
        </div>
      </div>
    </>
  );
}

function Panel({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <section className="card rise p-6">
      <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
      {text && <p className="mt-1 text-sm text-slate-500">{text}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-slate-800">{children}</dd>
    </div>
  );
}
