import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PointsForm from "@/components/PointsForm";
import { apiGetOne } from "@/lib/api";
import { customerName, formatDate, formatDateTime } from "@/lib/format";
import { CARD_NAMES, MembershipDetail, REASON_LABELS, TIER_BADGE } from "@/lib/membership";
import { getSessionUser, hasPrivilege } from "@/lib/session";

export const metadata: Metadata = { title: "Member" };

export default async function MemberPage({ params }: PageProps<"/members/[id]">) {
  const { id } = await params;
  const [member, me] = await Promise.all([
    apiGetOne<MembershipDetail>(`/api/memberships/${encodeURIComponent(id)}`),
    getSessionUser(),
  ]);
  const canEdit = me != null && hasPrivilege(me, "customers:edit");

  return (
    <>
      <PageHeader
        eyebrow={`Membership No. ${member.cardNumber} · ${CARD_NAMES[member.tier]}`}
        title={customerName(member.customer)}
        description={`${member.customer.email} · member since ${formatDate(member.joinedAt)}`}
        back={{ href: "/members", label: "Members & points" }}
        actions={
          <Link href={`/customers/${member.customer.id}`} className="btn-outline">
            Customer {member.customer.reference}
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Points</p>
              <p className="mt-1 text-3xl font-bold text-navy-950">{member.pointsBalance.toLocaleString()}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Card</p>
              <p className="mt-2">
                <span className={`badge ${TIER_BADGE[member.tier]}`}>{CARD_NAMES[member.tier]}</span>
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {member.next ? `${member.next.pointsNeeded.toLocaleString()} points to ${CARD_NAMES[member.next.tier]}` : "Highest card"}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Earned in total</p>
              <p className="mt-1 text-3xl font-bold text-navy-950">{member.lifetimePoints.toLocaleString()}</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <h2 className="heading-display border-b border-slate-100 px-6 py-4 text-lg">Points history</h2>
            {member.transactions.length == 0 ? (
              <p className="px-6 py-8 text-sm text-slate-500">No points yet. They are added when a payment is confirmed.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {member.transactions.map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-4 px-6 py-3 text-sm">
                    <div>
                      <p className="font-medium text-navy-900">{REASON_LABELS[entry.reason]}</p>
                      {entry.note && <p className="text-slate-600">{entry.note}</p>}
                      <p className="text-xs text-slate-500">{formatDateTime(entry.createdAt)}</p>
                    </div>
                    <span className={`shrink-0 font-semibold ${entry.points > 0 ? "text-emerald-700" : "text-red-700"}`}>
                      {entry.points > 0 ? "+" : ""}
                      {entry.points.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {canEdit && <PointsForm membershipId={member.id} balance={member.pointsBalance} />}
      </div>
    </>
  );
}
