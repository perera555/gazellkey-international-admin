import { formatDate, formatMoney, humanize } from "@/lib/format";
import { fallbackImage } from "@/lib/media";
import { Division, Item } from "@/lib/types";

// Everything the admin can add, edit and delete (soft delete). Each resource lists the
// form fields of its backend DTO (gazellkey-client types/dto/*.ts), so
// components/ResourceForm.tsx can build the add and edit pages from it.

export type Option = { value: string; label: string };

export type FieldType =
  | "text"
  | "email"
  | "password"
  | "textarea"
  | "number"
  | "currency"
  | "select"
  | "checkbox"
  | "lines" // string[], one per line
  | "dates" // date[], one per line
  | "datetime"
  | "json" // object, "key: value" per line
  | "images" // URL[], one per line, with previews
  | "multi" // string[] from checkboxes
  | "models" // string[] of "Make Model", picked by make (components/ModelPicker.tsx)
  | "itinerary"; // [{ day, title, description }]

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: Option[];
  optionsFrom?: "suppliers" | "vehicleModels"; // options loaded by the page
  defaultValue?: string | boolean | string[];
  help?: string;
  placeholder?: string;
  integer?: boolean;
  nullable?: boolean; // emptying the field sends null (clears it)
  only?: "create" | "edit";
  wide?: boolean; // takes the full row
  showIf?: { field: string; value: string };
  slugFrom?: string; // filled from this field while adding
  uppercase?: boolean;
}

export interface Section {
  title: string;
  description?: string;
  fields: Field[];
}

export interface Resource {
  key: string;
  title: string;
  singular: string;
  description: string;
  endpoint: string; // backend route
  path: string; // admin list page
  privilege: string; // needed to edit
  division?: Division;
  color: string;
  sections: Section[];
  fixed?: Record<string, string>; // always sent when adding
  // "Delete" is a soft delete everywhere: the record is disabled (status
  // removedStatus), never erased, so its history stays and it can be restored.
  remove: {
    method: "DELETE" | "PUT";
    body?: Record<string, string>;
    removedStatus: string;
    note: string;
  };
  restore: { label: string; body: Record<string, string>; note: string };
  titleOf: (item: Item) => string;
}

// A column of the table view (resources with `table` are listed as a table, not cards)
export interface TableColumn {
  header: string;
  value: (item: Item) => string;
  style?: "title" | "mono" | "muted" | "right";
}

export interface CatalogueResource extends Resource {
  listQuery?: Record<string, string>;
  table?: TableColumn[];
  searchPlaceholder?: string;
  filters: { name: string; label: string; options: string[]; labels?: Record<string, string> }[];
  card: (item: Item) => {
    image: string;
    eyebrow?: string;
    details: string[];
    price: string;
    badge?: string;
  };
}

// ─────────────── Options (values match the backend enums) ───────────────

function opts(values: string[], labels: Record<string, string> = {}): Option[] {
  return values.map((value) => ({ value: value, label: labels[value] ?? humanize(value) }));
}

export const DIVISION_OPTIONS = opts(["TRAVEL", "EVENTS", "GEMS", "VEHICLES", "IMPORT", "EXPORT"]);
const PUBLISH_STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const PRICING_MODES = opts(["ON_REQUEST", "FIXED"], { ON_REQUEST: "Price on request", FIXED: "Fixed price" });
const AVAILABILITY = ["AVAILABLE", "RESERVED", "SOLD"];
const TOUR_TYPES = ["OUTBOUND", "INBOUND"];
const EVENT_TYPES = ["TRADE_SHOW", "EXHIBITION", "WORKSHOP", "CONFERENCE", "FOOD_FESTIVAL", "SPORTS_TOURNAMENT"];
const GEM_TYPES = ["GEMSTONE", "JEWELLERY"];
const VEHICLE_TYPES = ["NEW_VEHICLE", "USED_VEHICLE", "SPARE_PART", "HEAVY_MACHINERY"];
export const ROLES = ["STAFF", "FINANCE", "ADMIN", "SUPPLIER", "CUSTOMER"];
export const USER_STATUSES = ["ACTIVE", "INACTIVE", "BANNED"];

