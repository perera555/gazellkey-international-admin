import type { Metadata } from "next";
import Link from "next/link";
import DeleteRestore from "@/components/DeleteRestore";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import StatusBadge, { DivisionTag } from "@/components/StatusBadge";
import { apiGet, toQuery } from "@/lib/api";
import { DIVISIONS } from "@/lib/nav";
import { SUPPLIERS } from "@/lib/resources";
import { getSessionUser, hasPrivilege } from "@/lib/session";
import { Supplier } from "@/lib/types";

export const metadata: Metadata = { title: "Suppliers" };

export default async function SuppliersPage({ searchParams }: PageProps<"/suppliers">) {
  const params = await searchParams;
  const [result, me] = await Promise.all([
    apiGet<Supplier[]>(`/api/suppliers${toQuery(params, ["search", "division", "status", "pageNumber"])}`),
    getSessionUser(),
  ]);
  const canEdit = me != null && hasPrivilege(me, SUPPLIERS.privilege);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Suppliers"
        description={SUPPLIERS.description}
        actions={
          canEdit && (
            <Link href="/suppliers/new" className="btn-gold">
              + Add supplier
            </Link>
          )
        }
      />
      <FilterBar
        basePath="/suppliers"
        searchParams={params}
        searchPlaceholder="Name, contact, email"
        selects={[
          { name: "division", label: "Division", options: DIVISIONS },
          { name: "status", label: "Status", options: ["ACTIVE", "INACTIVE"] },
        ]}
      />
      {result.ok ? (
        <>
          <DataTable
            rows={result.data}
            empty="No suppliers match these filters."
            columns={[
              {
                header: "Supplier",
                cell: (row) => (
                  <>
                    <p className="font-medium text-navy-900">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.reference}</p>
                  </>
                ),
              },
              {
                header: "Contact",
                cell: (row) => (
                  <>
                    <p>{row.contactName ?? ""}</p>
                    <p className="text-xs text-slate-500">{[row.email, row.phone].filter(Boolean).join(" · ")}</p>
                  </>
                ),
              },
              { header: "Country", cell: (row) => row.country ?? "" },
              {
                header: "Divisions",
                cell: (row) => (
                  <div className="flex flex-col gap-1">
                    {row.divisions.map((division) => (
                      <DivisionTag key={division} division={division} />
                    ))}
                  </div>
                ),
              },
              { header: "Products", cell: (row) => row.productsSupplied.join(", ") },
              { header: "Status", cell: (row) => <StatusBadge value={row.status} /> },
              ...(canEdit
                ? [
                    {
                      header: "Actions",
                      className: "text-right",
                      cell: (row: Supplier) => (
                        <div className="flex justify-end gap-2">
                          <Link href={`/suppliers/${row.id}`} className="btn-outline btn-sm">
                            Edit
                          </Link>
                          <DeleteRestore small resourceKey="suppliers" id={row.id} title={row.name} status={row.status} />
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
          <Pagination pagination={result.pagination} basePath="/suppliers" searchParams={params} />
        </>
      ) : (
        <ErrorNotice message={result.message} />
      )}
    </>
  );
}
