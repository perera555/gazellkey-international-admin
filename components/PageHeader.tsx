import Link from "next/link";
import { CSSProperties, ReactNode } from "react";

// Navy 3D banner at the top of every page: glowing grid floor, extruded
// title, and the page's main actions (e.g. "Add tour") on the right.
export default function PageHeader({
  title,
  description,
  eyebrow,
  color,
  back,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  color?: string; // division accent for the glow and grid
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <header
      className="scene rise mb-6 rounded-3xl border border-white/5 px-6 py-7 shadow-[0_24px_48px_-28px_rgb(6_11_26/0.8)] sm:px-8 sm:py-9"
      style={color ? ({ "--grid": color } as CSSProperties) : undefined}
    >
      <div className="grid-floor" aria-hidden="true" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {back && (
            <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-sm text-white/70 hover:text-white">
              ← {back.label}
            </Link>
          )}
          {eyebrow && (
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-gold-400 uppercase">
              {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
              {eyebrow}
            </p>
          )}
          <h1 className="text-3d text-3xl sm:text-4xl">{title}</h1>
          <span className="mt-3 block h-1 w-12 rounded-full bg-linear-to-r from-gold-400 to-gold-600" aria-hidden="true" />
          {description && <p className="mt-2 text-sm text-white/75 sm:text-base">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <p role="alert" className="card border-red-200 bg-red-50 px-6 py-4 text-sm text-red-800">
      {message}
    </p>
  );
}
