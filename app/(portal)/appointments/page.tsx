import type { Metadata } from "next";
import Link from "next/link";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import StatusBadge, { DivisionTag } from "@/components/StatusBadge";
import { apiGet, toQuery } from "@/lib/api";
import {
  customerName,
  formatAppointmentTime,
  formatOfficeClock,
  humanize,
  MODE_LABELS,
} from "@/lib/format";
import { DIVISIONS } from "@/lib/nav";
import { Appointment } from "@/lib/types";

export const metadata: Metadata = { title: "Appointments" };

const STATUSES = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
const MODES = ["IN_PERSON", "PHONE", "VIDEO"];

// Opens on upcoming appointments, soonest first. "When: All dates" shows history.
export default async function AppointmentsPage({ searchParams }: PageProps<"/appointments">) {
  const params = await searchParams;
  const filters = { ...params, upcoming: params.upcoming ?? "true" };
  const result = await apiGet<Appointment[]>(
    `/api/appointments${toQuery(filters, ["search", "division", "status", "mode", "assignedTo", "upcoming", "pageNumber"])}`,
  );

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Appointments"
        description="Office visits, phone and video calls booked by customers. New requests (yellow) and confirmed ones (green) are added to the company Google Calendar."
        actions={
          <Link href="/appointments?status=REQUESTED" className="btn-gold">
            Waiting for confirmation
          </Link>
        }
      />
      <FilterBar
        basePath="/appointments"
        searchParams={filters}
        searchPlaceholder="Reference, subject, customer email"
        selects={[
          { name: "upcoming", label: "When", options: ["true"], labels: { true: "Upcoming" }, allLabel: "All dates" },
          { name: "division", label: "Division", options: DIVISIONS },
          { name: "status", label: "Status", options: STATUSES },
          { name: "mode", label: "Type", options: MODES, labels: MODE_LABELS },
          {
            name: "assignedTo",
            label: "Assigned to",
            options: ["me", "none"],
            labels: { me: "Me", none: "Unassigned" },
            allLabel: "Anyone",
          },
        ]}
      />
      {result.ok ? (
        <>
          <DataTable
            rows={result.data}
            empty="No appointments match these filters."
            columns={[
              {
                header: "When",
                className: "whitespace-nowrap",
                cell: (row) => (
                  <Link href={`/appointments/${row.id}`} className="group block">
                    <p className="font-medium text-navy-900 group-hover:underline">{formatAppointmentTime(row.startAt)}</p>
                    <p className="text-xs text-slate-500">until {formatOfficeClock(row.endAt)}</p>
                  </Link>
                ),
              },
              {
                header: "Reference",
                cell: (row) => (
                  <Link href={`/appointments/${row.id}`} className="font-medium text-navy-900 hover:underline">
                    {row.reference}
                  </Link>
                ),
              },
              {
                header: "Customer",
                cell: (row) => (
                  <>
                    <p>{customerName(row.customer)}</p>
                    <p className="text-xs text-slate-500">{row.customer.email}</p>
                  </>
                ),
              },
              {
                header: "Subject",
                cell: (row) => (
                  <>
                    <p>{row.subject}</p>
                    <p className="text-xs text-slate-500">{MODE_LABELS[row.mode] ?? humanize(row.mode)}</p>
                  </>
                ),
              },
              { header: "Division", cell: (row) => <DivisionTag division={row.division} /> },
              { header: "Status", cell: (row) => <StatusBadge value={row.status} /> },
              {
                header: "Assigned to",
                cell: (row) =>
                  row.assignedTo ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}` : (
                    <span className="text-slate-400">Unassigned</span>
                  ),
              },
            ]}
          />
          <Pagination pagination={result.pagination} basePath="/appointments" searchParams={filters} />
        </>
      ) : (
        <ErrorNotice message={result.message} />
      )}
    </>
  );
}
