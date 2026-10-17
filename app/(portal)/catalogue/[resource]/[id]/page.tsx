import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ResourceForm from "@/components/ResourceForm";
import StatusBadge from "@/components/StatusBadge";
import { apiGetOne } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { formOptions } from "@/lib/options";
import { findCatalogue } from "@/lib/resources";
import { Item } from "@/lib/types";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditCatalogueItemPage({ params }: PageProps<"/catalogue/[resource]/[id]">) {
  const { resource: key, id } = await params;
  const resource = findCatalogue(key);
  if (resource == undefined) {
    notFound();
  }

  // Next.js 16.3 (Turbopack) sometimes sends /catalogue/x/new here instead of
  // to new/page.tsx. Show the "Add" form for it rather than a 404.
  if (id == "new") {
    return (
      <>
        <PageHeader
          eyebrow={resource.title}
          title={`Add ${resource.singular}`}
          description="New items start as drafts. Publish them to show them on the website."
          color={resource.color}
          back={{ href: resource.path, label: resource.title }}
        />
        <ResourceForm resourceKey={resource.key} options={await formOptions(resource)} />
      </>
    );
  }

  const [item, options] = await Promise.all([
    apiGetOne<Item>(`${resource.endpoint}/${encodeURIComponent(id)}`),
    formOptions(resource),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={`Edit ${resource.singular}`}
        title={resource.titleOf(item)}
        description={item.updatedAt ? `Last updated ${formatDateTime(item.updatedAt as string)}` : undefined}
        color={resource.color}
        back={{ href: resource.path, label: resource.title }}
        actions={typeof item.status == "string" ? <StatusBadge value={item.status} /> : undefined}
      />
      <ResourceForm resourceKey={resource.key} item={item} options={options} />
    </>
  );
}
