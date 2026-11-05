import type { Metadata } from "next";
import Link from "next/link";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import StatusBadge from "@/components/StatusBadge";
import { apiGet, toQuery } from "@/lib/api";
import { customerName, formatAppointmentTime, formatDate } from "@/lib/format";
import { APPLICATION_STATUS_LABELS, INTERVIEW_STAGE_LABELS, JobApplication } from "@/lib/types";

export const metadata: Metadata = { title: "Job applications" };

// Next interview still to happen, if any
function nextInterview(application: JobApplication) {
  return application.interviews.find((interview) => interview.result == "SCHEDULED");
}

export default async function JobApplicationsPage({ searchParams }: PageProps<"/jobs/applications">) {
  const params = await searchParams;
  const result = await apiGet<JobApplication[]>(
    `/api/jobs/applications${toQuery(params, ["search", "status", "vacancyId", "pageNumber"])}`,
  );

  return (
    <>
      <PageHeader
        eyebrow="Travel · Work visas"
        title="Job applications"
        description="Candidates who applied for overseas jobs on the website. Shortlist them, send interview invitations, record results and follow the visa to departure."
        color="#1E88E5"
        actions={
          <>
            <Link href="/jobs/applications?status=APPLIED" className="btn-gold">
              New applications
            </Link>
            <Link href="/catalogue/jobs" className="btn-glass">
              Job vacancies
            </Link>
          </>
        }
      />
      <FilterBar
        basePath="/jobs/applications"
        searchParams={params}
        searchPlaceholder="Name, phone, passport, job or country"
        selects={[{ name: "status", label: "Status", options: Object.keys(APPLICATION_STATUS_LABELS), labels: APPLICATION_STATUS_LABELS }]}
      />
      {result.ok ? (
        <>
          <DataTable
            rows={result.data}
            empty="No applications match these filters."
            columns={[
              {
                header: "Candidate",
                cell: (row) => (
                  <Link href={`/jobs/applications/${row.id}`} className="group block">
                    <p className="font-medium text-navy-900 group-hover:underline">{customerName(row.customer)}</p>
                    <p className="text-xs text-slate-500">{row.customer.phone ?? row.customer.email}</p>
                  </Link>
                ),
              },
              {
                header: "Job",
                cell: (row) => (
                  <>
                    <p className="text-navy-900">{row.vacancy.title}</p>
                    <p className="text-xs text-slate-500">
                      {row.vacancy.country} · {row.vacancy.reference}
                    </p>
                  </>
                ),
              },
              {
                header: "Reference",
                cell: (row) => (
                  <Link href={`/jobs/applications/${row.id}`} className="font-mono text-xs text-navy-900 hover:underline">
                    {row.reference}
                  </Link>
                ),
              },
              {
                header: "Next interview",
                cell: (row) => {
                  const next = nextInterview(row);
                  return next ? (
                    <>
                      <p className="text-sm whitespace-nowrap">{formatAppointmentTime(next.scheduledAt)}</p>
                      <p className="text-xs text-slate-500">{INTERVIEW_STAGE_LABELS[next.stage] ?? next.stage}</p>
                    </>
                  ) : (
                    <span className="text-slate-400">-</span>
                  );
                },
              },
              { header: "Applied", className: "whitespace-nowrap", cell: (row) => formatDate(row.createdAt) },
              { header: "Status", cell: (row) => <StatusBadge value={row.status} label={APPLICATION_STATUS_LABELS[row.status]} /> },
            ]}
          />
          <Pagination pagination={result.pagination} basePath="/jobs/applications" searchParams={params} />
        </>
      ) : (
        <ErrorNotice message={result.message} />
      )}
    </>
  );
}
