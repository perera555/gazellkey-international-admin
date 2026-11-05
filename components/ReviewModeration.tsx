"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ConfirmAction from "@/components/ConfirmAction";
import { apiRequest } from "@/lib/api-client";
import { Review } from "@/lib/types";

const QUICK_REASONS = ["Offensive or abusive language", "Spam or advertising", "Not about our services", "Personal information"];

// Remove from the website (with a reason) / publish again / delete for good
export default function ReviewModeration({ review }: { review: Review }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function hide(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await apiRequest("PUT", `/api/reviews/${review.id}`, { status: "HIDDEN", removedReason: reason.trim() });
    setBusy(false);
    if (!result.ok) {
      setError(result.data.message ?? "Could not remove the review.");
      return;
    }
    dialog.current?.close();
    setReason("");
    toast.success("Review removed from the website.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {review.status == "PUBLISHED" ? (
        <>
          <button type="button" onClick={() => dialog.current?.showModal()} className="btn-danger btn-sm">
            Remove from website
          </button>
          <dialog ref={dialog} className="modal" aria-labelledby={`hide-${review.id}`}>
            <form onSubmit={hide} className="card space-y-4 p-6">
              <h2 id={`hide-${review.id}`} className="heading-display text-xl">Remove this review?</h2>
              <p className="text-sm text-slate-600">
                It disappears from the website and the star average at once. The customer sees your reason in
                their account. You can publish it again later.
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_REASONS.map((text) => (
                  <button key={text} type="button" onClick={() => setReason(text)} className="badge cursor-pointer bg-navy-50 text-navy-800 hover:bg-navy-100">
                    {text}
                  </button>
                ))}
              </div>
              <div>
                <label htmlFor={`reason-${review.id}`} className="label">Reason *</label>
                <textarea
                  id={`reason-${review.id}`}
                  required
                  maxLength={500}
                  rows={3}
                  className="input"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </div>
              {error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => dialog.current?.close()} className="btn-outline">Cancel</button>
                <button type="submit" disabled={busy} className="btn-danger-solid">{busy ? "Removing..." : "Remove review"}</button>
              </div>
            </form>
          </dialog>
        </>
      ) : (
        <ConfirmAction
          small
          tone="gold"
          label="Publish again"
          title="Publish this review again?"
          message="It will show on the website and count in the star average again."
          method="PUT"
          path={`/api/reviews/${review.id}`}
          body={{ status: "PUBLISHED" }}
        />
      )}
      <ConfirmAction
        small
        tone="outline"
        label="Delete permanently"
        title="Delete this review for good?"
        message="Use this for spam. The review is erased (a copy is kept in the audit log). To keep a record, use Remove instead."
        method="DELETE"
        path={`/api/reviews/${review.id}`}
      />
    </div>
  );
}
