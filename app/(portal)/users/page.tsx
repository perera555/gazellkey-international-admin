import type { Metadata } from "next";
import Link from "next/link";
import DeleteRestore from "@/components/DeleteRestore";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import StatusBadge, { DivisionTag } from "@/components/StatusBadge";
import { apiGet, toQuery } from "@/lib/api";
import { formatDate, formatDateTime, humanize } from "@/lib/format";
import { ROLES, USERS, USER_STATUSES } from "@/lib/resources";
import { getSessionUser, hasPrivilege } from "@/lib/session";
import { User } from "@/lib/types";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: PageProps<"/users">) {
  const params = await searchParams;
  const [result, me] = await Promise.all([
    apiGet<User[]>(`/api/users${toQuery(params, ["search", "role", "status", "pageNumber"])}`),
    getSessionUser(),
  ]);
  const canEdit = me != null && hasPrivilege(me, USERS.privilege);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description={USERS.description}
        actions={
          canEdit && (
            <Link href="/users/new" className="btn-gold">
              + Add user
            </Link>
          )
        }
      />
      <FilterBar
        basePath="/users"
        searchParams={params}
        searchPlaceholder="Name or email"
        selects={[
          { name: "role", label: "Role", options: ROLES },
          { name: "status", label: "Status", options: USER_STATUSES },
        ]}
      />
      {result.ok ? (
        <>
          <DataTable
            rows={result.data}
            empty="No users match these filters."
            columns={[
              {
                header: "Name",
                cell: (row) => (
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy-900 text-xs font-bold text-gold-400 shadow-[0_3px_0_var(--color-navy-950)]">
                      {row.firstName.charAt(0)}
                      {row.lastName.charAt(0)}
                    </span>
                    <div>
                      <p className="font-medium text-navy-900">
                        {row.firstName} {row.lastName}
                        {row.id == me?.id && <span className="ml-2 text-xs text-gold-600">(you)</span>}
                      </p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </div>
                  </div>
                ),
              },
              { header: "Role", cell: (row) => humanize(row.role) },
              {
                header: "Divisions",
                cell: (row) =>
                  row.divisions.length == 0 ? (
                    <span className="text-slate-400">-</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {row.divisions.map((division) => (
                        <DivisionTag key={division} division={division} />
                      ))}
                    </div>
                  ),
              },
              { header: "Status", cell: (row) => <StatusBadge value={row.status} /> },
              { header: "Last sign in", cell: (row) => formatDateTime(row.lastLogin) || "Never", className: "whitespace-nowrap" },
              { header: "Created", cell: (row) => formatDate(row.createdAt), className: "whitespace-nowrap" },
              ...(canEdit
                ? [
                    {
                      header: "Actions",
                      className: "text-right",
                      cell: (row: User) => (
                        <div className="flex justify-end gap-2">
                          <Link href={`/users/${row.id}`} className="btn-outline btn-sm">
                            Edit
                          </Link>
                          {row.id != me?.id && (
                            <DeleteRestore
                              small
                              resourceKey="users"
                              id={row.id}
                              title={`${row.firstName} ${row.lastName}`}
                              status={row.status}
                            />
                          )}
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
          <Pagination pagination={result.pagination} basePath="/users" searchParams={params} />
        </>
      ) : (
        <ErrorNotice message={result.message} />
      )}
    </>
  );
}
