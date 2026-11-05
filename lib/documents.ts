// Which uploaded documents need an admin's approval. Mirrors
// APPROVAL_REQUIRED_TYPES in the backend's lib/documents.ts: only CUSTOMER
// uploads of these types wait for approval; staff uploads never do.

export const APPROVAL_REQUIRED_TYPES = [
  "PASSPORT",
  "VISA_DOCUMENT",
  "OWNERSHIP",
  "PERMIT",
  "CERTIFICATE",
  "VALUATION",
];

export const NO_APPROVAL_TYPES = [
  "VISA_CHECKLIST",
  "TICKET",
  "ITINERARY",
  "INSURANCE_POLICY",
  "CONFIRMATION",
  "INVOICE",
  "PACKING_LIST",
  "SHIPPING_RECORD",
  "CV",
  "PHOTO",
  "OTHER",
];

export const DOCUMENT_TYPES = [...APPROVAL_REQUIRED_TYPES, ...NO_APPROVAL_TYPES];

// Approval values -> what the admin reads
export const APPROVAL_LABELS: Record<string, string> = {
  PENDING: "Waiting for approval",
  APPROVED: "Approved",
  CANCELLED: "Cancelled",
  NOT_REQUIRED: "No approval needed",
};