const CATEGORY_LABELS: Record<string, string> = {
  COMPUTERS_HARDWARE_PHONES: "Computers, hardware & phones",
  POWER_HAND_TOOLS: "Power & hand tools",
  FRUITS_VEGETABLES: "Fruits & vegetables",
};
const IMPORT_CATEGORIES = [
  "SPORTS_ITEMS",
  "SHOES",
  "CLOTHES",
  "FANCY_ITEMS",
  "ELECTRICAL_ITEMS",
  "COMPUTERS_HARDWARE_PHONES",
  "FOOD_ITEMS",
  "POWER_HAND_TOOLS",
];
const EXPORT_CATEGORIES = ["COFFEE", "CHOCOLATE", "TEA", "SPICES", "FRUITS_VEGETABLES"];

// Same list as the backend's lib/privileges.ts
const PRIVILEGES = [
  "users:read",
  "users:edit",
  "customers:read",
  "customers:edit",
  "enquiries:read",
  "enquiries:edit",
  "appointments:read",
  "appointments:edit",
  "quotations:read",
  "quotations:edit",
  "orders:read",
  "orders:edit",
  "payments:read",
  "payments:create",
  "payments:confirm",
  "refunds:create",
  "documents:read",
  "documents:edit",
  "documents:restricted",
  "documents:approve",
  "catalogue:edit",
  "travel:cases",
  "events:registrations",
  "suppliers:read",
  "suppliers:edit",
  "supplierCost:read",
  "shipments:edit",
  "reports:read",
  "audit:read",
  "content:edit",
  "reviews:moderate",
].map((value) => ({ value: value, label: value }));

// ─────────────── Shared field groups ───────────────

const pricingSection: Section = {
  title: "Pricing & publishing",
  description: "Only published items appear on the website.",
  fields: [
    { name: "pricingMode", label: "Pricing", type: "select", options: PRICING_MODES, defaultValue: "ON_REQUEST", required: true },
    { name: "price", label: "Price", type: "number", showIf: { field: "pricingMode", value: "FIXED" }, required: true },
    { name: "currency", label: "Currency", type: "currency", defaultValue: "USD", placeholder: "USD", showIf: { field: "pricingMode", value: "FIXED" }, required: true },
    { name: "status", label: "Status", type: "select", options: opts(PUBLISH_STATUS), defaultValue: "DRAFT", required: true },
  ],
};

const photosSection: Section = {
  title: "Photos",
  description: "Image URLs, one per line. The first is the cover photo.",
  fields: [{ name: "images", label: "Image URLs", type: "images", wide: true, placeholder: "https://...\n/images/gems-ring.jpg" }],
};

const supplierSection: Section = {
  title: "Supplier (internal)",
  description: "Never shown to customers.",
  fields: [
    { name: "supplierId", label: "Supplier", type: "select", optionsFrom: "suppliers", nullable: true },
    { name: "supplierCost", label: "Supplier cost", type: "number" },
  ],
};

// Catalogue delete = the backend's DELETE, which archives the item
const archive = {
  method: "DELETE" as const,
  removedStatus: "ARCHIVED",
  note: "The item is disabled (archived), not permanently deleted. It disappears from the website but keeps its enquiry and order history, and you can restore it later.",
};
const restoreAsDraft = {
  label: "Restore",
  body: { status: "DRAFT" },
  note: "It comes back as a draft. Publish it again to show it on the website.",
};

// Delete for people / suppliers = set status INACTIVE
function disable(note: string) {
  return { method: "PUT" as const, body: { status: "INACTIVE" }, removedStatus: "INACTIVE", note: note };
}
const restoreActive = {
  label: "Restore",
  body: { status: "ACTIVE" },
  note: "The record becomes active again.",
};

// Every "Delete" button uses this label, so it reads the same everywhere
export const DELETE_LABEL = "Delete";

export function isRemoved(resource: Resource, item: Item) {
  return item.status == resource.remove.removedStatus;
}

const listingStatusFilter = {
  name: "status",
  label: "Status",
  options: PUBLISH_STATUS,
  labels: { ARCHIVED: "Deleted (archived)" },
};

function priceOf(item: Item, priceField = "price") {
  return item.pricingMode == "FIXED" && item[priceField] != null
    ? formatMoney(item[priceField] as string, item.currency as string)
    : "Price on request";
}

function photo(item: Item, division: Division, category?: unknown) {
  const images = item.images as string[] | undefined;
  return images?.[0] || fallbackImage(division, category as string);
}

