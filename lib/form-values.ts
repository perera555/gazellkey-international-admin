import { Field } from "@/lib/resources";
import { Item } from "@/lib/types";

// Converts between API records and the strings / booleans a form edits.
// The form keeps a Value per field; toPayload() turns it into the JSON the
// backend DTO expects (undefined = leave the field out of the request).

export type ItineraryDay = { title: string; description: string };
export type Value = string | boolean | string[] | ItineraryDay[];
export type Mode = "create" | "edit";

export function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line != "");
}

// "2026-10-12T08:30:00.000Z" -> "2026-10-12T14:00" in the browser's time zone
function toLocalInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function initialValue(field: Field, item?: Item): Value {
  if (item == undefined) {
    if (field.defaultValue != undefined) {
      return field.defaultValue;
    }
    if (field.type == "checkbox") {
      return false;
    }
    return field.type == "multi" || field.type == "models" || field.type == "itinerary" ? [] : "";
  }

  const raw = item[field.name];
  switch (field.type) {
    case "checkbox":
      return Boolean(raw);
    case "multi":
    case "models":
      return Array.isArray(raw) ? raw.map(String) : [];
    case "itinerary":
      return Array.isArray(raw)
        ? raw.map((day) => ({ title: String(day?.title ?? ""), description: String(day?.description ?? "") }))
        : [];
    case "lines":
    case "images":
      return Array.isArray(raw) ? raw.join("\n") : "";
    case "dates":
      return Array.isArray(raw) ? raw.map((date) => String(date).slice(0, 10)).join("\n") : "";
    case "datetime":
      return raw ? toLocalInput(String(raw)) : "";
    case "json":
      return raw && typeof raw == "object"
        ? Object.entries(raw)
            .map(([key, value]) => `${key}: ${typeof value == "object" ? JSON.stringify(value) : value}`)
            .join("\n")
        : "";
    case "number":
      return raw == null ? "" : String(Number(raw)); // decimals arrive as "12.50"
    case "password":
      return "";
    default:
      return raw == null ? "" : String(raw);
  }
}

function parseJsonLines(value: string) {
  const result: Record<string, string | number> = {};
  for (const line of splitLines(value)) {
    const colon = line.indexOf(":");
    const key = (colon == -1 ? line : line.slice(0, colon)).trim();
    const text = colon == -1 ? "" : line.slice(colon + 1).trim();
    if (key != "") {
      result[key] = text != "" && !Number.isNaN(Number(text)) ? Number(text) : text;
    }
  }
  return result;
}

export function toPayload(field: Field, value: Value, mode: Mode): unknown {
  switch (field.type) {
    case "checkbox":
      return Boolean(value);
    case "multi": {
      const list = value as string[];
      // empty on create -> backend default (e.g. the role's privileges)
      return mode == "create" && list.length == 0 ? undefined : list;
    }
    case "models":
      return value as string[];
    case "itinerary":
      return (value as ItineraryDay[])
        .filter((day) => day.title.trim() != "")
        .map((day, index) => ({ day: index + 1, title: day.title.trim(), description: day.description.trim() }));
    case "lines":
    case "images":
    case "dates":
      return splitLines(value as string);
    case "json": {
      const object = parseJsonLines(value as string);
      return mode == "create" && Object.keys(object).length == 0 ? undefined : object;
    }
  }

  const text = (value as string).trim();
  switch (field.type) {
    case "number":
      return text == "" ? (field.nullable ? null : undefined) : Number(text);
    case "datetime":
      return text == "" ? undefined : new Date(text).toISOString();
    case "currency":
      return text == "" ? undefined : text.toUpperCase();
    case "email":
    case "password":
      return text == "" ? undefined : text;
    case "select":
      return text == "" ? (field.nullable ? null : undefined) : text;
    default:
      if (text == "") {
        return mode == "create" ? undefined : ""; // "" clears the field on edit
      }
      return field.uppercase ? text.toUpperCase() : text;
  }
}

// "Sapphire Ring 2ct" -> "sapphire-ring-2ct"
export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
