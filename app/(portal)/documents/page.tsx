import type { Metadata } from "next";
import Link from "next/link";
import ApproveCancel from "@/components/ApproveCancel";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import StatusBadge, { DivisionTag } from "@/components/StatusBadge";
import { apiGet, toQuery } from "@/lib/api";
import { APPROVAL_LABELS, APPROVAL_REQUIRED_TYPES, NO_APPROVAL_TYPES } from "@/lib/documents";
import { customerName, formatDateTime, humanize } from "@/lib/format";
import { DIVISIONS } from "@/lib/nav";
import { CustomerSummary, StaffName } from "@/lib/types";

export const metadata: Metadata = { title: "Document approvals" };

interface ApprovalDocument {
  id: string;
  type: string;
  title: string;
  fileName: string;
  size: number;
  division: string | null;
  entityType: string;
  approval: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  customer: CustomerSummary | null;
  uploadedBy: StaffName;
  reviewedBy: StaffName | null;
}

const TABS = [
  { value: "PENDING", label: "Waiting for approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ALL", label: "All" },
];

function sizeLabel(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function DocumentApprovalsPage({ searchParams }: PageProps<"/documents">) {
  const params = await searchParams;
  const tab = typeof params.approval == "string" ? params.approval : "PENDING";
  const result = await apiGet<ApprovalDocument[]>(
    `/api/documents/approvals${toQuery(params, ["search", "type", "division", "pageNumber"], tab == "ALL" ? {} : { approval: tab })}`,
  );

  function tabHref(value: string) {
    const query = new URLSearchParams();
    for (const key of ["search", "type", "division"]) {
      const current = params[key];
      if (typeof current == "string" && current != "") {
        query.set(key, current);
      }
    }
    query.set("approval", value);
    return `/documents?${query}`;
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Document approvals"
        description="Some documents customers upload must be checked by an admin. Approve them, or cancel them with a reason the customer will see."
      />

      {/* Which documents need approval */}
      <section className="card rise mb-6 grid gap-5 p-5 md:grid-cols-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
            Needs admin approval (customer uploads)
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {APPROVAL_REQUIRED_TYPES.map((type) => (
              <span key={type} className="badge bg-amber-100 text-amber-900 ring-1 ring-amber-200">
                {humanize(type)}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            Accepted automatically
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {NO_APPROVAL_TYPES.map((type) => (
              <span key={type} className="badge bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                {humanize(type)}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Documents uploaded by staff never need approval.</p>
        </div>
      </section>

      <nav aria-label="Approval status" className="mb-4 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <Link
            key={item.value}
            href={tabHref(item.value)}
            aria-current={tab == item.value ? "page" : undefined}
            className={tab == item.value ? "btn-navy btn-sm" : "btn-outline btn-sm"}
          >
            {item.label}
            {item.value == "PENDING" && tab == "PENDING" && result.ok && (result.pagination?.totalCount ?? 0) > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 text-[0.65rem] text-white">{result.pagination?.totalCount}</span>
            )}
          </Link>
        ))}
      </nav>

      <FilterBar
        basePath="/documents"
        searchParams={params}
        searchPlaceholder="Title, file name, customer"
        selects={[
          { name: "type", label: "Document type", options: APPROVAL_REQUIRED_TYPES },
          { name: "division", label: "Division", options: DIVISIONS },
        ]}
      />

      {result.ok ? (
        <>
          <DataTable
            rows={result.data}
            empty={tab == "PENDING" ? "Nothing is waiting for approval." : "No documents found."}
            columns={[
              {
                header: "Document",
                cell: (row) => (
                  <>
                    <p className="font-medium text-navy-900">{row.title}</p>
                    <p className="text-xs text-slate-500">
                      {humanize(row.type)} · {row.fileName} · {sizeLabel(row.size)}
                    </p>
                  </>
                ),
              },
              {
                header: "Customer",
                cell: (row) =>
                  row.customer ? (
                    <>
                      <p>{customerName(row.customer)}</p>
                      <p className="text-xs text-slate-500">{row.customer.email}</p>
                    </>
                  ) : (
                    <span className="text-slate-400">-</span>
                  ),
              },
              {
                header: "Attached to",
                cell: (row) => (
                  <>
                    <p>{humanize(row.entityType)}</p>
                    {row.division && <DivisionTag division={row.division} />}
                  </>
                ),
              },
              { header: "Sent", cell: (row) => formatDateTime(row.createdAt), className: "whitespace-nowrap" },
              {
                header: "Status",
                cell: (row) => (
                  <>
                    <StatusBadge value={row.approval} label={APPROVAL_LABELS[row.approval]} />
                    {row.reviewedBy && (
                      <p className="mt-1 text-xs text-slate-500">
                        by {row.reviewedBy.firstName} {row.reviewedBy.lastName}, {formatDateTime(row.reviewedAt)}
                      </p>
                    )}
                    {row.approval == "CANCELLED" && row.reviewNote && (
                      <p className="mt-1 max-w-56 text-xs text-red-700">Reason: {row.reviewNote}</p>
                    )}
                  </>
                ),
              },
              {
                header: "Actions",
                className: "text-right",
                cell: (row) => (
                  <div className="flex flex-wrap justify-end gap-2">
                    <a href={`/api/documents/${row.id}/download`} target="_blank" rel="noopener" className="btn-outline btn-sm">
                      View
                    </a>
                    {row.approval != "APPROVED" && row.approval != "CANCELLED" ? (
                      <ApproveCancel
                        title={`"${row.title}"`}
                        cancelNeedsReason
                        approve={{
                          method: "POST",
                          path: `/api/documents/${row.id}/review`,
                          body: { decision: "APPROVED" },
                          message: "The document is marked as checked, and the customer gets an email.",
                        }}
                        cancel={{
                          method: "POST",
                          path: `/api/documents/${row.id}/review`,
                          body: { decision: "CANCELLED" },
                          message: "The customer is told the document was not accepted and asked to upload a new copy.",
                        }}
                      />
                    ) : (
                      // a decision can be changed after a re-check
                      <ApproveCancel
                        title={`"${row.title}" again`}
                        cancelNeedsReason
                        approve={{
                          method: "POST",
                          path: `/api/documents/${row.id}/review`,
                          body: { decision: "APPROVED" },
                          message: "Change the decision to approved?",
                        }}
                        cancel={{
                          method: "POST",
                          path: `/api/documents/${row.id}/review`,
                          body: { decision: "CANCELLED" },
                          message: "Change the decision to cancelled?",
                        }}
                      />
                    )}
                  </div>
                ),
              },
            ]}
          />
          <Pagination pagination={result.pagination} basePath="/documents" searchParams={params} />
        </>
      ) : (
        <ErrorNotice message={result.message} />
      )}
    </>
  );
}
