// Rental bookings are for whole calendar days ("2026-11-14T00:00:00.000Z"),
// so they are shown in UTC - never shifted by the viewer's time zone.
export function formatRentalDay(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatRentalDates(start: string, end: string) {
  return start.slice(0, 10) == end.slice(0, 10)
    ? formatRentalDay(start)
    : `${formatRentalDay(start)} - ${formatRentalDay(end)}`;
}

export function rentalDays(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1;
}
