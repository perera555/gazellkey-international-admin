"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api-client";

// A button that asks first, then calls the API (archive, deactivate, restore).
// On success the page reloads its data, or moves to "redirectTo".
export default function ConfirmAction({
  label,
  title,
  message,
  method,
  path,
  body,
  tone = "danger",
  small = false,
  redirectTo,
}: {
  label: string;
  title: string;
  message: string;
  method: "PUT" | "DELETE" | "POST";
  path: string;
  body?: Record<string, unknown>;
  tone?: "danger" | "outline" | "gold";
  small?: boolean;
  redirectTo?: string;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const buttonClass = { danger: "btn-danger", outline: "btn-outline", gold: "btn-gold" }[tone];

  async function confirm() {
    setBusy(true);
    setError("");
    const result = await apiRequest(method, path, body);
    setBusy(false);
    if (!result.ok) {
      setError(result.data.message ?? "Something went wrong.");
      return;
    }
    dialog.current?.close();
    toast.success(`${label} - done.`);
    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          dialog.current?.showModal();
        }}
        className={`${buttonClass} ${small ? "btn-sm" : ""}`}
      >
        {label}
      </button>
      <dialog ref={dialog} className="modal" aria-labelledby={`${path}-title`}>
        <div className="card p-6">
          <h2 id={`${path}-title`} className="heading-display text-xl">
            {title}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => dialog.current?.close()} className="btn-outline">
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              className={tone == "danger" ? "btn-danger-solid" : "btn-gold"}
            >
              {busy ? "Working..." : label}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