const text = (value: unknown) => (value == null || value === "" ? "" : String(value));

// ─────────────── Catalogue ───────────────

const tours: CatalogueResource = {
  key: "tours",
  title: "Tour packages",
  singular: "tour",
  description: "Outbound holidays and Sri Lanka tours shown on the Travel pages.",
  endpoint: "/api/travel/tours",
  path: "/catalogue/tours",
  privilege: "catalogue:edit",
  division: "TRAVEL",
  color: "#1E88E5",
  remove: archive,
  restore: restoreAsDraft,
  titleOf: (item) => text(item.title),
  filters: [{ name: "tourType", label: "Type", options: TOUR_TYPES }, listingStatusFilter],
  card: (item) => ({
    image: photo(item, "TRAVEL"),
    eyebrow: item.tourType == "INBOUND" ? "Sri Lanka tour" : "Outbound",
    details: [[item.destination, item.country].filter(Boolean).join(", "), `${item.durationDays} days`],
    price: priceOf(item),
  }),
  sections: [
    {
      title: "Tour details",
      fields: [
        { name: "title", label: "Title", type: "text", required: true, wide: true },
        { name: "slug", label: "Web address (slug)", type: "text", required: true, slugFrom: "title", help: "Lower-case letters, numbers and dashes." },
        { name: "tourType", label: "Tour type", type: "select", options: opts(TOUR_TYPES, { INBOUND: "Inbound (Sri Lanka)" }), required: true },
        { name: "destination", label: "Destination", type: "text", required: true },
        { name: "country", label: "Country", type: "text", placeholder: "Thailand", help: "Visitors can search tours by country." },
        { name: "durationDays", label: "Duration (days)", type: "number", integer: true, required: true },
        { name: "summary", label: "Summary", type: "textarea", required: true, wide: true },
      ],
    },
    {
      title: "Itinerary",
      description: "Day-by-day plan shown on the tour page.",
      fields: [{ name: "itinerary", label: "Days", type: "itinerary", wide: true }],
    },
    {
      title: "Departures & group",
      fields: [
        { name: "departureDates", label: "Departure dates", type: "dates", help: "One date per line (YYYY-MM-DD)." },
        { name: "isCustomisable", label: "Customers can customise this tour", type: "checkbox" },
        { name: "minGroupSize", label: "Minimum group size", type: "number", integer: true },
        { name: "maxGroupSize", label: "Maximum group size", type: "number", integer: true },
        { name: "inclusions", label: "Included", type: "lines", help: "One per line." },
        { name: "exclusions", label: "Not included", type: "lines", help: "One per line." },
      ],
    },
    pricingSection,
    photosSection,
  ],
};

// Hotels shown on the website's /hotels page; customers send a booking request
const hotels: CatalogueResource = {
  key: "hotels",
  title: "Hotels",
  singular: "hotel",
  description: "Hotels our Travel team books for customers. Shown on the website's Hotels page.",
  endpoint: "/api/travel/hotels",
  path: "/catalogue/hotels",
  privilege: "catalogue:edit",
  division: "TRAVEL",
  color: "#1E88E5",
  remove: archive,
  restore: restoreAsDraft,
  titleOf: (item) => text(item.name),
  searchPlaceholder: "Hotel name, city or country...",
  filters: [listingStatusFilter],
  table: [
    { header: "Hotel", value: (item) => text(item.name), style: "title" },
    { header: "City", value: (item) => text(item.city) },
    { header: "Country", value: (item) => text(item.country) },
    { header: "Stars", value: (item) => (item.starRating ? "★".repeat(Number(item.starRating)) : "-") },
    { header: "Room types", value: (item) => (Array.isArray(item.roomTypes) ? String(item.roomTypes.length) : "0"), style: "right" },
    { header: "From / night", value: (item) => priceOf(item), style: "right" },
  ],
  card: (item) => ({
    image: photo(item, "TRAVEL"),
    eyebrow: item.starRating ? `${"★".repeat(Number(item.starRating))} hotel` : "Hotel",
    details: [[item.city, item.country].filter(Boolean).join(", ")],
    price: priceOf(item),
  }),
  sections: [
    {
      title: "Hotel details",
      fields: [
        { name: "name", label: "Hotel name", type: "text", required: true, wide: true, placeholder: "Jetwing Lighthouse" },
        { name: "slug", label: "Web address (slug)", type: "text", required: true, slugFrom: "name", help: "Lower-case letters, numbers and dashes." },
        { name: "starRating", label: "Star rating (1-5)", type: "number", integer: true, placeholder: "5" },
        { name: "city", label: "City", type: "text", required: true, placeholder: "Galle" },
        { name: "country", label: "Country", type: "text", required: true, placeholder: "Sri Lanka" },
        { name: "address", label: "Address", type: "text", wide: true },
        { name: "summary", label: "Description", type: "textarea", required: true, wide: true },
      ],
    },
    {
      title: "Rooms & facilities",
      fields: [
        { name: "roomTypes", label: "Room types", type: "lines", placeholder: "Deluxe double - sea view (2 guests)\nFamily suite (4 guests)", help: "One room type per line." },
        { name: "facilities", label: "Facilities", type: "lines", placeholder: "Free Wi-Fi\nSwimming pool\nBreakfast included", help: "One per line." },
        { name: "checkInTime", label: "Check-in time", type: "text", placeholder: "14:00" },
        { name: "checkOutTime", label: "Check-out time", type: "text", placeholder: "12:00" },
      ],
    },
    {
      ...pricingSection,
      description: "Fixed = a \"from\" price per room per night. Only published hotels appear on the website.",
    },
    photosSection,
  ],
};

