"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import { NavGroup } from "@/lib/nav";

export default function Sidebar({
  groups,
  badges = {},
}: {
  groups: NavGroup[];
  badges?: Partial<Record<"documents" | "orders" | "rentals" | "jobs", number>>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return href == "/" ? pathname == "/" : pathname.startsWith(href);
  }

  return (
    <>
      {/* phone: top bar with a menu button */}
      <div className="scene flex items-center justify-between px-4 py-3 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="btn-glass btn-sm"
          aria-expanded={open}
          aria-controls="sidebar-nav"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <aside
        id="sidebar-nav"
        className={`${open ? "block" : "hidden"} scene lg:fixed lg:inset-y-0 lg:block lg:w-64 lg:overflow-y-auto`}
      >
        <div className="grid-floor opacity-30" aria-hidden="true" />
        <div className="hidden border-b border-white/10 px-5 py-6 lg:block">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
        </div>
        <nav className="space-y-6 px-3 py-5">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[0.62rem] font-semibold tracking-[0.22em] text-white/35 uppercase">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-linear-to-b before:from-gold-400 before:to-gold-600"
                          : "text-white/65 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${item.color ? "" : active ? "bg-gold-400" : "bg-white/20"}`}
                        style={item.color ? { background: item.color, boxShadow: active ? `0 0 10px ${item.color}` : undefined } : undefined}
                      />
                      {item.label}
                      {item.badge && (badges[item.badge] ?? 0) > 0 && (
                        <span
                          className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[0.65rem] font-bold text-white shadow-[0_0_0_3px_rgb(239_68_68/0.2)]"
                          title="Waiting for approval"
                        >
                          {badges[item.badge]}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
