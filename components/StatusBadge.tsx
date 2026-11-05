import { humanize } from "@/lib/format";

// Colour by meaning, so the same idea looks the same on every list
const TONES: Record<string, string> = {
  // waiting for staff
  NEW: "bg-blue-100 text-blue-800",
  PENDING: "bg-amber-100 text-amber-800",
  DRAFT: "bg-slate-100 text-slate-700",
  REQUESTED: "bg-blue-100 text-blue-800",
  // in progress
  ASSIGNED: "bg-indigo-100 text-indigo-800",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800",
  IN_FULFILMENT: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-indigo-100 text-indigo-800", // rental items at the customer
  RETURNED: "bg-green-100 text-green-800",
  AWAITING_CUSTOMER: "bg-amber-100 text-amber-800",
  QUOTED: "bg-violet-100 text-violet-800",
  SENT: "bg-violet-100 text-violet-800",
  REVISED: "bg-slate-100 text-slate-700",
  // overseas job applications and interviews
  APPLIED: "bg-blue-100 text-blue-800",
  SHORTLISTED: "bg-violet-100 text-violet-800",
  INTERVIEWING: "bg-indigo-100 text-indigo-800",
  SCHEDULED: "bg-indigo-100 text-indigo-800",
  SELECTED: "bg-green-100 text-green-800",
  PASSED: "bg-green-100 text-green-800",
  VISA_PROCESSING: "bg-amber-100 text-amber-800",
  MEDICAL: "bg-amber-100 text-amber-800",
  DEPLOYED: "bg-green-100 text-green-800",
  WITHDRAWN: "bg-slate-200 text-slate-700",
  // good outcome
  CONVERTED: "bg-green-100 text-green-800",
  ACCEPTED: "bg-green-100 text-green-800",
  CONFIRMED: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-100 text-green-800",
  PAID: "bg-green-100 text-green-800",
  ACTIVE: "bg-green-100 text-green-800",
  PUBLISHED: "bg-green-100 text-green-800",
  AVAILABLE: "bg-green-100 text-green-800",
  APPROVED: "bg-green-100 text-green-800",
  NOT_REQUIRED: "bg-slate-100 text-slate-600",
  // bad outcome
  CLOSED_LOST: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-slate-200 text-slate-700",
  REJECTED: "bg-red-100 text-red-800",
  EXPIRED: "bg-slate-200 text-slate-700",
  FAILED: "bg-red-100 text-red-800",
  BANNED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-red-100 text-red-800",
  INACTIVE: "bg-slate-200 text-slate-700",
  ARCHIVED: "bg-slate-200 text-slate-700",
  REFUNDED: "bg-slate-200 text-slate-700",
  PARTIALLY_REFUNDED: "bg-amber-100 text-amber-800",
  RESERVED: "bg-amber-100 text-amber-800",
  SOLD: "bg-slate-200 text-slate-700",
  // priority
  LOW: "bg-slate-100 text-slate-700",
  NORMAL: "bg-slate-100 text-slate-700",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export default function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`badge ring-1 ring-black/5 ring-inset ${TONES[value] ?? "bg-slate-100 text-slate-700"}`}>
      {label ?? humanize(value)}
    </span>
  );
}

export const DIVISION_COLOURS: Record<string, string> = {
  TRAVEL: "#1E88E5",
  EVENTS: "#F26B21",
  GEMS: "#8E24AA",
  VEHICLES: "#2E9E4F",
  IMPORT: "#E53935",
  EXPORT: "#E0A100",
};

export function DivisionTag({ division }: { division: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
      <span
        className="h-2.5 w-2.5 rounded-full shadow-[0_0_0_3px_rgb(0_0_0/0.05)]"
        style={{ background: DIVISION_COLOURS[division] ?? "#94a3b8" }}
      />
      {humanize(division)}
    </span>
  );
}
