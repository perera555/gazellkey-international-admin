"use client";

import Link from "next/link";
import PhotoInput from "@/components/PhotoInput";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import CatalogueCard from "@/components/CatalogueCard";
import DeleteRestore from "@/components/DeleteRestore";
import ModelPicker from "@/components/ModelPicker";
import { apiRequest } from "@/lib/api-client";
import { ItineraryDay, Mode, Value, initialValue, slugify, splitLines, toPayload } from "@/lib/form-values";
import { Field, Option, findCatalogue, findResource, isRemoved } from "@/lib/resources";
import { Item } from "@/lib/types";

// Add / edit form for any resource in lib/resources.ts. Adding POSTs every
// filled field; editing PUTs only the fields that changed (the backend's
// update DTOs are strict, and unchanged fields such as role must stay out).
export default function ResourceForm({
  resourceKey,
  item,
  options = {},
  canRemove = true,
}: {
  resourceKey: string;
  item?: Item;
  options?: { suppliers?: Option[]; vehicleModels?: Option[] };
  canRemove?: boolean; // false e.g. on your own user account
}) {
  const found = findResource(resourceKey);
  if (found == undefined) {
    // the browser still runs an older copy of the portal (e.g. after an update)
    return <OutdatedPage />;
  }
  return <ResourceFormInner resourceKey={resourceKey} item={item} options={options} canRemove={canRemove} />;
}

function OutdatedPage() {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-display text-xl text-navy-900">This page has been updated</p>
      <p className="mt-1 text-sm text-slate-500">Please reload the page to load the latest version of the form.</p>
      <button type="button" onClick={() => window.location.reload()} className="btn-gold mt-6">
        Reload page
      </button>
    </div>
  );
}