const events: CatalogueResource = {
  key: "events",
  title: "Events",
  singular: "event",
  description: "Trade shows, exhibitions, conferences, festivals and tournaments.",
  endpoint: "/api/events",
  path: "/catalogue/events",
  privilege: "catalogue:edit",
  division: "EVENTS",
  color: "#F26B21",
  remove: { ...archive, note: "The event is disabled (archived), not permanently deleted. It disappears from the website and registration closes. You can restore it later." },
  restore: restoreAsDraft,
  titleOf: (item) => text(item.name),
  listQuery: { past: "true" },
  filters: [{ name: "eventType", label: "Type", options: EVENT_TYPES }, listingStatusFilter],
  card: (item) => ({
    image: photo(item, "EVENTS", item.eventType),
    eyebrow: humanize(text(item.eventType)),
    details: [[item.venue, item.city].filter(Boolean).join(", "), formatDate(item.startDate as string)],
    price: item.fee == null ? "Free" : formatMoney(item.fee as string, item.currency as string),
    badge: item.registrationOpen ? "Registration open" : "Registration closed",
  }),
  sections: [
    {
      title: "Event details",
      fields: [
        { name: "name", label: "Name", type: "text", required: true, wide: true },
        { name: "slug", label: "Web address (slug)", type: "text", required: true, slugFrom: "name", help: "Lower-case letters, numbers and dashes." },
        { name: "eventType", label: "Event type", type: "select", options: opts(EVENT_TYPES), required: true },
        { name: "description", label: "Description", type: "textarea", required: true, wide: true },
        { name: "organiser", label: "Organiser", type: "text" },
      ],
    },
    {
      title: "When & where",
      fields: [
        { name: "startDate", label: "Starts", type: "datetime", required: true },
        { name: "endDate", label: "Ends", type: "datetime", required: true },
        { name: "venue", label: "Venue", type: "text", required: true, wide: true },
        { name: "city", label: "City", type: "text" },
        { name: "country", label: "Country", type: "text" },
      ],
    },
    {
      title: "Registration",
      fields: [
        { name: "registrationOpen", label: "Registration is open", type: "checkbox", defaultValue: true, wide: true },
        { name: "capacity", label: "Capacity (seats)", type: "number", integer: true, nullable: true, help: "Leave empty for unlimited." },
        { name: "fee", label: "Fee", type: "number", nullable: true, help: "Leave empty for a free event." },
        { name: "currency", label: "Currency", type: "currency", defaultValue: "USD", placeholder: "USD" },
        { name: "terms", label: "Terms & conditions", type: "textarea", wide: true },
        { name: "status", label: "Status", type: "select", options: opts(PUBLISH_STATUS), defaultValue: "DRAFT", required: true },
      ],
    },
    photosSection,
  ],
};

