import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import PageHeader from "@/components/PageHeader";
import { RentalPriceForm, RentalStatusActions } from "@/components/RentalActions";
import StatusBadge from "@/components/StatusBadge";
import { apiGetOne } from "@/lib/api";
import { customerName, formatDateTime, formatMoney } from "@/lib/format";
import { formatRentalDates, rentalDays } from "@/lib/rentals";
import { hasPrivilege, requireStaff } from "@/lib/session";
import { RENTAL_EVENT_LABELS, RentalBooking } from "@/lib/types";

export const metadata: Metadata = { title: "Rental booking" };

export default async function RentalBookingPage({ params }: PageProps<"/rentals/[id]">) {
  const { id } = await params;
  const [booking, user] = await Promise.all([
    apiGetOne<RentalBooking>(`/api/rentals/bookings/${encodeURIComponent(id)}`),
    requireStaff(),
  ]);
  const canEdit = hasPrivilege(user, "orders:edit");
  const days = rentalDays(booking.startDate, booking.endDate);
  const waiting = booking.status == "REQUESTED";
  const short = booking.items.filter((item) => (booking.availability?.[item.rentalItemId] ?? Infinity) < item.quantity);

  return (
    <>
      <PageHeader
        eyebrow={`Rental ${booking.reference}`}
        title={`${RENTAL_EVENT_LABELS[booking.eventType] ?? booking.eventType} - ${customerName(booking.customer)}`}
        description={`${formatRentalDates(booking.startDate, booking.endDate)} (${days} day${days == 1 ? "" : "s"}) · ${booking.venue}, ${booking.city}`}
        color="#F26B21"
        back={{ href: "/rentals", label: "Rental bookings" }}
        actions={<StatusBadge value={booking.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          {canEdit && (
            <Panel title="Actions">
              {waiting && short.length > 0 && (
                <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                  Not enough stock on these dates for: {short.map((item) => item.name).join(", ")}. Confirming will be refused until
                  other bookings free them, or cancel and offer the customer other dates.
                </p>
              )}
              <RentalStatusActions booking={booking} />
            </Panel>
          )}

          <Panel title="Items" text={`Per day × ${days} day${days == 1 ? "" : "s"}. "Free" is what is left on these dates after other confirmed bookings.`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs tracking-wide text-slate-500 uppercase">
                    <th className="py-2 pr-4 font-semibold">Item</th>
                    <th className="py-2 pr-4 text-right font-semibold">Qty</th>
                    <th className="py-2 pr-4 text-right font-semibold">Free</th>
                    <th className="py-2 pr-4 text-right font-semibold">Per day</th>
                    <th className="py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {booking.items.map((item) => {
                    const free = booking.availability?.[item.rentalItemId];
                    return (
                      <tr key={item.id}>
                        <td className="py-3 pr-4">
                          <p className="font-medium text-navy-900">{item.name}</p>
                          {item.rentalItem && <p className="text-xs text-slate-500">{item.rentalItem.sku}</p>}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          {item.quantity} {item.rentalItem?.unit ?? ""}
                        </td>
                        <td className={`py-3 pr-4 text-right tabular-nums ${free != undefined && free < item.quantity ? "font-semibold text-red-700" : "text-slate-600"}`}>
                          {free ?? "-"}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">{formatMoney(item.pricePerDay, booking.currency)}</td>
                        <td className="py-3 text-right tabular-nums">{formatMoney(item.lineTotal, booking.currency)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200">
                    <td colSpan={4} className="pt-3 pr-4 text-right text-slate-500">Items total</td>
                    <td className="pt-3 text-right font-semibold tabular-nums">{formatMoney(booking.estimatedTotal, booking.currency)}</td>
                  </tr>
                  {booking.quotedTotal != null && (
                    <tr>
                      <td colSpan={4} className="pt-1 pr-4 text-right text-slate-500">Final price (with delivery / setup)</td>
                      <td className="pt-1 text-right text-base font-bold text-navy-950 tabular-nums">
                        {formatMoney(booking.quotedTotal, booking.currency)}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </Panel>

          <Panel title="Event">
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <Field label="Event">{RENTAL_EVENT_LABELS[booking.eventType] ?? booking.eventType}</Field>
              <Field label="Dates">{formatRentalDates(booking.startDate, booking.endDate)}</Field>
              <Field label="Venue">
                {booking.venue}, {booking.city}
              </Field>
              <Field label="Guests">{booking.guests ?? "Not given"}</Field>
              <Field label="Delivery">{booking.needsDelivery ? "Yes - we deliver" : "Customer collects"}</Field>
              <Field label="Setup">{booking.needsSetup ? "Yes - we set up" : "No"}</Field>
              <Field label="Requested">{formatDateTime(booking.createdAt)}</Field>
              {booking.cancelReason && <Field label="Cancel reason">{booking.cancelReason}</Field>}
            </dl>
            {booking.message && (
              <div className="mt-5 rounded-xl bg-navy-50 p-4 text-sm whitespace-pre-line text-slate-700">
                <p className="mb-1 text-xs font-semibold tracking-wide text-navy-800 uppercase">Customer message</p>
                {booking.message}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <p className="font-medium text-navy-900">{customerName(booking.customer)}</p>
            {booking.customer.phone && (
              <p className="mt-1 text-sm font-medium text-navy-800">
                <a href={`tel:${booking.customer.phone}`}>{booking.customer.phone}</a>
              </p>
            )}
            <p className="text-sm text-slate-600">{booking.customer.email}</p>
            {hasPrivilege(user, "customers:read") && (
              <Link href={`/customers/${booking.customer.id}`} className="btn-outline btn-sm mt-4">
                Open customer {booking.customer.reference}
              </Link>
            )}
          </Panel>

          {canEdit ? (
            <Panel title="Price and notes">
              <RentalPriceForm booking={booking} />
            </Panel>
          ) : (
            booking.staffNotes && (
              <Panel title="Internal notes">
                <p className="text-sm whitespace-pre-line text-slate-700">{booking.staffNotes}</p>
              </Panel>
            )
          )}
        </div>
      </div>
    </>
  );
}

function Panel({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <section className="card rise p-6">
      <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
      {text && <p className="mt-1 text-sm text-slate-500">{text}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-slate-800">{children}</dd>
    </div>
  );
}
