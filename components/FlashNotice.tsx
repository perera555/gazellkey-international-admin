"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Shows "?notice=..." (set after a save) as a toast, then drops it from the URL
export default function FlashNotice() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const notice = searchParams.get("notice");
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    if (notice == null) {
      return;
    }
    setShown(notice);
    const query = new URLSearchParams(searchParams.toString());
    query.delete("notice");
    router.replace(query.size > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
    const timer = setTimeout(() => setShown(null), 4000);
    return () => clearTimeout(timer);
  }, [notice, pathname, router, searchParams]);

  if (shown == null) {
    return null;
  }
  return (
    <div role="status" className="fixed right-4 bottom-4 z-50 rise">
      <div className="glass flex items-center gap-3 bg-navy-950/90 px-4 py-3 text-sm font-medium text-white">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-gold-500 text-xs text-navy-950">✓</span>
        {shown}
        <button type="button" onClick={() => setShown(null)} className="ml-2 text-white/60 hover:text-white" aria-label="Close">
          ✕
        </button>
      </div>
    </div>
  );
}