const gems: CatalogueResource = {
  key: "gems",
  title: "Gems & jewellery",
  singular: "gem or jewellery item",
  description: "Certified Ceylon gemstones and handcrafted jewellery.",
  endpoint: "/api/gems",
  path: "/catalogue/gems",
  privilege: "catalogue:edit",
  division: "GEMS",
  color: "#8E24AA",
  remove: archive,
  restore: restoreAsDraft,
  titleOf: (item) => text(item.name),
  filters: [
    { name: "itemType", label: "Type", options: GEM_TYPES },
    { name: "availability", label: "Availability", options: AVAILABILITY },
    listingStatusFilter,
  ],
  card: (item) => ({
    image: photo(item, "GEMS", item.itemType),
    eyebrow: text(item.category),
    details: [
      text(item.sku),
      item.weight ? `${Number(item.weight)} ${item.weightUnit}` : "",
      text(item.origin),
    ],
    price: priceOf(item),
    badge: humanize(text(item.availability)),
  }),
  sections: [
    {
      title: "Item details",
      fields: [
        { name: "name", label: "Name", type: "text", required: true, wide: true },
        { name: "sku", label: "SKU", type: "text", required: true, uppercase: true, placeholder: "GEM-SAP-001", help: "A-Z, 0-9 and dashes." },
        { name: "itemType", label: "Type", type: "select", options: opts(GEM_TYPES), required: true },
        { name: "category", label: "Category", type: "text", required: true, placeholder: "Sapphire" },
        { name: "availability", label: "Availability", type: "select", options: opts(AVAILABILITY), defaultValue: "AVAILABLE", required: true },
        { name: "description", label: "Description", type: "textarea", required: true, wide: true },
      ],
    },
    {
      title: "Specification",
      fields: [
        { name: "weight", label: "Weight", type: "number" },
        { name: "weightUnit", label: "Weight unit", type: "text", defaultValue: "ct" },
        { name: "colour", label: "Colour", type: "text" },
        { name: "cut", label: "Cut", type: "text" },
        { name: "shape", label: "Shape", type: "text" },
        { name: "clarity", label: "Clarity", type: "text" },
        { name: "origin", label: "Origin", type: "text", placeholder: "Ratnapura, Sri Lanka" },
        { name: "treatment", label: "Treatment", type: "text", placeholder: "Unheated" },
        { name: "metal", label: "Metal (jewellery)", type: "text" },
      ],
    },
    pricingSection,
    {
      ...supplierSection,
      fields: [
        ...supplierSection.fields,
        { name: "sourcingNotes", label: "Sourcing notes", type: "textarea", wide: true },
      ],
    },
    photosSection,
  ],
};

// Vehicles and spare parts share one backend table (/api/vehicles) but have
// their own admin pages and forms. ?kind= keeps the two lists apart.
// The website's vehicles page uses make + model (vehicles) and "compatible
// with" (parts, written "Make Model") for its make & model lists.
const VEHICLE_KINDS = VEHICLE_TYPES.filter((type) => type != "SPARE_PART");

const vehicles: CatalogueResource = {
  key: "vehicles",
  title: "Vehicles & machinery",
  singular: "vehicle",
  description: "New and used vehicles and heavy machinery. Spare parts have their own page.",
  endpoint: "/api/vehicles",
  path: "/catalogue/vehicles",
  privilege: "catalogue:edit",
  division: "VEHICLES",
  color: "#2E9E4F",
  listQuery: { kind: "vehicles" },
  remove: archive,
  restore: restoreAsDraft,
  titleOf: (item) => text(item.title),
  filters: [
    { name: "listingType", label: "Type", options: VEHICLE_KINDS },
    { name: "availability", label: "Availability", options: AVAILABILITY },
    listingStatusFilter,
  ],
  card: (item) => ({
    image: photo(item, "VEHICLES", item.listingType),
    eyebrow: humanize(text(item.listingType)),
    details: [text(item.sku), [item.make, item.model, item.year].filter(Boolean).join(" ")],
    price: priceOf(item),
    badge: humanize(text(item.availability)),
  }),
  sections: [
    {
      title: "Listing details",
      fields: [
        { name: "title", label: "Title", type: "text", required: true, wide: true, placeholder: "2019 Toyota Aqua G - hybrid" },
        { name: "sku", label: "SKU", type: "text", required: true, uppercase: true, placeholder: "VEH-TOY-001", help: "A-Z, 0-9 and dashes." },
        { name: "listingType", label: "Listing type", type: "select", options: opts(VEHICLE_KINDS), required: true },
        { name: "availability", label: "Availability", type: "select", options: opts(AVAILABILITY), defaultValue: "AVAILABLE", required: true },
        { name: "stock", label: "Stock", type: "number", integer: true, defaultValue: "1" },
        { name: "description", label: "Description", type: "textarea", required: true, wide: true },
      ],
    },
    {
      title: "Make & model",
      description: "Shown in the website's \"Browse by make & model\" list and its make / model search.",
      fields: [
        { name: "make", label: "Make", type: "text", required: true, placeholder: "Toyota", help: "One word, e.g. Toyota, Honda, Caterpillar." },
        { name: "model", label: "Model", type: "text", required: true, placeholder: "Aqua" },
        { name: "year", label: "Year", type: "number", integer: true },
        { name: "condition", label: "Condition", type: "text", placeholder: "Brand new / Used - excellent" },
      ],
    },
    {
      title: "Specification",
      fields: [
        { name: "mileageKm", label: "Mileage (km)", type: "number", integer: true, help: "Cars and vans." },
        { name: "operatingHours", label: "Operating hours", type: "number", integer: true, help: "Heavy machinery." },
        { name: "fuelType", label: "Fuel type", type: "text", placeholder: "Hybrid" },
        { name: "transmission", label: "Transmission", type: "text", placeholder: "Automatic" },
        { name: "specifications", label: "More specifications", type: "json", wide: true, placeholder: "Engine: 1.5L\nSeats: 5", help: "One \"name: value\" per line." },
      ],
    },
    pricingSection,
    supplierSection,
    photosSection,
  ],
};

