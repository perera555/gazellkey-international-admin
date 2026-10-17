import Link from "next/link";
import { Pagination as PageInfo } from "@/lib/types";

// Previous / next links that keep the current filters in the URL
export default function Pagination({
  pagination,
  basePath,
  searchParams,
}: {
  pagination?: PageInfo;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (pagination == undefined || pagination.totalCount == 0) {
    return null;
  }

  function pageHref(pageNumber: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value == "string") {
        query.set(key, value);
      }
    }
    query.set("pageNumber", String(pageNumber));
    return `${basePath}?${query.toString()}`;
  }

  const { pageNumber, totalPages, totalCount } = pagination;

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <span>
        Page {pageNumber} of {Math.max(totalPages, 1)} · {totalCount} total
      </span>
      <div className="flex gap-2">
        {pageNumber > 1 && (
          <Link href={pageHref(pageNumber - 1)} className="btn-outline">
            Previous
          </Link>
        )}
        {pageNumber < totalPages && (
          <Link href={pageHref(pageNumber + 1)} className="btn-outline">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
