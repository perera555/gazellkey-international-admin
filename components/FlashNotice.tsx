"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

// Shows "?notice=..." (set after a save) as a toast, then drops it from the URL
export default function FlashNotice() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const notice = searchParams.get("notice");

  useEffect(() => {
    if (notice == null) {
      return;
    }
    toast.success(notice, { id: `notice:${notice}` }); // id: never shown twice
    const query = new URLSearchParams(searchParams.toString());
    query.delete("notice");
    router.replace(query.size > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [notice, pathname, router, searchParams]);

  return null;
}
