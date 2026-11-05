// Shapes returned by the backend API. Kept to the fields the admin uses.

export type Role = "CUSTOMER" | "STAFF" | "FINANCE" | "ADMIN" | "SUPPLIER";

export type Division =
  | "TRAVEL"
  | "EVENTS"
  | "GEMS"
  | "VEHICLES"
  | "IMPORT"
  | "EXPORT";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  privileges: string[];
  divisions: Division[];
}

export interface Pagination {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

export interface CustomerSummary {
  id: string;
  reference: string;
  firstName: string;
  lastName: string | null;
  companyName: string | null;
  email: string;
  phone: string | null;
  country: string | null;
}

// ─────────────── Overseas jobs (backend lib/jobs.ts) ───────────────

export type JobApplicationStatus =
  | "APPLIED"
  | "SHORTLISTED"
  | "INTERVIEWING"
  | "SELECTED"
  | "MEDICAL"
  | "VISA_PROCESSING"
  | "DEPLOYED"
  | "REJECTED"
  | "WITHDRAWN";

export const APPLICATION_STATUS_LABELS: Record<JobApplicationStatus, string> = {
  APPLIED: "New",
  SHORTLISTED: "Shortlisted",
  INTERVIEWING: "Interviewing",
  SELECTED: "Selected",
  MEDICAL: "Medical test",
  VISA_PROCESSING: "Visa processing",
  DEPLOYED: "Departed",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export const INTERVIEW_STAGE_LABELS: Record<string, string> = {
  OFFICE: "Our office interview",
  EMPLOYER: "Employer interview",
  TRADE_TEST: "Trade test",
  EMBASSY: "Embassy interview",
  MEDICAL: "Medical test",
};

export const INTERVIEW_RESULT_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  PASSED: "Passed",
  FAILED: "Failed",
  NO_SHOW: "Did not attend",
  CANCELLED: "Cancelled",
};

export interface JobInterview {
  id: string;
  stage: string;
  mode: "IN_PERSON" | "PHONE" | "VIDEO";
  scheduledAt: string;
  location: string | null;
  interviewer: string | null;
  instructions: string | null;
  result: string;
  feedback: string | null;
}

export interface JobApplication {
  id: string;
  reference: string;
  status: JobApplicationStatus;
  dateOfBirth: string | null;
  passportNumber: string | null;
  passportExpiry: string | null;
  experienceYears: number | null;
  currentJob: string | null;
  message: string | null;
  staffNotes: string | null;
  rejectReason: string | null;
  createdAt: string;
  customer: CustomerSummary;
  vacancy: {
    id: string;
    reference: string;
    title: string;
    country: string;
    city?: string | null;
    interviewMode?: string | null;
    interviewAt?: string | null;
    interviewPlace?: string | null;
  };
  interviews: JobInterview[];
  nextStatuses?: JobApplicationStatus[];
  canInterview?: boolean;
}

// ─────────────── Rentals (backend lib/rentals.ts) ───────────────

export type RentalStatus = "REQUESTED" | "CONFIRMED" | "DELIVERED" | "RETURNED" | "CANCELLED";

export const RENTAL_EVENT_LABELS: Record<string, string> = {
  WEDDING: "Wedding",
  FUNERAL: "Funeral",
  BIRTHDAY: "Birthday",
  RELIGIOUS: "Religious ceremony",
  CORPORATE: "Corporate event",
  PARTY: "Party",
  OTHER: "Other event",
};

export interface RentalBookingItem {
  id: string;
  rentalItemId: string;
  name: string;
  quantity: number;
  pricePerDay: string;
  days: number;
  lineTotal: string;
  rentalItem?: { id: string; sku: string; unit: string; quantityOwned: number; images: string[] };
}

export interface RentalBooking {
  id: string;
  reference: string;
  status: RentalStatus;
  eventType: string;
  startDate: string; // "2026-11-14T00:00:00.000Z" = that calendar day
  endDate: string;
  venue: string;
  city: string;
  guests: number | null;
  needsDelivery: boolean;
  needsSetup: boolean;
  message: string | null;
  currency: string;
  estimatedTotal: string;
  quotedTotal: string | null;
  staffNotes: string | null;
  cancelReason: string | null;
  createdAt: string;
  customer: CustomerSummary;
  items: RentalBookingItem[];
  availability?: Record<string, number>; // free units per item on these dates (detail page)
  nextStatuses?: RentalStatus[];
}

export interface StaffName {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Enquiry {
  id: string;
  reference: string;
  division: Division;
  serviceType: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  customer: CustomerSummary;
  assignedTo?: StaffName | null;
}

export type AppointmentStatus = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type AppointmentMode = "IN_PERSON" | "PHONE" | "VIDEO";

export interface Appointment {
  id: string;
  reference: string;
  division: Division;
  serviceType: string | null;
  subject: string;
  message: string | null;
  mode: AppointmentMode;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  location: string | null;
  meetingLink: string | null;
  staffNotes: string | null;
  cancelReason: string | null;
  createdAt: string;
  customer: CustomerSummary;
  assignedTo?: StaffName | null;
  enquiry?: { id: string; reference: string; subject: string } | null;
  // Google Calendar (detail page only)
  googleEventId?: string | null;
  googleEventLink?: string | null;
  calendarSyncedAt?: string | null;
  calendarError?: string | null;
  calendarEnabled?: boolean;
  googleCalendarUrl?: string;
}

export interface Customer extends CustomerSummary {
  type: string;
  status: string; // INACTIVE = deleted
  createdAt: string;
  _count?: { enquiries: number; quotations: number; orders: number };
}

export interface Quotation {
  id: string;
  reference: string;
  division: Division;
  status: string;
  currency: string;
  total: string;
  validUntil: string;
  createdAt: string;
  customer: CustomerSummary;
}

export interface Order {
  id: string;
  reference: string;
  division: Division;
  status: string;
  currency: string;
  total: string;
  amountPaid: string;
  createdAt: string;
  customer: CustomerSummary;
  quotation: { id: string; reference: string } | null;
  details: { source?: string; checkout?: string } | null; // source "ONLINE_SHOP" = website cart
}

export interface Payment {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  method: string;
  status: string;
  provider: "STRIPE" | "PAYHERE" | null; // card gateway; null = bank transfer, cash ...
  providerReference: string | null; // Stripe: cs_... / pi_..., PayHere: payment id
  checkoutReference: string | null; // set for online shop card payments
  paidAt: string | null;
  createdAt: string;
  customer: CustomerSummary;
  order: { id: string; reference: string; division: Division; total: string };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  status: string;
  divisions: Division[];
  privileges: string[];
  createdAt: string;
  lastLogin: string | null;
}

export interface Supplier {
  id: string;
  reference: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  productsSupplied: string[];
  divisions: Division[];
  status: string;
  createdAt: string;
}

// Any record edited through components/ResourceForm.tsx (tour, gem, user ...).
// Field names come from lib/resources.ts, which mirrors the backend DTOs.
export type Item = { id: string } & Record<string, unknown>;

export interface DashboardData {
  counts: {
    openEnquiries: number;
    unassignedEnquiries: number;
    myEnquiries: number;
    quotesAwaitingReply: number;
    activeOrders: number;
    paymentsToConfirm: number;
    delayedShipments: number;
    appointmentsToConfirm: number;
  };
  upcomingAppointments: Pick<
    Appointment,
    "id" | "reference" | "division" | "subject" | "mode" | "status" | "startAt" | "endAt" | "customer"
  >[];
  openEnquiriesByDivision: { division: Division; count: number }[];
  recentEnquiries: Enquiry[];
}

export interface GalleryPhoto {
  id: string;
  division: Division;
  title: string;
  caption: string | null;
  place: string | null;
  country: string | null;
  takenAt: string | null;
  imageUrl: string | null;
  mimeType: string | null; // set = uploaded file
  sortOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  src: string;
}

export interface Review {
  id: string;
  division: Division;
  rating: number;
  title: string | null;
  body: string;
  tripDate: string | null;
  status: "PUBLISHED" | "HIDDEN";
  removedReason: string | null;
  removedAt: string | null;
  createdAt: string;
  customer: CustomerSummary;
  tour: { id: string; slug: string; title: string } | null;
  removedBy: StaffName | null;
}

export interface ReviewSummary {
  average: number | null;
  count: number;
  stars: { stars: number; count: number }[];
}
