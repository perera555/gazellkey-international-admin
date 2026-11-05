"use client";

import { FormEvent, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ConfirmAction from "@/components/ConfirmAction";
import { apiRequest } from "@/lib/api-client";
import { fromOfficeInput } from "@/lib/format";
import { INTERVIEW_STAGE_LABELS, JobApplication, JobInterview } from "@/lib/types";

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

const STEPS = [
  {
    status: "SHORTLISTED",
    label: "Shortlist",
    title: "Shortlist this candidate?",
    message: "The candidate is emailed that they are shortlisted and that interview details will follow. Invite them to an interview next.",
  },
  {
    status: "SELECTED",
    label: "Mark selected",
    title: "Candidate selected?",
    message: "Use this after the interviews, or straight away when no interview is needed. The candidate is emailed a congratulations message and told the team will call about the medical and visa documents.",
  },
  {
    status: "MEDICAL",
    label: "Medical needed",
    title: "Does this candidate need a medical test?",
    message: "The candidate is told the next step is a medical test. Then book it with Invite / book below (choose Medical test) so the date and medical centre show in their account. Skip this when no medical is needed.",
  },
  {
    status: "VISA_PROCESSING",
    label: "Send to visa processing",
    title: "Start the work visa?",
    message: "Use this when the candidate is accepted - with or without an interview - and the medical, visa submission and SLBFE registration start. The candidate is told the visa is being processed.",
  },
  {
    status: "DEPLOYED",
    label: "Mark departed",
    title: "Candidate has left for the job?",
    message: "This closes the file. The candidate gets a 'safe journey' message.",
  },
] as const;

// Shortlist / selected / visa / departed / reject - only the next steps of the current status
export function ApplicationStatusActions({ application }: { application: JobApplication }) {
  const path = `/api/jobs/applications/${application.id}`;
  const next = application.nextStatuses ?? [];
  if (next.length == 0) {
    return <p className="text-sm text-slate-500">This application is closed.</p>;
  }
  return (
    <div className="flex flex-wrap gap-3">
      {STEPS.filter((step) => next.includes(step.status)).map((step) => (
        <ConfirmAction
          key={step.status}
          tone="gold"
          label={step.label}
          title={step.title}
          message={step.message}
          method="PUT"
          path={path}
          body={{ status: step.status }}
        />
      ))}
      {next.includes("REJECTED") && <RejectButton applicationId={application.id} />}
    </div>
  );
}

const QUICK_REASONS = [
  "Not enough experience for this job",
  "Did not pass the interview",
  "Age or other requirement not met",
  "All positions are filled",
];

function RejectButton({ applicationId }: { applicationId: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const saved = useSaved();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function reject(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await apiRequest("PUT", `/api/jobs/applications/${applicationId}`, {
      status: "REJECTED",
      rejectReason: reason.trim(),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.data.message ?? "Could not save.");
      return;
    }
    dialog.current?.close();
    saved("Application rejected");
  }

  return (
    <>
      <button type="button" className="btn-danger" onClick={() => dialog.current?.showModal()}>
        Not selected
      </button>
      <dialog ref={dialog} className="modal" aria-labelledby="job-reject-title">
        <form onSubmit={reject} className="card space-y-4 p-6">
          <h2 id="job-reject-title" className="heading-display text-xl">
            Close this application?
          </h2>
          <p className="text-sm text-slate-600">
            The candidate is emailed politely with your reason and invited to apply for other jobs. Scheduled interviews are cancelled.
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_REASONS.map((text) => (
              <button key={text} type="button" onClick={() => setReason(text)} className="badge cursor-pointer bg-navy-50 text-navy-800 hover:bg-navy-100">
                {text}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="job-reject-reason" className="label">
              Reason (the candidate sees it) *
            </label>
            <textarea
              id="job-reject-reason"
              required
              maxLength={500}
              rows={3}
              className="input"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <ErrorText text={error} />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => dialog.current?.close()} className="btn-outline">
              Keep it open
            </button>
            <button type="submit" disabled={busy} className="btn-danger-solid">
              {busy ? "Saving..." : "Not selected"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

// Invite the candidate to an interview: office, employer, trade test or embassy
export function InterviewInviteForm({ application }: { application: JobApplication }) {
  const saved = useSaved();
  const [mode, setMode] = useState("IN_PERSON");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formKey, setFormKey] = useState(0);
  const announced = application.vacancy.interviewPlace ?? "";

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const value = (name: string) => {
      const text = String(form.get(name) ?? "").trim();
      return text == "" ? undefined : text;
    };
    const when = value("scheduledAt");
    const result = await apiRequest("POST", `/api/jobs/applications/${application.id}/interviews`, {
      stage: value("stage"),
      mode: mode,
      scheduledAt: when ? fromOfficeInput(when) : undefined,
      location: value("location"),
      interviewer: value("interviewer"),
      instructions: value("instructions"),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.data.message ?? "Could not schedule the interview.");
      return;
    }
    setFormKey((key) => key + 1);
    saved("Interview scheduled - the candidate has been emailed");
  }

  return (
    <form key={formKey} onSubmit={invite} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="stage" className="label">Interview *</label>
        <select id="stage" name="stage" required className="input" defaultValue={application.interviews.length == 0 ? "OFFICE" : "EMPLOYER"}>
          {Object.entries(INTERVIEW_STAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="mode" className="label">How *</label>
        <select id="mode" name="mode" required className="input" value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="IN_PERSON">In person</option>
          <option value="VIDEO">Video call</option>
          <option value="PHONE">Phone call</option>
        </select>
      </div>
      <div>
        <label htmlFor="scheduledAt" className="label">Date and time (Sri Lanka) *</label>
        <input id="scheduledAt" name="scheduledAt" type="datetime-local" required className="input" />
      </div>
      <div>
        <label htmlFor="interviewer" className="label">Interviewer / medical centre</label>
        <input id="interviewer" name="interviewer" maxLength={200} className="input" placeholder="Employer HR team / UAE Embassy" />
      </div>
      {mode != "PHONE" && (
        <div className="sm:col-span-2">
          <label htmlFor="location" className="label">{mode == "VIDEO" ? "Video link *" : "Address *"}</label>
          <input
            id="location"
            name="location"
            required
            maxLength={500}
            className="input"
            defaultValue={mode == "IN_PERSON" ? announced : ""}
            placeholder={mode == "VIDEO" ? "https://meet.google.com/..." : "Gazellekey International head office"}
          />
        </div>
      )}
      <div className="sm:col-span-2">
        <label htmlFor="instructions" className="label">Message to the candidate</label>
        <textarea
          id="instructions"
          name="instructions"
          rows={2}
          maxLength={2000}
          className="input"
          placeholder="Come 30 minutes early in neat dress. Bring your original certificates."
        />
      </div>
      <div className="space-y-3 sm:col-span-2">
        <ErrorText text={error} />
        <button type="submit" disabled={busy} className="btn-gold">
          {busy ? "Sending..." : "Send invitation"}
        </button>
        <p className="text-xs text-slate-500">The candidate gets an email (and SMS when set up) and sees the interview in My account.</p>
      </div>
    </form>
  );
}

// Passed / failed / did not attend / cancel a scheduled interview
export function InterviewResultActions({ interview }: { interview: JobInterview }) {
  const path = `/api/jobs/interviews/${interview.id}`;
  if (interview.result != "SCHEDULED") {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-2">
      <ConfirmAction small tone="gold" label="Passed" title="Candidate passed?" message="The candidate is told they passed and that the next step follows." method="PUT" path={path} body={{ result: "PASSED" }} />
      <ConfirmAction small tone="outline" label="Failed" title="Candidate did not pass?" message="The candidate is told the result. Use 'Not selected' on the application to close it." method="PUT" path={path} body={{ result: "FAILED" }} />
      <ConfirmAction small tone="outline" label="Did not attend" title="Candidate did not attend?" message="The candidate is told and asked to contact you." method="PUT" path={path} body={{ result: "NO_SHOW" }} />
      <ConfirmAction small tone="outline" label="Cancel" title="Cancel this interview?" message="The candidate is told the interview is cancelled." method="PUT" path={path} body={{ result: "CANCELLED" }} />
    </div>
  );
}

// Internal notes on the application
export function ApplicationNotesForm({ application }: { application: JobApplication }) {
  const saved = useSaved();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const notes = String(new FormData(event.currentTarget).get("staffNotes") ?? "").trim();
    const result = await apiRequest("PUT", `/api/jobs/applications/${application.id}`, { staffNotes: notes == "" ? null : notes });
    setBusy(false);
    if (!result.ok) {
      setError(result.data.message ?? "Could not save.");
      return;
    }
    saved("Notes saved");
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <textarea
        name="staffNotes"
        rows={4}
        maxLength={5000}
        className="input"
        aria-label="Internal notes"
        defaultValue={application.staffNotes ?? ""}
        placeholder="Interview feedback, medical date, visa number ... (candidates never see this)"
      />
      <ErrorText text={error} />
      <button type="submit" disabled={busy} className="btn-navy btn-sm">
        {busy ? "Saving..." : "Save notes"}
      </button>
    </form>
  );
}
