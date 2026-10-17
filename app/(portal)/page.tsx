import Link from "next/link";
import DataTable from "@/components/DataTable";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import StatusBadge, { DIVISION_COLOURS, DivisionTag } from "@/components/StatusBadge";
import Tilt from "@/components/Tilt";
import { apiGet } from "@/lib/api";
import { customerName, formatAppointmentTime, formatDate, MODE_LABELS } from "@/lib/format";
import { CATALOGUE } from "@/lib/resources";
import { canAccessDivision, hasPrivilege, requireStaff } from "@/lib/session";
import { DashboardData } from "@/lib/types";

export default async function DashboardPage() {
  const [result, user] = await Promise.all([apiGet<DashboardData>("/api/dashboard"), requireStaff()]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // "Add" shortcuts for everything this user may create
  const shortcuts = [
    ...CATALOGUE.filter(
      (resource) => hasPrivilege(user, resource.privilege) && canAccessDivision(user, resource.division),
    ).map((resource) => ({ href: `${resource.path}/new`, label: `Add ${resource.singular}`, color: resource.color })),
    ...(hasPrivilege(user, "customers:edit") ? [{ href: "/customers/new", label: "Add customer", color: "#1D4675" }] : []),
    ...(hasPrivilege(user, "suppliers:edit") ? [{ href: "/suppliers/new", label: "Add supplier", color: "#13345C" }] : []),
    ...(hasPrivilege(user, "users:edit") ? [{ href: "/users/new", label: "Add user", color: "#C9A227" }] : []),
  ];

  const header = (
    <PageHeader
      eyebrow="Dashboard"
      title={`${greeting}, ${user.firstName}`}
      description="What needs attention today across Gazellekey's six divisions."
      actions={
        <Link href="/enquiries?status=NEW" className="btn-gold">
          New enquiries
        </Link>
      }
    />
  );

  if (!result.ok) {
    return (
      <>
        {header}
        <ErrorNotice message={result.message} />
      </>
    );
  }

  const { counts, openEnquiriesByDivision, recentEnquiries, upcomingAppointments } = result.data;
  const maxOpen = Math.max(1, ...openEnquiriesByDivision.map((row) => row.count));
  const seesAppointments = hasPrivilege(user, "appointments:read");

  const stats = [
    { label: "Open enquiries", value: counts.openEnquiries, href: "/enquiries", tone: "from-navy-800 to-navy-950 text-white" },
    ...(seesAppointments
      ? [
          {
            label: "Appointments to confirm",
            value: counts.appointmentsToConfirm,
            href: "/appointments?status=REQUESTED",
            tone: counts.appointmentsToConfirm > 0 ? "from-[#ecd27a] to-gold-500 text-navy-950" : "from-white to-white",
          },
        ]
      : []),
    { label: "Unassigned", value: counts.unassignedEnquiries, href: "/enquiries?status=NEW", tone: "from-white to-white" },
    { label: "Assigned to me", value: counts.myEnquiries, href: "/enquiries", tone: "from-white to-white" },
    { label: "Quotes awaiting reply", value: counts.quotesAwaitingReply, href: "/quotations?status=SENT", tone: "from-white to-white" },
    { label: "Active orders", value: counts.activeOrders, href: "/orders", tone: "from-white to-white" },
    { label: "Payments to confirm", value: counts.paymentsToConfirm, href: "/payments?status=PENDING", tone: "from-[#ecd27a] to-gold-500 text-navy-950" },
    { label: "Delayed shipments", value: counts.delayedShipments, tone: counts.delayedShipments > 0 ? "from-red-500 to-red-700 text-white" : "from-white to-white" },
  ];

  return (
    <>
      {header}

      <div className={`grid grid-cols-2 gap-4 md:grid-cols-4 ${stats.length > 7 ? "xl:grid-cols-8" : "xl:grid-cols-7"}`}>
        {stats.map((stat, index) => {
          const body = (
            <div className={`card h-full bg-linear-to-b p-4 ${stat.tone}`}>
              <p className="text-xs font-medium opacity-75">{stat.label}</p>
              <p className="mt-2 font-display text-4xl font-semibold">{stat.value}</p>
            </div>
          );
          return (
            <div key={stat.label} className="rise" style={{ animationDelay: `${index * 50}ms` }}>
              <Tilt className="h-full rounded-2xl" max={10}>
                {stat.href ? (
                  <Link href={stat.href} className="block h-full">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </Tilt>
            </div>
          );
        })}
      </div>

      {shortcuts.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-navy-900">Quick add</h2>
          <div className="flex flex-wrap gap-3">
            {shortcuts.map((shortcut) => (
              <Link key={shortcut.href} href={shortcut.href} className="btn-outline">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: shortcut.color }} />+ {shortcut.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <section className="rise">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-900">Recent enquiries</h2>
            <Link href="/enquiries" className="text-sm font-medium text-navy-700 hover:underline">
              View all →
            </Link>
          </div>
          <DataTable
            rows={recentEnquiries}
            empty="No enquiries yet."
            columns={[
              { header: "Reference", cell: (row) => <span className="font-medium text-navy-900">{row.reference}</span> },
              { header: "Customer", cell: (row) => customerName(row.customer) },
              { header: "Subject", cell: (row) => row.subject },
              { header: "Division", cell: (row) => <DivisionTag division={row.division} /> },
              { header: "Status", cell: (row) => <StatusBadge value={row.status} /> },
              { header: "Received", cell: (row) => formatDate(row.createdAt), className: "whitespace-nowrap" },
            ]}
          />
        </section>

        <div className="space-y-6">
          {seesAppointments && (
            <section className="rise">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-navy-900">Next 7 days</h2>
                <Link href="/appointments" className="text-sm font-medium text-navy-700 hover:underline">
                  All appointments →
                </Link>
              </div>
              <ul className="card divide-y divide-slate-100 p-2">
                {upcomingAppointments.length == 0 && (
                  <li className="px-3 py-6 text-center text-sm text-slate-500">No appointments booked.</li>
                )}
                {upcomingAppointments.map((row) => (
                  <li key={row.id}>
                    <Link href={`/appointments/${row.id}`} className="block rounded-xl px-3 py-2.5 transition hover:bg-navy-50">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-navy-900">{formatAppointmentTime(row.startAt)}</span>
                        <StatusBadge value={row.status} />
                      </span>
                      <span className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: DIVISION_COLOURS[row.division] }}
                        />
                        <span className="truncate">
                          {customerName(row.customer)} · {MODE_LABELS[row.mode]}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rise">
            <h2 className="mb-3 text-lg font-semibold text-navy-900">Open by division</h2>
            <ul className="card space-y-1 p-3">
              {openEnquiriesByDivision.length == 0 && (
                <li className="px-3 py-6 text-center text-sm text-slate-500">None open.</li>
              )}
              {openEnquiriesByDivision.map((row) => (
                <li key={row.division}>
                  <Link
                    href={`/enquiries?division=${row.division}`}
                    className="block rounded-xl px-3 py-2.5 transition hover:bg-navy-50"
                  >
                    <span className="flex items-center justify-between">
                      <DivisionTag division={row.division} />
                      <span className="font-semibold text-navy-900">{row.count}</span>
                    </span>
                    <span className="mt-2 block h-2 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${(row.count / maxOpen) * 100}%`,
                          background: `linear-gradient(90deg, ${DIVISION_COLOURS[row.division]}aa, ${DIVISION_COLOURS[row.division]})`,
                        }}
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
