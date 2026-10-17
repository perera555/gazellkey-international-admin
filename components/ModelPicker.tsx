"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import { splitModel } from "@/lib/vehicle-models";

// "Fits these models" picker for spare parts: models grouped by make, a
// search box, the chosen models as removable tags, and a box to add a model
// that is not listed. Value: ["Toyota Aqua", "Toyota Prius", ...]
export default function ModelPicker({
  id,
  value,
  onChange,
  models,
  invalid = false,
}: {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  models: string[]; // "Make Model"
  invalid?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(() => (value[0] ? splitModel(value[0]).make : null));
  const [custom, setCustom] = useState("");

  const chosen = new Set(value.map((each) => each.toLowerCase()));
  const has = (model: string) => chosen.has(model.toLowerCase());
  const toggle = (model: string) =>
    onChange(has(model) ? value.filter((each) => each.toLowerCase() != model.toLowerCase()) : [...value, model]);

  // make -> models, including chosen models that are not in the list
  const groups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const model of [...models, ...value]) {
      const { make } = splitModel(model);
      const list = map.get(make) ?? [];
      if (!list.some((each) => each.toLowerCase() == model.toLowerCase())) list.push(model);
      map.set(make, list);
    }
    return [...map.entries()];
  }, [models, value]);

  const term = search.trim().toLowerCase();
  const visible = term
    ? groups
        .map(([make, list]) => [make, list.filter((model) => model.toLowerCase().includes(term))] as const)
        .filter(([, list]) => list.length > 0)
    : groups;

  function addCustom() {
    const text = custom.trim().replace(/\s+/g, " ");
    if (!text.includes(" ")) {
      return; // needs "Make Model"
    }
    if (!has(text)) onChange([...value, text]);
    setCustom("");
    setOpen(splitModel(text).make);
  }

  function onCustomKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key == "Enter") {
      event.preventDefault(); // do not submit the whole form
      addCustom();
    }
  }

  return (
    <div className={`rounded-2xl border bg-white ${invalid ? "border-red-400" : "border-slate-200"}`}>
      {/* chosen models */}
      <div className="border-b border-slate-100 p-3">
        {value.length == 0 ? (
          <p className="text-sm text-slate-500">No models chosen yet - tick the models this part fits below.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-semibold text-slate-500">{value.length} chosen:</span>
            {value.map((model) => (
              <button
                key={model}
                type="button"
                onClick={() => toggle(model)}
                className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-1 text-xs font-semibold text-navy-950 hover:bg-red-50 hover:text-red-700"
                title="Remove"
              >
                {model}
                <span aria-hidden="true">×</span>
                <span className="sr-only">remove</span>
              </button>
            ))}
            <button type="button" onClick={() => onChange([])} className="ml-auto text-xs text-slate-500 hover:text-red-700 hover:underline">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* search */}
      <div className="p-3 pb-0">
        <input
          id={id}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search models, e.g. Aqua or Vezel"
          className="input"
        />
      </div>

      {/* makes and their models */}
      <div className="max-h-80 overflow-y-auto p-3">
        {visible.length == 0 ? (
          <p className="px-1 py-3 text-sm text-slate-500">No model matches &quot;{search}&quot;. Add it below.</p>
        ) : (
          <ul className="space-y-1.5">
            {visible.map(([make, list]) => {
              const count = list.filter(has).length;
              const expanded = term != "" || open == make;
              return (
                <li key={make} className="rounded-xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setOpen(open == make ? null : make)}
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-navy-900 hover:bg-slate-50"
                  >
                    <span>
                      {make}
                      <span className="ml-2 text-xs font-normal text-slate-500">{list.length} models</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {count > 0 ? <span className="rounded-full bg-gold-500 px-2 text-xs text-navy-950">{count}</span> : null}
                      <span aria-hidden="true" className={`text-slate-400 transition ${expanded ? "rotate-90" : ""}`}>›</span>
                    </span>
                  </button>
                  {expanded ? (
                    <div className="flex flex-wrap gap-1.5 px-3 pt-1 pb-3">
                      {list.map((model) => {
                        const on = has(model);
                        return (
                          <label
                            key={model}
                            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                              on ? "border-gold-500 bg-gold-100 text-navy-950" : "border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            <input type="checkbox" checked={on} onChange={() => toggle(model)} className="accent-[#c9a227]" />
                            {splitModel(model).model}
                          </label>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          const all = list.every(has);
                          onChange(all ? value.filter((each) => !list.some((m) => m.toLowerCase() == each.toLowerCase())) : [...value, ...list.filter((m) => !has(m))]);
                        }}
                        className="px-2 text-xs font-medium text-navy-700 hover:underline"
                      >
                        {list.every(has) ? "Untick all" : `All ${make}`}
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* model not in the list */}
      <div className="flex gap-2 border-t border-slate-100 p-3">
        <input
          type="text"
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={onCustomKey}
          placeholder="Not listed? Type Make Model, e.g. Toyota Roomy"
          aria-label="Add a model that is not listed"
          className="input"
        />
        <button type="button" onClick={addCustom} disabled={!custom.trim().includes(" ")} className="btn-outline shrink-0">
          Add
        </button>
      </div>
    </div>
  );
}