const parts: CatalogueResource = {
  key: "parts",
  title: "Spare parts",
  singular: "spare part",
  description: "Parts for cars, vans and machinery, with the models each part fits.",
  endpoint: "/api/vehicles",
  path: "/catalogue/parts",
  privilege: "catalogue:edit",
  division: "VEHICLES",
  color: "#2E9E4F",
  fixed: { listingType: "SPARE_PART" },
  listQuery: { kind: "parts" },
  searchPlaceholder: "Part name, SKU or part number...",
  table: [
    { header: "Part name", value: (item) => text(item.title), style: "title" },
    { header: "SKU", value: (item) => text(item.sku), style: "mono" },
    { header: "Part number", value: (item) => (item.partNumber ? text(item.partNumber) : "-"), style: "mono" },
    {
      header: "Fits models",
      value: (item) => (Array.isArray(item.compatibleWith) ? (item.compatibleWith as string[]).join(", ") : "") || "-",
      style: "muted",
    },
    { header: "Condition", value: (item) => (item.condition ? text(item.condition) : "-"), style: "muted" },
    { header: "Stock", value: (item) => text(item.stock), style: "right" },
    { header: "Price", value: (item) => priceOf(item), style: "right" },
  ],
  remove: archive,
  restore: restoreAsDraft,
  titleOf: (item) => text(item.title),
  filters: [
    { name: "availability", label: "Availability", options: AVAILABILITY },
    listingStatusFilter,
  ],
  card: (item) => {
    const fits = Array.isArray(item.compatibleWith) ? (item.compatibleWith as string[]) : [];
    return {
      image: photo(item, "VEHICLES", "SPARE_PART"),
      eyebrow: "Spare part",
      details: [
        [text(item.sku), item.partNumber ? `Part no. ${text(item.partNumber)}` : ""].filter(Boolean).join(" · "),
        fits.length > 0 ? `Fits ${fits.slice(0, 3).join(", ")}${fits.length > 3 ? ` +${fits.length - 3}` : ""}` : "No models listed",
      ],
      price: priceOf(item),
      badge: Number(item.stock) > 0 ? `${text(item.stock)} in stock` : humanize(text(item.availability)),
    };
  },
  sections: [
    {
      title: "Part details",
      fields: [
        { name: "title", label: "Part name", type: "text", required: true, wide: true, placeholder: "Front brake pads (set of 4)" },
        { name: "sku", label: "SKU", type: "text", required: true, uppercase: true, placeholder: "PRT-BRK-001", help: "A-Z, 0-9 and dashes." },
        { name: "partNumber", label: "Part number", type: "text", placeholder: "04465-52260", help: "The maker's (OEM) number - customers search by it." },
        { name: "condition", label: "Condition", type: "text", placeholder: "Genuine new / Reconditioned" },
        { name: "availability", label: "Availability", type: "select", options: opts(AVAILABILITY), defaultValue: "AVAILABLE", required: true },
        { name: "stock", label: "Stock", type: "number", integer: true, defaultValue: "1" },
        { name: "description", label: "Description", type: "textarea", required: true, wide: true },
      ],
    },
    {
      title: "Fits these models",
      description: "The website lists this part under each model here (\"Parts for Toyota Aqua\").",
      fields: [
        {
          name: "compatibleWith",
          label: "Compatible models",
          type: "models",
          optionsFrom: "vehicleModels",
          required: true,
          wide: true,
          help: "Open a make and tick every model this part fits. Not listed? Add it at the bottom as Make Model, e.g. Toyota Roomy.",
        },
        { name: "specifications", label: "More specifications", type: "json", wide: true, placeholder: "Brand: Denso\nPosition: Front", help: "One \"name: value\" per line." },
      ],
    },
    pricingSection,
    supplierSection,
    photosSection,
  ],
};

