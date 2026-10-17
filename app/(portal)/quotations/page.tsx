import type { Metadata } from "next";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import StatusBadge, { DivisionTag } from "@/components/StatusBadge";
import { apiGet, toQuery } from "@/lib/api";
import { customerName, formatDate, formatMoney } from "@/lib/format";
import { DIVISIONS } from "@/lib/nav";
import { Quotation } from "@/lib/types";

export const metadata: Metadata = { title: "Quotations" };

const STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "REVISED"];

export default async function QuotationsPage({ searchParams }: PageProps<"/quotations">) {
  const params = await searchParams;
  const result = await apiGet<Quotation[]>(
    `/api/quotations${toQuery(params, ["division", "status", "pageNumber"])}`,
  );

  return (
    <>
      <PageHeader eyebrow="Sales" title="Quotations" />
      <FilterBar
        basePath="/quotations"
        searchParams={params}
        selects={[
          { name: "division", label: "Division", options: DIVISIONS },
          { name: "status", label: "Status", options: STATUSES },
        ]}
      />
      {result.ok ? (
        <>
          <DataTable
            rows={result.data}
            empty="No quotations match these filters."
            columns={[
              { header: "Reference", cell: (row) => <span className="font-medium text-navy-900">{row.reference}</span> },
              { header: "Customer", cell: (row) => customerName(row.customer) },
              { header: "Division", cell: (row) => <DivisionTag division={row.division} /> },
              { header: "Total", cell: (row) => formatMoney(row.total, row.currency), className: "text-right whitespace-nowrap" },
              { header: "Status", cell: (row) => <StatusBadge value={row.status} /> },
              { header: "Valid until", cell: (row) => formatDate(row.validUntil), className: "whitespace-nowrap" },
              { header: "Created", cell: (row) => formatDate(row.createdAt), className: "whitespace-nowrap" },
              {
                header: "PDF",
                className: "text-right",
                cell: (row) => (
                  // /api goes through the rewrite to the backend, with the login cookie
                  <div className="flex justify-end gap-2">
                    <a href={`/api/quotations/${row.id}/pdf`} target="_blank" rel="noopener" className="btn-outline btn-sm">
                      View
                    </a>
                    <a href={`/api/quotations/${row.id}/pdf?download=1`} className="btn-navy btn-sm">
                      ↓ PDF
                    </a>
                  </div>
                ),
              },
            ]}
          />
          <Pagination pagination={result.pagination} basePath="/quotations" searchParams={params} />
        </>
      ) : (
        <ErrorNotice message={result.message} />
      )}
    </>
  );
}
