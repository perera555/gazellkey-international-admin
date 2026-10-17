import type { Metadata } from "next";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import StatusBadge, { DivisionTag } from "@/components/StatusBadge";
import { apiGet, toQuery } from "@/lib/api";
import { customerName, formatDate, humanize } from "@/lib/format";
import { DIVISIONS } from "@/lib/nav";
import { Enquiry } from "@/lib/types";

export const metadata: Metadata = { title: "Enquiries" };

const STATUSES = ["NEW", "ASSIGNED", "IN_PROGRESS", "AWAITING_CUSTOMER", "QUOTED", "CONVERTED", "CLOSED_LOST", "CANCELLED"];
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];

export default async function EnquiriesPage({ searchParams }: PageProps<"/enquiries">) {
  const params = await searchParams;
  const result = await apiGet<Enquiry[]>(
    `/api/enquiries${toQuery(params, ["search", "division", "status", "priority", "pageNumber"])}`,
  );

  return (
    <>
      <PageHeader eyebrow="Sales" title="Enquiries" description="Every enquiry from the website and staff, newest first." />
      <FilterBar
        basePath="/enquiries"
        searchParams={params}
        searchPlaceholder="Reference, subject, customer email"
        selects={[
          { name: "division", label: "Division", options: DIVISIONS },
          { name: "status", label: "Status", options: STATUSES },
          { name: "priority", label: "Priority", options: PRIORITIES },
        ]}
      />
      {result.ok ? (
        <>
          <DataTable
            rows={result.data}
            empty="No enquiries match these filters."
            columns={[
              { header: "Reference", cell: (row) => <span className="font-medium text-navy-900">{row.reference}</span> },
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
                    <p className="text-xs text-slate-500">{humanize(row.serviceType)}</p>
                  </>
                ),
              },
              { header: "Division", cell: (row) => <DivisionTag division={row.division} /> },
              { header: "Priority", cell: (row) => <StatusBadge value={row.priority} /> },
              { header: "Status", cell: (row) => <StatusBadge value={row.status} /> },
              {
                header: "Assigned to",
                cell: (row) =>
                  row.assignedTo ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}` : (
                    <span className="text-slate-400">Unassigned</span>
                  ),
              },
              { header: "Received", cell: (row) => formatDate(row.createdAt), className: "whitespace-nowrap" },
            ]}
          />
          <Pagination pagination={result.pagination} basePath="/enquiries" searchParams={params} />
        </>
      ) : (
        <ErrorNotice message={result.message} />
      )}
    </>
  );
}
