"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api-client";

// Approve / Cancel buttons for something a customer sent in (a document,
// an order). Approve asks for a confirmation; Cancel asks for a reason when
// "cancelNeedsReason" is set (it is sent as "note").
export default function ApproveCancel({
  title,
  approve,
  cancel,
  cancelNeedsReason = false,
  small = true,
}: {
  title: string;
  approve: { method: "POST" | "PUT"; path: string; body: Record<string, unknown>; message: string };
  cancel: { method: "POST" | "PUT"; path: string; body: Record<string, unknown>; message: string };
  cancelNeedsReason?: boolean;
  small?: boolean;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"approve" | "cancel">("approve");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function open(next: "approve" | "cancel") {
    setMode(next);
    setReason("");
    setError("");
    dialog.current?.showModal();
  }

  async function confirm() {
    const action = mode == "approve" ? approve : cancel;
    if (mode == "cancel" && cancelNeedsReason && reason.trim() == "") {
      setError("Please give a reason. The customer will see it.");
      return;
    }
    setBusy(true);
    setError("");
    const body = mode == "cancel" && cancelNeedsReason ? { ...action.body, note: reason.trim() } : action.body;
    const result = await apiRequest(action.method, action.path, body);
    setBusy(false);
    if (!result.ok) {
      setError(result.data.message ?? "Something went wrong.");
      return;
    }
    dialog.current?.close();
    toast.success(mode == "approve" ? "Approved." : "Cancelled.");
    router.refresh();
  }

  const size = small ? "btn-sm" : "";
  return (
    <>
      <button type="button" onClick={() => open("approve")} className={`btn-gold ${size}`}>
        ✓ Approve
      </button>
      <button type="button" onClick={() => open("cancel")} className={`btn-danger ${size}`}>
        ✕ Cancel
      </button>
      <dialog ref={dialog} className="modal">
        <div className="card p-6">
          <h2 className="heading-display text-xl">
            {mode == "approve" ? "Approve" : "Cancel"} {title}?
          </h2>
          <p className="mt-2 text-sm text-slate-600">{mode == "approve" ? approve.message : cancel.message}</p>
          {mode == "cancel" && cancelNeedsReason && (
            <label className="mt-4 block">
              <span className="label">Reason (sent to the customer)</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                placeholder="e.g. The photo page is blurred. Please upload a clear scan."
                className="input"
              />
            </label>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => dialog.current?.close()} className="btn-outline">
              Back
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              className={mode == "approve" ? "btn-gold" : "btn-danger-solid"}
            >
              {busy ? "Working..." : mode == "approve" ? "Approve" : "Cancel it"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