function ResourceFormInner({
  resourceKey,
  item,
  options = {},
  canRemove = true,
}: {
  resourceKey: string;
  item?: Item;
  options?: { suppliers?: Option[]; vehicleModels?: Option[] };
  canRemove?: boolean;
}) {
  const resource = findResource(resourceKey)!;
  const catalogue = findCatalogue(resourceKey);
  const mode: Mode = item ? "edit" : "create";
  const router = useRouter();
  const fields = resource.sections.flatMap((section) => section.fields);

  const [initial] = useState(() => {
    const start: Record<string, Value> = Object.fromEntries(fields.map((field) => [field.name, initialValue(field, item)]));
    // a saved value that is not in its list (e.g. a custom category) opens as
    // "Other" with the value typed in the Other box
    for (const field of fields.filter((each) => each.otherFor)) {
      const { field: target, value: otherValue } = field.otherFor!;
      const list = fields.find((each) => each.name == target)?.options ?? [];
      const saved = String(start[target] ?? "");
      if (saved != "" && !list.some((option) => option.value == saved)) {
        start[field.name] = saved;
        start[target] = otherValue;
      }
    }
    return start;
  });
  const [values, setValues] = useState<Record<string, Value>>(initial);
  const [slugTouched, setSlugTouched] = useState(mode == "edit");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function isVisible(field: Field) {
    if (field.only && field.only != mode) {
      return false;
    }
    if (field.showIf == undefined) {
      return true;
    }
    const current = values[field.showIf.field];
    // tick-box lists ("multi"): shown when that option is ticked
    return Array.isArray(current) ? (current as unknown[]).includes(field.showIf.value) : current == field.showIf.value;
  }

  function setValue(name: string, value: Value) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      // while adding, keep the slug in step with the title
      const slugField = fields.find((field) => field.slugFrom == name);
      if (slugField && !slugTouched && typeof value == "string") {
        next[slugField.name] = slugify(value);
      }
      return next;
    });
    if (fields.some((field) => field.name == name && field.slugFrom)) {
      setSlugTouched(true);
    }
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    // pickers have no built-in "required" check
    const emptyPicker = fields
      .filter(isVisible)
      .find((field) => field.type == "models" && field.required && (values[field.name] as string[]).length == 0);
    if (emptyPicker) {
      setFieldErrors({ [emptyPicker.name]: "Choose at least one model." });
      setError(`${emptyPicker.label}: choose at least one model.`);
      return;
    }

    const body: Record<string, unknown> = mode == "create" ? { ...resource.fixed } : {};
    for (const field of fields.filter(isVisible)) {
      const payload = toPayload(field, values[field.name], mode);
      if (payload === undefined) {
        continue;
      }
      if (mode == "create" || JSON.stringify(payload) != JSON.stringify(toPayload(field, initial[field.name], mode))) {
        body[field.name] = payload;
      }
    }

    // "Other" boxes: the typed name is saved as the select's value
    for (const field of fields.filter((each) => each.otherFor)) {
      const { field: target, value: otherValue } = field.otherFor!;
      delete body[field.name]; // the box itself is not an API field
      const typed = String(values[field.name] ?? "").trim();
      const chosen = String(values[target] ?? "");
      if (chosen == otherValue && typed == "") {
        setFieldErrors({ [field.name]: "Please type the name." });
        setError(`${field.label}: please type the name.`);
        return;
      }
      const effective = chosen == otherValue ? typed : chosen;
      if (mode == "create" || effective != String(item?.[target] ?? "")) {
        body[target] = effective;
      } else {
        delete body[target];
      }
    }

    if (mode == "edit" && Object.keys(body).length == 0) {
      setError("Nothing has changed yet.");
      return;
    }

    setBusy(true);
    const result =
      mode == "create"
        ? await apiRequest("POST", resource.endpoint, body)
        : await apiRequest("PUT", `${resource.endpoint}/${item!.id}`, body);

    if (!result.ok) {
      const message = result.data.message ?? "Could not save. Please try again.";
      // Validation errors arrive as "field.path: message"
      const match = /^([\w.]+): (.+)$/.exec(message);
      const name = match?.[1].split(".")[0];
      if (match && name && fields.some((field) => field.name == name)) {
        setFieldErrors({ [name]: match[2] });
        setError(`${fields.find((field) => field.name == name)!.label}: ${match[2]}`);
      } else {
        setError(message);
      }
      setBusy(false);
      return;
    }

    const noun = resource.singular.charAt(0).toUpperCase() + resource.singular.slice(1);
    router.push(`${resource.path}?notice=${encodeURIComponent(`${noun} ${mode == "create" ? "added" : "saved"}.`)}`);
    router.refresh();
  }

  // Live preview of the website card while editing catalogue items
  const preview: Item | null = catalogue
    ? {
        id: "preview",
        ...values,
        images: splitLines(String(values.images ?? "")),
        fee: values.fee === "" ? null : values.fee,
      }
    : null;

  const removed = item != undefined && isRemoved(resource, item);

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-6">
        {resource.sections.map((section, index) => {
          const visible = section.fields.filter(isVisible);
          if (visible.length == 0) {
            return null;
          }
          return (
            <section
              key={section.title}
              className="card rise p-5 sm:p-6"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="mb-5 flex items-start gap-3">
                <span
                  className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold text-white shadow-[0_3px_0_rgb(0_0_0/0.2)]"
                  style={{ background: resource.color }}
                >
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-semibold text-navy-900">{section.title}</h2>
                  {section.description && <p className="text-sm text-slate-500">{section.description}</p>}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {visible.map((field) => (
                  <div key={field.name} className={field.wide || isWideType(field) ? "sm:col-span-2" : ""}>
                    <FieldInput
                      field={field}
                      value={values[field.name]}
                      onChange={(value) => setValue(field.name, value)}
                      options={field.optionsFrom ? options[field.optionsFrom] ?? [] : field.options ?? []}
                      error={fieldErrors[field.name]}
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <aside className="space-y-4 self-start xl:sticky xl:top-6">
        {catalogue && preview && (
          <div className="rise">
            <p className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Website preview</p>
            <CatalogueCard resource={catalogue} item={preview} preview />
          </div>
        )}

        <div className="card space-y-3 p-5">
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-gold w-full">
            {busy ? "Saving..." : mode == "create" ? `Add ${resource.singular}` : "Save changes"}
          </button>
          <Link href={resource.path} className="btn-outline w-full">
            Cancel
          </Link>
        </div>

        {item && canRemove && (
          <div className={`card p-5 ${removed ? "" : "border-red-100"}`}>
            <p className={`text-sm font-semibold ${removed ? "text-navy-900" : "text-red-800"}`}>
              {removed ? `This ${resource.singular} is deleted` : `Delete ${resource.singular}`}
            </p>
            <p className="mt-1 mb-3 text-sm text-slate-500">
              {removed ? resource.restore.note : resource.remove.note}
            </p>
            <DeleteRestore
              resourceKey={resource.key}
              id={item.id}
              title={resource.titleOf(item)}
              status={item.status}
              redirectTo={resource.path}
            />
          </div>
        )}
      </aside>
    </form>
  );
}

function isWideType(field: Field) {
  return field.type == "multi" || field.type == "models" || field.type == "itinerary" || field.type == "images";
}

function FieldInput({
  field,
  value,
  onChange,
  options,
  error,
}: {
  field: Field;
  value: Value;
  onChange: (value: Value) => void;
  options: Option[];
  error?: string;
}) {
  const id = `field-${field.name}`;
  const describedBy = error ? `${id}-error` : field.help ? `${id}-help` : undefined;
  const inputClass = `input ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`;
  const label = (
    <label htmlFor={id} className="label">
      {field.label}
      {field.required && <span className="text-gold-600"> *</span>}
    </label>
  );
  const footer = (
    <>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-700">{error}</p>
      ) : field.help ? (
        <p id={`${id}-help`} className="mt-1 text-xs text-slate-500">{field.help}</p>
      ) : null}
    </>
  );

  switch (field.type) {
    case "checkbox":
      return (
        <label className="flex h-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-navy-50/50 px-4 py-3 text-sm font-medium text-navy-900 transition hover:border-gold-500">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
            className="h-4 w-4 accent-gold-600"
          />
          {field.label}
        </label>
      );

    case "select":
      return (
        <div>
          {label}
          <select
            id={id}
            value={value as string}
            onChange={(event) => onChange(event.target.value)}
            required={field.required}
            aria-describedby={describedBy}
            className={inputClass}
          >
            {(!field.required || value == "") && <option value="">{field.nullable ? "None" : "Choose..."}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {footer}
        </div>
      );

    case "multi": {
      const selected = value as string[];
      const toggle = (option: string) =>
        onChange(selected.includes(option) ? selected.filter((v) => v != option) : [...selected, option]);
      return (
        <fieldset aria-describedby={describedBy}>
          <div className="mb-2 flex items-center justify-between">
            <legend className="label mb-0">
              {field.label}
              {field.required && <span className="text-gold-600"> *</span>}
            </legend>
            <span className="flex gap-2 text-xs">
              <button type="button" onClick={() => onChange(options.map((o) => o.value))} className="text-navy-700 hover:underline">
                All
              </button>
              <button type="button" onClick={() => onChange([])} className="text-navy-700 hover:underline">
                None
              </button>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const on = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(option.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    on
                      ? "border-gold-500 bg-gold-100 text-navy-950 shadow-[0_2px_0_var(--color-gold-500)]"
                      : "border-slate-200 bg-white text-slate-600 shadow-[0_2px_0_#e2e8f0] hover:border-slate-300"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {footer}
        </fieldset>
      );
    }

    case "models":
      return (
        <div>
          {label}
          <ModelPicker
            id={id}
            value={value as string[]}
            onChange={onChange}
            models={options.map((option) => option.value)}
            invalid={error != undefined && error != ""}
          />
          {footer}
        </div>
      );

    case "itinerary":
      return <ItineraryInput value={value as ItineraryDay[]} onChange={onChange} />;

    case "photo":
      return (
        <PhotoInput
          id={id}
          label={field.label}
          value={value as string}
          onChange={onChange}
          uploadTo={field.uploadTo ?? ""}
          help={error ?? field.help}
        />
      );

    case "textarea":
    case "lines":
    case "dates":
    case "json":
    case "images":
      return (
        <div>
          {label}
          <textarea
            id={id}
            value={value as string}
            onChange={(event) => onChange(event.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            rows={field.type == "textarea" ? 5 : 4}
            aria-describedby={describedBy}
            className={`${inputClass} ${field.type == "textarea" ? "" : "font-mono text-xs"}`}
          />
          {footer}
          {field.type == "images" && <ImagePreviews urls={splitLines(value as string)} />}
        </div>
      );

    default: {
      const type = { email: "email", password: "password", number: "number", datetime: "datetime-local" }[
        field.type as string
      ];
      return (
        <div>
          {label}
          <input
            id={id}
            type={type ?? "text"}
            value={value as string}
            onChange={(event) => onChange(event.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            step={field.type == "number" ? (field.integer ? 1 : "any") : undefined}
            min={field.type == "number" ? 0 : undefined}
            minLength={field.type == "password" ? 8 : undefined}
            maxLength={field.type == "currency" ? 3 : undefined}
            autoComplete={field.type == "password" ? "new-password" : "off"}
            aria-describedby={describedBy}
            className={`${inputClass} ${field.uppercase || field.type == "currency" ? "uppercase" : ""}`}
          />
          {footer}
        </div>
      );
    }
  }
}

function ImagePreviews({ urls }: { urls: string[] }) {
  if (urls.length == 0) {
    return null;
  }
  return (
    <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
      {urls.map((url, index) => (
        <div
          key={`${url}-${index}`}
          className="relative aspect-square overflow-hidden rounded-xl bg-navy-100 shadow-[0_3px_0_#dbe3ee]"
        >
          {/* Catalogue photos can live on any host, so a plain <img> */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-full w-full object-cover" />
          {index == 0 && (
            <span className="badge absolute top-1.5 left-1.5 bg-gold-500 text-navy-950">Cover</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ItineraryInput({ value, onChange }: { value: ItineraryDay[]; onChange: (value: Value) => void }) {
  function update(index: number, change: Partial<ItineraryDay>) {
    onChange(value.map((day, i) => (i == index ? { ...day, ...change } : day)));
  }
  function move(index: number, by: number) {
    const next = [...value];
    const [day] = next.splice(index, 1);
    next.splice(index + by, 0, day);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {value.length == 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
          No days yet.
        </p>
      )}
      {value.map((day, index) => (
        <div key={index} className="flex gap-3 rounded-xl border border-slate-200 bg-navy-50/50 p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-900 text-xs font-bold text-gold-400 shadow-[0_3px_0_var(--color-navy-950)]">
            D{index + 1}
          </span>
          <div className="flex-1 space-y-2">
            <input
              aria-label={`Day ${index + 1} title`}
              value={day.title}
              onChange={(event) => update(index, { title: event.target.value })}
              placeholder="Arrive in Colombo"
              className="input"
            />
            <textarea
              aria-label={`Day ${index + 1} description`}
              value={day.description}
              onChange={(event) => update(index, { description: event.target.value })}
              placeholder="What happens on this day"
              rows={2}
              className="input"
            />
          </div>
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => move(index, -1)} disabled={index == 0} className="btn-outline btn-sm" aria-label="Move up">
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index == value.length - 1}
              className="btn-outline btn-sm"
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i != index))}
              className="btn-danger btn-sm"
              aria-label={`Remove day ${index + 1}`}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { title: "", description: "" }])} className="btn-outline">
        + Add day
      </button>
    </div>
  );
}
