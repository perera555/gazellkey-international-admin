import { Division } from "@/lib/types";

// Sidebar menu. "privilege" matches the backend's lib/privileges.ts -
// items the user cannot open are hidden (the API still checks every call).
// "division" limits catalogue items to staff of that division.
export interface NavItem {
  href: string;
  label: string;
  privilege?: string;
  division?: Division;
  color?: string;
  badge?: "documents" | "orders"; // shows how many are waiting for approval
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/", label: "Dashboard", privilege: "enquiries:read" }],
  },
  {
    title: "Sales",
    items: [
      { href: "/enquiries", label: "Enquiries", privilege: "enquiries:read" },
      { href: "/appointments", label: "Appointments", privilege: "appointments:read" },
      { href: "/customers", label: "Customers", privilege: "customers:read" },
      { href: "/quotations", label: "Quotations", privilege: "quotations:read" },
      { href: "/orders", label: "Orders & bookings", privilege: "orders:read", badge: "orders" },
      { href: "/payments", label: "Payments", privilege: "payments:read" },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/catalogue/shop", label: "Shop products", privilege: "catalogue:edit", color: "#C9A227" },
      { href: "/catalogue/tours", label: "Tour packages", privilege: "catalogue:edit", division: "TRAVEL", color: "#1E88E5" },
      { href: "/catalogue/hotels", label: "Hotels", privilege: "catalogue:edit", division: "TRAVEL", color: "#1E88E5" },
      { href: "/catalogue/events", label: "Events", privilege: "catalogue:edit", division: "EVENTS", color: "#F26B21" },
      { href: "/catalogue/gems", label: "Gems & jewellery", privilege: "catalogue:edit", division: "GEMS", color: "#8E24AA" },
      { href: "/catalogue/vehicles", label: "Vehicles & machinery", privilege: "catalogue:edit", division: "VEHICLES", color: "#2E9E4F" },
      { href: "/catalogue/parts", label: "Spare parts", privilege: "catalogue:edit", division: "VEHICLES", color: "#2E9E4F" },
      { href: "/catalogue/imports", label: "Import products", privilege: "catalogue:edit", division: "IMPORT", color: "#E53935" },
      { href: "/catalogue/exports", label: "Export products", privilege: "catalogue:edit", division: "EXPORT", color: "#E0A100" },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/gallery", label: "Travel gallery", privilege: "catalogue:edit", division: "TRAVEL" },
      { href: "/reviews", label: "Customer reviews", privilege: "reviews:moderate" },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/documents", label: "Document approvals", privilege: "documents:approve", badge: "documents" },
      { href: "/suppliers", label: "Suppliers", privilege: "suppliers:read" },
      { href: "/users", label: "Users", privilege: "users:read" },
    ],
  },
];

export const DIVISIONS = [
  "TRAVEL",
  "EVENTS",
  "GEMS",
  "VEHICLES",
  "IMPORT",
  "EXPORT",
] as const;
