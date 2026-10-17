import type { Metadata } from "next";
import Link from "next/link";
import ApproveCancel from "@/components/ApproveCancel";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import StatusBadge, { DivisionTag } from "@/components/StatusBadge";
import { apiGet, toQuery } from "@/lib/api";
import { customerName, formatDate, formatMoney } from "@/lib/format";
import { DIVISIONS } from "@/lib/nav";
import { getSessionUser, hasPrivilege } from "@/lib/session";
import { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Orders & bookings" };

const STATUSES = ["PENDING", "CONFIRMED", "IN_FULFILMENT", "COMPLETED", "CANCELLED"];

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const params = await searchParams;
  const [result, me] = await Promise.all([
    apiGet<Order[]>(`/api/orders${toQuery(params, ["search", "division", "status", "pageNumber"])}`),
    getSessionUser(),
  ]);
  const canApprove = me != null && hasPrivilege(me, "orders:edit");
  const waitingOnly = params.status == "PENDING";

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Orders & bookings"
        description="A customer's order (accepted quotation or event booking) waits as Pending until an admin approves or cancels it. The customer is emailed either way. Online shop orders become Confirmed as soon as the card payment is confirmed, or when Finance confirms the bank transfer."
        actions={
          <Link href={waitingOnly ? "/orders" : "/orders?status=PENDING"} className={waitingOnly ? "btn-glass" : "btn-gold"}>
            {waitingOnly ? "Show all orders" : "Waiting for approval"}
          </Link>
        }
      />
      <FilterBar
        basePath="/orders"
        searchParams={params}
        searchPlaceholder="Reference"
        selects={[
          { name: "division", label: "Division", options: DIVISIONS },
          { name: "status", label: "Status", options: STATUSES, labels: { PENDING: "Waiting for approval" } },
        ]}
      />
      {result.ok ? (
        <>
          <DataTable
            rows={result.data}
            empty={waitingOnly ? "No orders are waiting for approval." : "No orders match these filters."}
            columns={[
              { header: "Reference", cell: (row) => <span className="font-medium text-navy-900">{row.reference}</span> },
              { header: "Customer", cell: (row) => customerName(row.customer) },
              { header: "Division", cell: (row) => <DivisionTag division={row.division} /> },
              {
                header: "Quotation",
                cell: (row) => row.quotation?.reference ?? (row.details?.source == "ONLINE_SHOP" ? "Online shop" : ""),
              },
              { header: "Total", cell: (row) => formatMoney(row.total, row.currency), className: "text-right whitespace-nowrap" },
              { header: "Paid", cell: (row) => formatMoney(row.amountPaid, row.currency), className: "text-right whitespace-nowrap" },
              {
                header: "Status",
                cell: (row) => (
                  <StatusBadge value={row.status} label={row.status == "PENDING" ? "Waiting for approval" : undefined} />
                ),
              },
              { header: "Created", cell: (row) => formatDate(row.createdAt), className: "whitespace-nowrap" },
              ...(canApprove
                ? [
                    {
                      header: "Approval",
                      className: "text-right",
                      cell: (row: Order) =>
                        row.status == "PENDING" ? (
                          <div className="flex justify-end gap-2">
                            <ApproveCancel
                              title={`order ${row.reference}`}
                              approve={{
                                method: "PUT",
                                path: `/api/orders/${row.id}`,
                                body: { status: "CONFIRMED" },
                                message: "The order becomes Confirmed and the customer is emailed.",
                              }}
                              cancel={{
                                method: "PUT",
                                path: `/api/orders/${row.id}`,
                                body: { status: "CANCELLED" },
                                message: "The order is cancelled and the customer is emailed. This cannot be undone.",
                              }}
                            />
                          </div>
                        ) : null,
                    },
                  ]
                : []),
            ]}
          />
          <Pagination pagination={result.pagination} basePath="/orders" searchParams={params} />
        </>
      ) : (
        <ErrorNotice message={result.message} />
      )}
    </>
  );
}
