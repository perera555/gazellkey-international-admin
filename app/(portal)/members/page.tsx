import type { Metadata } from "next";
import Link from "next/link";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { apiGet, toQuery } from "@/lib/api";
import { customerName, formatDate } from "@/lib/format";
import { CARD_NAMES, Membership, TIER_BADGE, TIERS } from "@/lib/membership";

export const metadata: Metadata = { title: "Members & points" };

export default async function MembersPage({ searchParams }: PageProps<"/members">) {
  const params = await searchParams;
  const result = await apiGet<Membership[]>(`/api/memberships${toQuery(params, ["search", "tier", "pageNumber"])}`);

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Members & points"
        description="Customers who joined the membership. Every confirmed payment (shop, fertilizer, tickets, tours, events, rentals ...) earns points automatically - 1 point per US$ 1 / LKR 300 - and refunds take them back. Cards: Blue (on joining), Bronze 250, Silver 1,000, Gold 2,500, Platinum 5,000 points earned. Open a member to redeem or add points."
        actions={
          <Link href="/members/new" className="btn-gold">
            + Add member
          </Link>
        }
      />
      <FilterBar
        basePath="/members"
        searchParams={params}
        searchPlaceholder="Card number, name, email, customer reference"
        selects={[{ name: "tier", label: "Card", options: TIERS, labels: CARD_NAMES, allLabel: "All cards" }]}
      />
      {result.ok ? (
        <>
          <DataTable
            rows={result.data}
            empty="No members found."
            columns={[
              { header: "Membership No.", cell: (row) => <span className="font-mono font-medium text-navy-900">{row.cardNumber}</span> },
              {
                header: "Member",
                cell: (row) => (
                  <>
                    <p className="font-medium text-navy-950">{customerName(row.customer)}</p>
                    <p className="text-xs text-slate-500">{row.customer.email}</p>
                  </>
                ),
              },
              { header: "Card", cell: (row) => <span className={`badge ${TIER_BADGE[row.tier]}`}>{CARD_NAMES[row.tier]}</span> },
              { header: "Points", cell: (row) => row.pointsBalance.toLocaleString(), className: "text-right font-semibold" },
              { header: "Earned in total", cell: (row) => row.lifetimePoints.toLocaleString(), className: "text-right" },
              { header: "Member since", cell: (row) => formatDate(row.joinedAt), className: "whitespace-nowrap" },
              {
                header: "",
                className: "text-right",
                cell: (row) => (
                  <Link href={`/members/${row.id}`} className="btn-outline btn-sm">
                    Open
                  </Link>
                ),
              },
            ]}
          />
          <Pagination pagination={result.pagination} basePath="/members" searchParams={params} />
        </>
      ) : (
        <ErrorNotice message={result.message} />
      )}
    </>
  );
}
