import type { Metadata } from "next";
import Link from "next/link";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import StatusBadge from "@/components/StatusBadge";
import { apiGet, toQuery } from "@/lib/api";
import { customerName, formatMoney } from "@/lib/format";
import { formatRentalDates } from "@/lib/rentals";
import { RENTAL_EVENT_LABELS, RentalBooking } from "@/lib/types";

export const metadata: Metadata = { title: "Rental bookings" };

const STATUSES = ["REQUESTED", "CONFIRMED", "DELIVERED", "RETURNED", "CANCELLED"];

// Opens on upcoming rentals, soonest first. "When: All dates" shows history.
export default async function RentalBookingsPage({ searchParams }: PageProps<"/rentals">) {
  const params = await searchParams;
  const filters = { ...params, upcoming: params.upcoming ?? "true" };
  const result = await apiGet<RentalBooking[]>(
    `/api/rentals/bookings${toQuery(filters, ["search", "status", "upcoming", "pageNumber"])}`,
  );

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Rental bookings"
        description="Tents, chairs, tables and sound hired out for weddings, funerals and parties. Confirming a request checks the stock for every day and holds it."
        color="#F26B21"
        actions={
          <>
            <Link href="/rentals?status=REQUESTED&upcoming=" className="btn-gold">
              Waiting for confirmation
            </Link>
            <Link href="/catalogue/rentals" className="btn-glass">
              Rental items
            </Link>
          </>
        }
      />
      <FilterBar
        basePath="/rentals"
        searchParams={filters}
        searchPlaceholder="Reference, customer, venue or city"
        selects={[
          { name: "upcoming", label: "When", options: ["true"], labels: { true: "Upcoming" }, allLabel: "All dates" },
          { name: "status", label: "Status", options: STATUSES },
        ]}
      />
      {result.ok ? (
        <>
          <DataTable
            rows={result.data}
            empty="No rental bookings match these filters."
            columns={[
              {
                header: "Dates",
                className: "whitespace-nowrap",
                cell: (row) => (
                  <Link href={`/rentals/${row.id}`} className="group block">
                    <p className="font-medium text-navy-900 group-hover:underline">{formatRentalDates(row.startDate, row.endDate)}</p>
                    <p className="text-xs text-slate-500">{RENTAL_EVENT_LABELS[row.eventType] ?? row.eventType}</p>
                  </Link>
                ),
              },
              {
                header: "Reference",
                cell: (row) => (
                  <Link href={`/rentals/${row.id}`} className="font-medium text-navy-900 hover:underline">
                    {row.reference}
                  </Link>
                ),
              },
              {
                header: "Customer",
                cell: (row) => (
                  <>
                    <p>{customerName(row.customer)}</p>
                    <p className="text-xs text-slate-500">{row.customer.phone ?? row.customer.email}</p>
                  </>
                ),
              },
              {
                header: "Items",
                cell: (row) => (
                  <p className="max-w-xs text-sm text-slate-600">
                    {row.items.map((item) => `${item.quantity} × ${item.name}`).join(", ")}
                  </p>
                ),
              },
              { header: "Venue", cell: (row) => row.city },
              {
                header: "Total",
                className: "text-right whitespace-nowrap",
                cell: (row) => formatMoney(row.quotedTotal ?? row.estimatedTotal, row.currency),
              },
              { header: "Status", cell: (row) => <StatusBadge value={row.status} /> },
            ]}
          />
          <Pagination pagination={result.pagination} basePath="/rentals" searchParams={filters} />
        </>
      ) : (
        <ErrorNotice message={result.message} />
      )}
    </>
  );
}
