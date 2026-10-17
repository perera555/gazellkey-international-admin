import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CatalogueCard from "@/components/CatalogueCard";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import DeleteRestore from "@/components/DeleteRestore";
import FilterBar from "@/components/FilterBar";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { apiGet, toQuery } from "@/lib/api";
import { findCatalogue } from "@/lib/resources";
import { Item } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/catalogue/[resource]">): Promise<Metadata> {
  const { resource } = await params;
  return { title: findCatalogue(resource)?.title ?? "Catalogue" };
}

// One page for every catalogue (tours, events, gems, vehicles, imports, exports):
// the listings as website cards, with add, edit, archive and restore.
export default async function CataloguePage({ params, searchParams }: PageProps<"/catalogue/[resource]">) {
  const { resource: key } = await params;
  const resource = findCatalogue(key);
  if (resource == undefined) {
    notFound();
  }

  const query = await searchParams;
  const filterNames = resource.filters.map((filter) => filter.name);
  const result = await apiGet<Item[]>(
    `${resource.endpoint}${toQuery(query, ["search", ...filterNames, "pageNumber"], { pageSize: resource.table ? "25" : "12", ...resource.listQuery })}`,
  );

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title={resource.title}
        description={resource.description}
        color={resource.color}
        actions={
          <Link href={`${resource.path}/new`} className="btn-gold">
            + Add {resource.singular}
          </Link>
        }
      />
      <FilterBar
        basePath={resource.path}
        searchParams={query}
        searchPlaceholder={resource.searchPlaceholder ?? "Name, SKU, destination..."}
        selects={resource.filters}
      />
      {result.ok ? (
        result.data.length == 0 ? (
          <div className="card rise px-6 py-14 text-center">
            <p className="font-display text-xl text-navy-900">Nothing here yet</p>
            <p className="mt-1 text-sm text-slate-500">No {resource.title.toLowerCase()} match these filters.</p>
            <Link href={`${resource.path}/new`} className="btn-gold mt-6">
              + Add {resource.singular}
            </Link>
          </div>
        ) : resource.table ? (
          // table view (e.g. spare parts: name, SKU, part number ...)
          <>
            <DataTable
              rows={result.data}
              columns={[
                ...resource.table.map((column) => ({
                  header: column.header,
                  className: column.style == "right" ? "text-right whitespace-nowrap" : column.style == "mono" ? "whitespace-nowrap" : "",
                  cell: (item: Item) => {
                    const value = column.value(item);
                    return column.style == "title" ? (
                      <Link href={`${resource.path}/${item.id}`} className="font-semibold text-navy-900 hover:text-gold-600 hover:underline">
                        {value}
                      </Link>
                    ) : column.style == "mono" ? (
                      <span className="font-mono text-xs text-navy-800">{value}</span>
                    ) : column.style == "muted" ? (
                      <span className="block max-w-64 text-xs text-slate-600">{value}</span>
                    ) : (
                      value
                    );
                  },
                })),
                {
                  header: "Status",
                  cell: (item: Item) => (typeof item.status == "string" ? <StatusBadge value={item.status} /> : null),
                },
                {
                  header: "",
                  className: "text-right",
                  cell: (item: Item) => (
                    <div className="flex justify-end gap-2">
                      <Link href={`${resource.path}/${item.id}`} className="btn-navy btn-sm">Edit</Link>
                      <DeleteRestore small resourceKey={resource.key} id={item.id} title={resource.titleOf(item)} status={item.status} />
                    </div>
                  ),
                },
              ]}
            />
            <Pagination pagination={result.pagination} basePath={resource.path} searchParams={query} />
          </>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {result.data.map((item, index) => (
                <div key={item.id} className="rise" style={{ animationDelay: `${index * 40}ms` }}>
                  <CatalogueCard
                    resource={resource}
                    item={item}
                    actions={
                      <>
                        <Link href={`${resource.path}/${item.id}`} className="btn-navy btn-sm flex-1">
                          Edit
                        </Link>
                        <DeleteRestore
                          small
                          resourceKey={resource.key}
                          id={item.id}
                          title={resource.titleOf(item)}
                          status={item.status}
                        />
                      </>
                    }
                  />
                </div>
              ))}
            </div>
            <Pagination pagination={result.pagination} basePath={resource.path} searchParams={query} />
          </>
        )
      ) : (
        <ErrorNotice message={result.message} />
      )}
    </>
  );
}
