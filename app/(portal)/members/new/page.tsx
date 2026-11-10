import type { Metadata } from "next";
import Link from "next/link";
import ConfirmAction from "@/components/ConfirmAction";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import { apiGet, toQuery } from "@/lib/api";
import { customerName } from "@/lib/format";
import { Membership } from "@/lib/membership";
import { Customer } from "@/lib/types";

export const metadata: Metadata = { title: "Add member" };

// Add a member: find the customer, then issue their membership card.
// Customers can also join themselves when they register on the website.
export default async function AddMemberPage({ searchParams }: PageProps<"/members/new">) {
  const params = await searchParams;
  const search = typeof params.search == "string" ? params.search.trim() : "";
  const [customers, members] = search
    ? await Promise.all([
        apiGet<Customer[]>(`/api/customers${toQuery(params, ["search"], { pageSize: "20" })}`),
        apiGet<Membership[]>(`/api/memberships${toQuery(params, ["search"], { pageSize: "100" })}`),
      ])
    : [null, null];
  const memberCard = new Map((members?.ok ? members.data : []).map((member) => [member.customer.id, member]));

  return (
    <>
      <PageHeader
        eyebrow="Members & points"
        title="Add member"
        description="Search for the customer by name, email or customer reference, then click Make member. Their membership card is created in their name at once. New customers who are not in the list yet: add them under Customers first."
        back={{ href: "/members", label: "Members & points" }}
        actions={
          <Link href="/customers/new" className="btn-outline">
            + New customer
          </Link>
        }
      />
      <FilterBar basePath="/members/new" searchParams={params} searchPlaceholder="Customer name, email or reference" />

      {customers == null ? (
        <p className="card px-6 py-10 text-center text-sm text-slate-600">Type a name, email or reference above and press Enter.</p>
      ) : customers.ok ? (
        <DataTable
          rows={customers.data}
          empty="No customer found. Check the spelling, or add the customer first."
          columns={[
            { header: "Reference", cell: (row) => <span className="font-medium text-navy-900">{row.reference}</span> },
            { header: "Name", cell: (row) => customerName(row) },
            {
              header: "Contact",
              cell: (row) => (
                <>
                  <p>{row.email}</p>
                  {row.phone && <p className="text-xs text-slate-500">{row.phone}</p>}
                </>
              ),
            },
            {
              header: "Membership",
              className: "text-right",
              cell: (row) => {
                const card = memberCard.get(row.id);
                return card ? (
                  <Link href={`/members/${card.id}`} className="btn-outline btn-sm">
                    Member {card.cardNumber}
                  </Link>
                ) : (
                  <ConfirmAction
                    small
                    tone="gold"
                    label="Make member"
                    title={`Make ${customerName(row)} a member?`}
                    message="A membership card is created in their name. Their confirmed payments will earn points from now on."
                    method="POST"
                    path="/api/memberships"
                    body={{ customerId: row.id }}
                  />
                );
              },
            },
          ]}
        />
      ) : (
        <ErrorNotice message={customers.message} />
      )}
    </>
  );
}
