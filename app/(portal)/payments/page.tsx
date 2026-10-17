import type { Metadata } from "next";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import StatusBadge, { DivisionTag } from "@/components/StatusBadge";
import { apiGet, toQuery } from "@/lib/api";
import { customerName, formatDate, formatMoney, humanize } from "@/lib/format";
import { DIVISIONS } from "@/lib/nav";
import { Payment } from "@/lib/types";

export const metadata: Metadata = { title: "Payments" };

const STATUSES = ["PENDING", "PAID", "FAILED", "PARTIALLY_REFUNDED", "REFUNDED"];
const METHODS = ["BANK_TRANSFER", "CASH", "CARD_ONLINE", "OTHER"];
const RECEIPT_STATUSES = ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"];

// Test-mode payments live under /test in the Stripe dashboard
const STRIPE_DASHBOARD_URL = (process.env.STRIPE_DASHBOARD_URL ?? "https://dashboard.stripe.com/test").replace(/\/$/, "");

export default async function PaymentsPage({ searchParams }: PageProps<"/payments">) {
  const params = await searchParams;
  const result = await apiGet<Payment[]>(
    `/api/payments${toQuery(params, ["division", "status", "method", "pageNumber"])}`,
  );

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Payments"
        description="Card payments (PayHere, Stripe) are confirmed automatically and paid out to the bank account set in that gateway's account. Bank transfers (shop orders show their CHK reference) and cash wait for Finance to confirm them once the money is in the bank."
      />
      <FilterBar
        basePath="/payments"
        searchParams={params}
        selects={[
          { name: "division", label: "Division", options: DIVISIONS },
          { name: "status", label: "Status", options: STATUSES },
          { name: "method", label: "Method", options: METHODS },
        ]}
      />
      {result.ok ? (
        <>
          <DataTable
            rows={result.data}
            empty="No payments match these filters."
            columns={[
              { header: "Reference", cell: (row) => <span className="font-medium text-navy-900">{row.reference}</span> },
              { header: "Customer", cell: (row) => customerName(row.customer) },
              {
                header: "Order",
                cell: (row) => (
                  <>
                    <p>{row.order.reference}</p>
                    <DivisionTag division={row.order.division} />
                  </>
                ),
              },
              { header: "Amount", cell: (row) => formatMoney(row.amount, row.currency), className: "text-right whitespace-nowrap" },
              {
                header: "Method",
                cell: (row) => (
                  <>
                    <p>
                      {row.provider == "STRIPE" ? "Card (Stripe)" : row.provider == "PAYHERE" ? "Card (PayHere)" : humanize(row.method)}
                    </p>
                    {row.checkoutReference ? <p className="text-xs text-slate-500">Online shop {row.checkoutReference}</p> : null}
                    {/* PayHere payment id: search it in the PayHere portal */}
                    {row.provider == "PAYHERE" && row.providerReference ? (
                      <p className="text-xs text-slate-500">PayHere ID {row.providerReference}</p>
                    ) : null}
                    {/* the payment in our Stripe account: money, fees and payout */}
                    {row.provider == "STRIPE" && row.providerReference?.startsWith("pi_") ? (
                      <a
                        href={`${STRIPE_DASHBOARD_URL}/payments/${row.providerReference}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-navy-700 underline"
                      >
                        View in Stripe
                      </a>
                    ) : null}
                  </>
                ),
              },
              { header: "Status", cell: (row) => <StatusBadge value={row.status} /> },
              { header: "Paid on", cell: (row) => formatDate(row.paidAt), className: "whitespace-nowrap" },
              { header: "Created", cell: (row) => formatDate(row.createdAt), className: "whitespace-nowrap" },
              {
                header: "Receipt",
                cell: (row) =>
                  RECEIPT_STATUSES.includes(row.status) ? (
                    <a href={`/api/payments/${row.id}/receipt`} target="_blank" rel="noreferrer" className="font-medium text-navy-900 underline">
                      PDF
                    </a>
                  ) : null,
              },
            ]}
          />
          <Pagination pagination={result.pagination} basePath="/payments" searchParams={params} />
        </>
      ) : (
        <ErrorNotice message={result.message} />
      )}
    </>
  );
}
