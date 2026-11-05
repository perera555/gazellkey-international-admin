import Link from "next/link";
import { Suspense } from "react";
import FlashNotice from "@/components/FlashNotice";
import LogoutButton from "@/components/LogoutButton";
import Sidebar from "@/components/Sidebar";
import { apiGet } from "@/lib/api";
import { humanize } from "@/lib/format";
import { NAV_GROUPS } from "@/lib/nav";
import { canAccessDivision, hasPrivilege, requireStaff } from "@/lib/session";

export default async function PortalLayout({ children }: LayoutProps<"/">) {
  const user = await requireStaff();
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => hasPrivilege(user, item.privilege) && canAccessDivision(user, item.division),
    ),
  })).filter((group) => group.items.length > 0);

  // How many documents / orders wait for approval (sidebar badges)
  const visible = groups.flatMap((group) => group.items);
  const waiting = async (shown: boolean, path: string) => {
    if (!shown) {
      return 0;
    }
    const result = await apiGet<unknown[]>(path);
    return result.ok ? (result.pagination?.totalCount ?? 0) : 0;
  };
  const [documents, orders, rentals, jobs] = await Promise.all([
    waiting(visible.some((item) => item.badge == "documents"), "/api/documents/approvals?approval=PENDING&pageSize=1"),
    waiting(visible.some((item) => item.badge == "orders"), "/api/orders?status=PENDING&pageSize=1"),
    waiting(visible.some((item) => item.badge == "rentals"), "/api/rentals/bookings?status=REQUESTED&pageSize=1"),
    waiting(visible.some((item) => item.badge == "jobs"), "/api/jobs/applications?status=APPLIED&pageSize=1"),
  ]);

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="min-h-screen">
      <Sidebar groups={groups} badges={{ documents: documents, orders: orders, rentals: rentals, jobs: jobs }} />
      <div className="lg:pl-64">
        <div className="sticky top-0 z-30 flex flex-wrap items-center justify-end gap-4 border-b border-slate-200/70 bg-white/80 px-4 py-3 shadow-[0_8px_24px_-20px_rgb(11_21_48/0.5)] backdrop-blur-xl backdrop-saturate-150 sm:px-8">
          <Link href="/guide" className="btn-outline btn-sm" title="User guide">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.2-2.5 3.9M12 17h.01" />
            </svg>
            User guide
          </Link>
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1 pr-4 pl-1 shadow-[0_1px_2px_rgb(15_23_42/0.05)]">
            <span className="relative grid h-9 w-9 place-items-center rounded-full bg-linear-to-br from-gold-400 to-gold-600 text-sm font-bold text-navy-950">
              {initials}
              <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" title="Online" />
            </span>
            <div className="text-sm leading-tight">
              <p className="font-semibold text-navy-950">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-500">
                {humanize(user.role)}
                {user.role == "STAFF" && user.divisions.length > 0
                  ? ` · ${user.divisions.map(humanize).join(", ")}`
                  : ""}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
        <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
      <Suspense>
        <FlashNotice />
      </Suspense>
    </div>
  );
}
