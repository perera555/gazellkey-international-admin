import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import {
  ApplicationNotesForm,
  ApplicationStatusActions,
  InterviewInviteForm,
  InterviewResultActions,
} from "@/components/JobActions";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { apiGet, apiGetOne } from "@/lib/api";
import { customerName, formatAppointmentTime, formatDate, formatDateTime, humanize, MODE_LABELS } from "@/lib/format";
import { hasPrivilege, requireStaff } from "@/lib/session";
import {
  APPLICATION_STATUS_LABELS,
  INTERVIEW_RESULT_LABELS,
  INTERVIEW_STAGE_LABELS,
  JobApplication,
} from "@/lib/types";

export const metadata: Metadata = { title: "Job application" };

type AttachedDocument = { id: string; type: string; title: string; fileName: string; approval: string; createdAt: string };

// Age on today's date from a "YYYY-MM-DD..." birthday
function ageOf(dateOfBirth: string) {
  const born = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  if (now.getUTCMonth() < born.getUTCMonth() || (now.getUTCMonth() == born.getUTCMonth() && now.getUTCDate() < born.getUTCDate())) {
    age--;
  }
  return age;
}

export default async function JobApplicationPage({ params }: PageProps<"/jobs/applications/[id]">) {
  const { id } = await params;
  const [application, documents, user] = await Promise.all([
    apiGetOne<JobApplication>(`/api/jobs/applications/${encodeURIComponent(id)}`),
    apiGet<AttachedDocument[]>(`/api/documents?entityType=JOB_APPLICATION&entityId=${encodeURIComponent(id)}`),
    requireStaff(),
  ]);
  const canEdit = hasPrivilege(user, "travel:cases");
  const { vacancy } = application;

  return (
    <>
      <PageHeader
        eyebrow={`Application ${application.reference}`}
        title={`${customerName(application.customer)} - ${vacancy.title}`}
        description={`${vacancy.country} · job ${vacancy.reference} · applied ${formatDateTime(application.createdAt)}`}
        color="#1E88E5"
        back={{ href: "/jobs/applications", label: "Job applications" }}
        actions={<StatusBadge value={application.status} label={APPLICATION_STATUS_LABELS[application.status]} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          {canEdit && (
            <Panel
              title="Next step"
              text="You decide: invite the candidate to an interview (below) or accept them without one. Book a medical only when the country or employer needs it, then send them to visa processing."
            >
              {application.rejectReason && (
                <p className="mb-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">Reason given: {application.rejectReason}</p>
              )}
              <ApplicationStatusActions application={application} />
            </Panel>
          )}

          <Panel
            title="Interviews and medical"
            text="Our office interview, employer interview, trade test, embassy interview and medical test. Each one is emailed to the candidate and shows in their account."
          >
            {application.interviews.length == 0 ? (
              <p className="text-sm text-slate-500">No interviews yet.</p>
            ) : (
              <ol className="space-y-3">
                {application.interviews.map((interview) => (
                  <li key={interview.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-navy-900">{INTERVIEW_STAGE_LABELS[interview.stage] ?? humanize(interview.stage)}</p>
                        <p className="text-sm text-slate-700">
                          {formatAppointmentTime(interview.scheduledAt)} · {MODE_LABELS[interview.mode] ?? humanize(interview.mode)}
                        </p>
                        {interview.location && <p className="text-sm break-all text-slate-600">{interview.location}</p>}
                        {interview.interviewer && <p className="text-xs text-slate-500">By {interview.interviewer}</p>}
                        {interview.instructions && <p className="mt-2 text-sm whitespace-pre-line text-slate-600">{interview.instructions}</p>}
                      </div>
                      <StatusBadge value={interview.result} label={INTERVIEW_RESULT_LABELS[interview.result]} />
                    </div>
                    {canEdit && (
                      <div className="mt-3">
                        <InterviewResultActions interview={interview} />
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          {canEdit && application.canInterview && (
            <Panel title="Invite to an interview or book a medical (optional)">
              <InterviewInviteForm application={application} />
            </Panel>
          )}

          <Panel title="Candidate details">
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <Field label="Date of birth">
                {application.dateOfBirth ? `${formatDate(application.dateOfBirth)} (age ${ageOf(application.dateOfBirth)})` : "Not given"}
              </Field>
              <Field label="Passport number">{application.passportNumber ?? "Not given"}</Field>
              <Field label="Passport expiry">{application.passportExpiry ? formatDate(application.passportExpiry) : "Not given"}</Field>
              <Field label="Experience">{application.experienceYears != null ? `${application.experienceYears} years` : "Not given"}</Field>
              <Field label="Current / last job">{application.currentJob ?? "Not given"}</Field>
            </dl>
            {application.message && (
              <div className="mt-5 rounded-xl bg-navy-50 p-4 text-sm whitespace-pre-line text-slate-700">
                <p className="mb-1 text-xs font-semibold tracking-wide text-navy-800 uppercase">Message from the candidate</p>
                {application.message}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Candidate">
            <p className="font-medium text-navy-900">{customerName(application.customer)}</p>
            {application.customer.phone && (
              <p className="mt-1 text-sm font-medium text-navy-800">
                <a href={`tel:${application.customer.phone}`}>{application.customer.phone}</a>
              </p>
            )}
            <p className="text-sm text-slate-600">{application.customer.email}</p>
            {hasPrivilege(user, "customers:read") && (
              <Link href={`/customers/${application.customer.id}`} className="btn-outline btn-sm mt-4">
                Open customer {application.customer.reference}
              </Link>
            )}
          </Panel>

          <Panel title="CV and documents" text="Passport copies are visible only to staff allowed to see personal documents.">
            {documents.ok && documents.data.length > 0 ? (
              <ul className="space-y-2">
                {documents.data.map((document) => (
                  <li key={document.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy-900">{document.title}</p>
                      <p className="truncate text-xs text-slate-500">{document.fileName}</p>
                    </div>
                    <a href={`/api/documents/${document.id}/download`} target="_blank" rel="noopener" className="btn-outline btn-sm shrink-0">
                      Open
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">{documents.ok ? "No documents you can see." : documents.message}</p>
            )}
          </Panel>

          <Panel title="The job">
            <p className="font-medium text-navy-900">{vacancy.title}</p>
            <p className="text-sm text-slate-600">{[vacancy.city, vacancy.country].filter(Boolean).join(", ")}</p>
            {vacancy.interviewAt && (
              <p className="mt-2 text-sm text-slate-600">Announced interview: {formatAppointmentTime(vacancy.interviewAt)}</p>
            )}
            <Link href={`/jobs/applications?vacancyId=${vacancy.id}`} className="btn-outline btn-sm mt-4">
              All applicants for this job
            </Link>
          </Panel>

          {canEdit ? (
            <Panel title="Internal notes">
              <ApplicationNotesForm application={application} />
            </Panel>
          ) : (
            application.staffNotes && (
              <Panel title="Internal notes">
                <p className="text-sm whitespace-pre-line text-slate-700">{application.staffNotes}</p>
              </Panel>
            )
          )}
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
