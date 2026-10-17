// Display helpers shared by pages and client components

type Amount = number | string | null | undefined;

export function formatMoney(amount: Amount, currency: string | null | undefined) {
  if (amount == null || currency == null) {
    return "";
  }
  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

export function formatDate(value: Date | string | null | undefined) {
  if (value == null) {
    return "";
  }
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (value == null) {
    return "";
  }
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const MODE_LABELS: Record<string, string> = {
  IN_PERSON: "Office visit",
  PHONE: "Phone call",
  VIDEO: "Video call",
};

// Appointments are always shown in office time, whatever the computer's zone
export const OFFICE_TIME_ZONE = "Asia/Colombo";
const OFFICE_UTC_OFFSET = "+05:30";

// "Thu 15 Oct 2026, 09:30"
export function formatAppointmentTime(value: Date | string | null | undefined) {
  if (value == null) {
    return "";
  }
  return new Date(value).toLocaleString("en-GB", {
    timeZone: OFFICE_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "09:30"
export function formatOfficeClock(value: Date | string) {
  return new Date(value).toLocaleTimeString("en-GB", {
    timeZone: OFFICE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ISO time -> "2026-10-15T09:30" for <input type="datetime-local"> (office time)
export function toOfficeInput(value: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: OFFICE_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

// "2026-10-15T09:30" typed in office time -> ISO string for the API
export function fromOfficeInput(value: string) {
  return new Date(`${value}:00${OFFICE_UTC_OFFSET}`).toISOString();
}

// "AWAITING_CUSTOMER" -> "Awaiting customer"
export function humanize(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function customerName(customer: {
  firstName: string;
  lastName: string | null;
  companyName: string | null;
}) {
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ");
  return customer.companyName ? `${name} (${customer.companyName})` : name;
}
