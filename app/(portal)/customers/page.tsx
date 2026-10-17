import type { Metadata } from "next";
import Link from "next/link";
import DataTable from "@/components/DataTable";
import DeleteRestore from "@/components/DeleteRestore";
import StatusBadge from "@/components/StatusBadge";
import FilterBar from "@/components/FilterBar";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { apiGet, toQuery } from "@/lib/api";
import { customerName, formatDate, humanize } from "@/lib/format";
import { CUSTOMERS } from "@/lib/resources";
import { getSessionUser, hasPrivilege } from "@/lib/session";
import { Customer } from "@/lib/types";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/customers">) {
  const params = await searchParams;
  const [result, me] = await Promise.all([
    apiGet<Customer[]>(`/api/customers${toQuery(params, ["search", "status", "pageNumber"])}`),
    getSessionUser(),
  ]);
  const canEdit = me != null && hasPrivilege(me, CUSTOMERS.privilege);

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Customers"
        description={CUSTOMERS.description}
        actions={
          canEdit && (
            <Link href="/customers/new" className="btn-gold">
              + Add customer
            </Link>
          )
        }
      />
      <FilterBar
        basePath="/customers"
        searchParams={params}
        searchPlaceholder="Name, company, email, reference"
        selects={[
          {
            name: "status",
            label: "Show",
            options: ["INACTIVE"],
            labels: { INACTIVE: "Deleted customers" },
            allLabel: "Active customers",
          },
        ]}
      />
      {result.ok ? (
        <>
          <DataTable
            rows={result.data}
            empty="No customers found."
            columns={[
              { header: "Reference", cell: (row) => <span className="font-medium text-navy-900">{row.reference}</span> },
              { header: "Name", cell: (row) => customerName(row) },
              { header: "Type", cell: (row) => humanize(row.type) },
              {
                header: "Contact",
                cell: (row) => (
                  <>
                    <p>{row.email}</p>
                    {row.phone && <p className="text-xs text-slate-500">{row.phone}</p>}
                  </>
                ),
              },
              { header: "Country", cell: (row) => row.country ?? "" },
              { header: "Enquiries", cell: (row) => row._count?.enquiries ?? 0, className: "text-right" },
              { header: "Orders", cell: (row) => row._count?.orders ?? 0, className: "text-right" },
              { header: "Since", cell: (row) => formatDate(row.createdAt), className: "whitespace-nowrap" },
              {
                header: "Status",
                cell: (row) =>
                  row.status == "INACTIVE" ? (
                    <span className="badge bg-red-100 text-red-800 ring-1 ring-black/5 ring-inset">Deleted</span>
                  ) : (
                    <StatusBadge value="ACTIVE" />
                  ),
              },
              ...(canEdit
                ? [
                    {
                      header: "Actions",
                      className: "text-right",
                      cell: (row: Customer) => (
                        <div className="flex justify-end gap-2">
                          <Link href={`/customers/${row.id}`} className="btn-outline btn-sm">
                            Edit
                          </Link>
                          <DeleteRestore
                            small
                            resourceKey="customers"
                            id={row.id}
                            title={customerName(row)}
                            status={row.status}
                          />
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
          <Pagination pagination={result.pagination} basePath="/customers" searchParams={params} />
        </>
      ) : (
        <ErrorNotice message={result.message} />
      )}
    </>
  );
}
