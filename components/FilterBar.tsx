import Link from "next/link";
import { humanize } from "@/lib/format";

export interface SelectFilter {
  name: string;
  label: string;
  options: readonly string[];
  labels?: Record<string, string>; // option text instead of humanize(value)
  allLabel?: string; // text of the empty option (default "All")
}

// A plain GET form: submitting it changes the URL, the page reloads its
// data from the API. Page number is left out so results start at page 1.
export default function FilterBar({
  basePath,
  searchParams,
  searchPlaceholder,
  selects = [],
}: {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  searchPlaceholder?: string;
  selects?: SelectFilter[];
}) {
  const current = (name: string) =>
    typeof searchParams[name] == "string" ? (searchParams[name] as string) : "";

  return (
    <form action={basePath} className="card rise mb-6 flex flex-wrap items-end gap-3 p-4">
      {searchPlaceholder && (
        <div className="min-w-56 flex-1">
          <label htmlFor="search" className="label">
            Search
          </label>
          <input
            id="search"
            name="search"
            type="search"
            defaultValue={current("search")}
            placeholder={searchPlaceholder}
            className="input"
          />
        </div>
      )}
      {selects.map((select) => (
        <div key={select.name} className="min-w-40">
          <label htmlFor={select.name} className="label">
            {select.label}
          </label>
          <select
            id={select.name}
            name={select.name}
            defaultValue={current(select.name)}
            className="input"
          >
            <option value="">{select.allLabel ?? "All"}</option>
            {select.options.map((option) => (
              <option key={option} value={option}>
                {select.labels?.[option] ?? humanize(option)}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button type="submit" className="btn-navy">
        Apply
      </button>
      <Link href={basePath} className="btn-outline">
        Clear
      </Link>
    </form>
  );
}
