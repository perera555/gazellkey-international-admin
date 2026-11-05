"use client";

import { FormEvent, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ConfirmAction from "@/components/ConfirmAction";
import { apiRequest } from "@/lib/api-client";
import { RentalBooking } from "@/lib/types";

function useSaved() {
  const router = useRouter();
  const pathname = usePathname();
  return (notice: string) => {
    router.replace(`${pathname}?notice=${encodeURIComponent(notice)}`, { scroll: false });
    router.refresh();
  };
}

function ErrorText({ text }: { text: string }) {
  return text ? (
    <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
      {text}
    </p>
  ) : null;
}

// Confirm / delivered / returned / cancel - only the next steps of the current status
export function RentalStatusActions({ booking }: { booking: RentalBooking }) {
  const path = `/api/rentals/bookings/${booking.id}`;
  const next = booking.nextStatuses ?? [];
  if (next.length == 0) {
    return <p className="text-sm text-slate-500">This booking is finished.</p>;
  }
  return (
    <div className="flex flex-wrap gap-3">
      {next.includes("CONFIRMED") && (
        <ConfirmAction
          tone="gold"
          label="Confirm booking"
          title="Confirm this rental?"
          message="Stock is checked for every day and held for this customer. The customer gets a confirmation email with the items and total."
          method="PUT"
          path={path}
          body={{ status: "CONFIRMED" }}
        />
      )}
      {next.includes("DELIVERED") && (
        <ConfirmAction
          tone="gold"
          label="Mark delivered"
          title="Items delivered?"
          message="Use this when the items are at the venue."
          method="PUT"
          path={path}
          body={{ status: "DELIVERED" }}
        />
      )}
      {next.includes("RETURNED") && (
        <ConfirmAction
          tone="gold"
          label="Mark returned"
          title="All items back?"
          message="The items become free for other bookings again. Check for damage before you mark them returned."
          method="PUT"
          path={path}
          body={{ status: "RETURNED" }}
        />
      )}
      {next.includes("CANCELLED") && <CancelButton bookingId={booking.id} />}
    </div>
  );
}

function CancelButton({ bookingId }: { bookingId: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const saved = useSaved();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function cancel(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await apiRequest("PUT", `/api/rentals/bookings/${bookingId}`, {
      status: "CANCELLED",
      cancelReason: reason.trim(),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.data.message ?? "Could not cancel.");
      return;
    }
    dialog.current?.close();
    saved("Rental cancelled");
  }

  return (
    <>
      <button type="button" className="btn-danger" onClick={() => dialog.current?.showModal()}>
        Cancel booking
      </button>
      <dialog ref={dialog} className="modal" aria-labelledby="rental-cancel-title">
        <form onSubmit={cancel} className="card space-y-4 p-6">
          <h2 id="rental-cancel-title" className="heading-display text-xl">
            Cancel this rental?
          </h2>
          <p className="text-sm text-slate-600">The customer is emailed with your reason, and the items become free again.</p>
          <div>
            <label htmlFor="rental-cancel-reason" className="label">
              Reason *
            </label>
            <textarea
              id="rental-cancel-reason"
              required
              maxLength={500}
              rows={3}
              className="input"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. The chairs are fully booked on that date."
            />
          </div>
          <ErrorText text={error} />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => dialog.current?.close()} className="btn-outline">
              Keep it
            </button>
            <button type="submit" disabled={busy} className="btn-danger-solid">
              {busy ? "Cancelling..." : "Cancel booking"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

// Final price (incl. delivery and setup) and internal notes
export function RentalPriceForm({ booking }: { booking: RentalBooking }) {
  const saved = useSaved();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const total = String(form.get("quotedTotal") ?? "").trim();
    const notes = String(form.get("staffNotes") ?? "").trim();
    const result = await apiRequest("PUT", `/api/rentals/bookings/${booking.id}`, {
      quotedTotal: total == "" ? null : Number(total),
      staffNotes: notes == "" ? null : notes,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.data.message ?? "Could not save.");
      return;
    }
    saved("Saved");
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label htmlFor="quotedTotal" className="label">
          Final price ({booking.currency})
        </label>
        <input
          id="quotedTotal"
          name="quotedTotal"
          type="number"
          min="0"
          step="0.01"
          className="input"
          defaultValue={booking.quotedTotal ?? ""}
          placeholder={`Items: ${Number(booking.estimatedTotal).toFixed(2)} + delivery / setup`}
        />
        <p className="mt-1 text-xs text-slate-500">
          Items cost {booking.currency} {Number(booking.estimatedTotal).toLocaleString("en-LK")}. Add delivery and setup, then save before confirming -
          the confirmation email shows this price.
        </p>
      </div>
      <div>
        <label htmlFor="staffNotes" className="label">
          Internal notes
        </label>
        <textarea
          id="staffNotes"
          name="staffNotes"
          rows={3}
          maxLength={5000}
          className="input"
          defaultValue={booking.staffNotes ?? ""}
          placeholder="Delivery time, lorry, contact person at the venue ... (customers never see this)"
        />
      </div>
      <ErrorText text={error} />
      <button type="submit" disabled={busy} className="btn-navy">
        {busy ? "Saving..." : "Save price and notes"}
      </button>
    </form>
  );
}