function tradeResource(direction: "IMPORT" | "EXPORT"): CatalogueResource {
  const isImport = direction == "IMPORT";
  const categories = isImport ? IMPORT_CATEGORIES : EXPORT_CATEGORIES;
  return {
    key: isImport ? "imports" : "exports",
    title: isImport ? "Import products" : "Export products",
    singular: isImport ? "import product" : "export product",
    description: isImport
      ? "Goods sourced worldwide and delivered to Sri Lanka."
      : "Ceylon coffee, tea, spices, chocolate and fresh produce.",
    endpoint: "/api/trade/products",
    path: isImport ? "/catalogue/imports" : "/catalogue/exports",
    privilege: "catalogue:edit",
    division: direction,
    color: isImport ? "#E53935" : "#E0A100",
    fixed: { direction: direction },
    remove: archive,
    restore: restoreAsDraft,
    titleOf: (item) => text(item.name),
    listQuery: { direction: direction },
    filters: [{ name: "category", label: "Category", options: categories }, listingStatusFilter],
    card: (item) => ({
      image: photo(item, direction, item.category),
      eyebrow: CATEGORY_LABELS[text(item.category)] ?? humanize(text(item.category)),
      details: [text(item.sku), text(item.origin), item.requiresPermit ? "Permit needed" : ""],
      price: item.pricingMode == "FIXED" && item.price != null ? `${priceOf(item)} / ${item.unit}` : priceOf(item),
    }),
    sections: [
      {
        title: "Product details",
        fields: [
          { name: "name", label: "Name", type: "text", required: true, wide: true },
          { name: "sku", label: "SKU", type: "text", required: true, uppercase: true, placeholder: isImport ? "IMP-ELE-001" : "EXP-TEA-001", help: "A-Z, 0-9 and dashes." },
          { name: "category", label: "Category", type: "select", options: opts(categories, CATEGORY_LABELS), required: true },
          { name: "description", label: "Description", type: "textarea", required: true, wide: true },
          { name: "origin", label: "Origin", type: "text" },
          { name: "packaging", label: "Packaging", type: "text" },
        ],
      },
      {
        title: "Quantities",
        fields: [
          { name: "unit", label: "Unit", type: "text", defaultValue: "kg", required: true },
          { name: "minimumOrderQty", label: "Minimum order quantity", type: "number" },
          { name: "stockQty", label: "Stock quantity", type: "number" },
          { name: "requiresPermit", label: "Needs an import/export permit", type: "checkbox" },
          { name: "specifications", label: "Specifications", type: "json", wide: true, placeholder: "Grade: BOPF\nMoisture: 3%", help: "One \"name: value\" per line." },
        ],
      },
      pricingSection,
      supplierSection,
      photosSection,
    ],
  };
}

export const CATALOGUE: CatalogueResource[] = [
  tours,
  hotels,
  events,
  gems,
  vehicles,
  parts,
  tradeResource("IMPORT"),
  tradeResource("EXPORT"),
];

export function findCatalogue(key: string) {
  return CATALOGUE.find((resource) => resource.key == key);
}

// ─────────────── People ───────────────

