import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FilterBar from "@/components/FilterBar";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import ReviewModeration from "@/components/ReviewModeration";
import StatusBadge, { DivisionTag } from "@/components/StatusBadge";
import { apiFetch, toQuery } from "@/lib/api";
import { customerName, formatDate, formatDateTime } from "@/lib/format";
import { hasPrivilege, requireStaff } from "@/lib/session";
import { Pagination as PageInfo, Review, ReviewSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Customer reviews" };

const STATUS_LABELS = { PUBLISHED: "On the website", HIDDEN: "Removed" };
const RATING_LABELS = { "1": "1 star", "2": "2 stars", "3": "3 stars", "4": "4 stars", "5": "5 stars" };

// Every review customers wrote. Bad ones can be removed (kept, hidden) or deleted.
export default async function ReviewsPage({ searchParams }: PageProps<"/reviews">) {
  const params = await searchParams;
  const user = await requireStaff();
  if (!hasPrivilege(user, "reviews:moderate")) {
    return (
      <>
        <PageHeader eyebrow="Website" title="Customer reviews" />
        <ErrorNotice message="You do not have the reviews:moderate privilege. Ask an administrator." />
      </>
    );
  }
  const { status, ok, body } = await apiFetch(
    `/api/reviews${toQuery(params, ["search", "status", "rating", "sort", "pageNumber"], { moderation: "true", pageSize: "20" })}`,
  );
  if (status == 401) {
    redirect("/login");
  }
  const reviews: Review[] = ok ? body.data : [];
  const summary: ReviewSummary | undefined = ok ? body.summary : undefined;
  const pagination: PageInfo | undefined = ok ? body.pagination : undefined;
  const lowCount = summary ? summary.stars.filter((row) => row.stars <= 2).reduce((sum, row) => sum + row.count, 0) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Website"
        title="Customer reviews"
        description="Reviews appear on the website as soon as customers post them. Remove any that are abusive, spam or untrue."
        actions={
          summary && summary.count > 0 ? (
            <span className="badge bg-white/15 text-white">
              ★ {summary.average?.toFixed(1)} average · {summary.count} published
            </span>
          ) : undefined
        }
      />

      {summary ? (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Published reviews" value={summary.count} />
          <Stat label="Average rating" value={summary.average ? `${summary.average.toFixed(1)} ★` : "-"} />
          <Stat label="5-star reviews" value={summary.stars[0].count} />
          <Stat label="1 - 2 star reviews" value={lowCount} warn={lowCount > 0} href="/reviews?status=PUBLISHED&sort=lowest" />
        </div>
      ) : null}

      <FilterBar
        basePath="/reviews"
        searchParams={params}
        searchPlaceholder="Words in the review, customer email"
        selects={[
          { name: "status", label: "Status", options: ["PUBLISHED", "HIDDEN"], labels: STATUS_LABELS },
          { name: "rating", label: "Stars", options: ["5", "4", "3", "2", "1"], labels: RATING_LABELS },
          {
            name: "sort",
            label: "Sort",
            options: ["lowest", "highest"],
            labels: { lowest: "Lowest rated first", highest: "Highest rated first" },
            allLabel: "Newest first",
          },
        ]}
      />

      {!ok ? (
        <ErrorNotice message={body.message ?? "Something went wrong."} />
      ) : reviews.length == 0 ? (
        <p className="card rise px-6 py-12 text-center text-sm text-slate-500">No reviews match these filters.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li
                key={review.id}
                className={`card rise p-5 ${review.status == "HIDDEN" ? "border-red-200 bg-red-50/40" : review.rating <= 2 ? "border-amber-200" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg tracking-wider text-gold-500" aria-label={`${review.rating} out of 5 stars`}>
                      {"★".repeat(review.rating)}
                      <span className="text-slate-300">{"★".repeat(5 - review.rating)}</span>
                    </p>
                    {review.title ? <p className="mt-1 font-semibold text-navy-900">{review.title}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <DivisionTag division={review.division} />
                    <StatusBadge value={review.status == "HIDDEN" ? "REJECTED" : "PUBLISHED"} label={STATUS_LABELS[review.status]} />
                  </div>
                </div>

                <p className="mt-2 text-sm whitespace-pre-line text-slate-700">{review.body}</p>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                  <span>
                    <span className="font-medium text-navy-900">{customerName(review.customer)}</span> · {review.customer.email}
                  </span>
                  {review.tour ? <span>Tour: {review.tour.title}</span> : null}
                  {review.tripDate ? <span>Travelled {formatDate(review.tripDate)}</span> : null}
                  <span>Posted {formatDateTime(review.createdAt)}</span>
                </div>

                {review.status == "HIDDEN" ? (
                  <p className="mt-3 rounded-lg bg-red-100/70 px-3 py-2 text-sm text-red-900">
                    Removed{review.removedBy ? ` by ${review.removedBy.firstName} ${review.removedBy.lastName}` : ""}
                    {review.removedAt ? ` on ${formatDate(review.removedAt)}` : ""}: {review.removedReason}
                  </p>
                ) : null}

                <div className="mt-4">
                  <ReviewModeration review={review} />
                </div>
              </li>
            ))}
          </ul>
          <Pagination pagination={pagination} basePath="/reviews" searchParams={params} />
        </>
      )}
    </>
  );
}

function Stat({ label, value, warn = false, href }: { label: string; value: number | string; warn?: boolean; href?: string }) {
  const body = (
    <div className={`card h-full p-4 ${warn ? "border-amber-300 bg-amber-50" : ""}`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-navy-900">{value}</p>
    </div>
  );
  return href ? (
    <a href={href} className="rise block">
      {body}
    </a>
  ) : (
    <div className="rise">{body}</div>
  );
}
