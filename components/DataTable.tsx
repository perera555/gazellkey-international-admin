import { ReactNode } from "react";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export default function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty = "Nothing found.",
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
}) {
  if (rows.length == 0) {
    return <p className="card rise px-6 py-12 text-center text-sm text-slate-500">{empty}</p>;
  }

  return (
    <div className="card rise overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50/90">
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                className={`px-4 py-3.5 text-left text-[0.7rem] font-semibold tracking-[0.08em] text-slate-500 uppercase ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="transition hover:bg-gold-100/30">
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={`px-4 py-3 align-top text-slate-700 ${column.className ?? ""}`}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