export const USERS: Resource = {
  key: "users",
  title: "Users",
  singular: "user",
  description: "Accounts that can sign in: staff, finance, admins, suppliers and customers.",
  endpoint: "/api/users",
  path: "/users",
  privilege: "users:edit",
  color: "#C9A227",
  remove: disable("The account is disabled, not permanently deleted: it can no longer sign in, but its history stays. You can restore it at any time."),
  restore: restoreActive,
  titleOf: (item) => `${item.firstName} ${item.lastName}`,
  sections: [
    {
      title: "Account",
      fields: [
        { name: "firstName", label: "First name", type: "text", required: true },
        { name: "lastName", label: "Last name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "text" },
        { name: "password", label: "Password", type: "password", required: true, only: "create", help: "At least 8 characters. Share it with the user securely." },
      ],
    },
    {
      title: "Access",
      description: "A role gives its default privileges. Divisions limit staff to their own records.",
      fields: [
        { name: "role", label: "Role", type: "select", options: opts(ROLES), defaultValue: "STAFF", required: true },
        { name: "status", label: "Status", type: "select", options: opts(USER_STATUSES), required: true, only: "edit" },
        { name: "divisions", label: "Divisions", type: "multi", options: DIVISION_OPTIONS, wide: true },
        {
          name: "privileges",
          label: "Privileges",
          type: "multi",
          options: PRIVILEGES,
          wide: true,
          help: "Leave as is to use the role's defaults. Changing the role resets them unless you also change this list.",
        },
      ],
    },
  ],
};

export const CUSTOMERS: Resource = {
  key: "customers",
  title: "Customers",
  singular: "customer",
  description: "Individuals and businesses across all divisions.",
  endpoint: "/api/customers",
  path: "/customers",
  privilege: "customers:edit",
  color: "#1D4675",
  // the backend's DELETE marks the customer INACTIVE (orders and payments keep pointing at it)
  remove: {
    method: "DELETE",
    removedStatus: "INACTIVE",
    note: "The customer is disabled, not permanently deleted. They are hidden from the customer list, but their enquiries, orders and payments stay. You can restore them at any time.",
  },
  restore: restoreActive,
  titleOf: (item) => [item.firstName, item.lastName].filter(Boolean).join(" "),
  sections: [
    {
      title: "Customer",
      fields: [
        { name: "type", label: "Type", type: "select", options: opts(["INDIVIDUAL", "BUSINESS"]), defaultValue: "INDIVIDUAL", required: true },
        { name: "companyName", label: "Company name", type: "text" },
        { name: "firstName", label: "First name", type: "text", required: true },
        { name: "lastName", label: "Last name", type: "text" },
      ],
    },
    {
      title: "Contact",
      fields: [
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "text" },
        { name: "country", label: "Country", type: "text" },
        { name: "address", label: "Address", type: "textarea", wide: true },
        { name: "notes", label: "Internal notes", type: "textarea", wide: true },
      ],
    },
  ],
};

export const SUPPLIERS: Resource = {
  key: "suppliers",
  title: "Suppliers",
  singular: "supplier",
  description: "Restricted supplier records for imports, vehicles and gems.",
  endpoint: "/api/suppliers",
  path: "/suppliers",
  privilege: "suppliers:edit",
  color: "#13345C",
  remove: disable("The supplier is disabled, not permanently deleted. It stays linked to past orders and products, and you can restore it at any time."),
  restore: restoreActive,
  titleOf: (item) => text(item.name),
  sections: [
    {
      title: "Supplier",
      fields: [
        { name: "name", label: "Name", type: "text", required: true, wide: true },
        { name: "contactName", label: "Contact person", type: "text" },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", type: "text" },
        { name: "country", label: "Country", type: "text" },
        { name: "address", label: "Address", type: "textarea", wide: true },
      ],
    },
    {
      title: "Business",
      fields: [
        { name: "divisions", label: "Divisions", type: "multi", options: DIVISION_OPTIONS, wide: true, required: true },
        { name: "productsSupplied", label: "Products supplied", type: "lines", help: "One per line." },
        { name: "paymentTerms", label: "Payment terms", type: "textarea" },
        { name: "notes", label: "Notes", type: "textarea", wide: true },
        { name: "status", label: "Status", type: "select", options: opts(["ACTIVE", "INACTIVE"]), defaultValue: "ACTIVE", required: true },
      ],
    },
  ],
};

export const RESOURCES: Resource[] = [...CATALOGUE, USERS, CUSTOMERS, SUPPLIERS];

export function findResource(key: string) {
  return RESOURCES.find((resource) => resource.key == key);
}
