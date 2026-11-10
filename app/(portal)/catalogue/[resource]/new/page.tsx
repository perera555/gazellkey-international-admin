import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NoPermissionNotice from "@/components/NoPermissionNotice";
import PageHeader from "@/components/PageHeader";
import ResourceForm from "@/components/ResourceForm";
import { formOptions } from "@/lib/options";
import { findCatalogue } from "@/lib/resources";

export async function generateMetadata({ params }: PageProps<"/catalogue/[resource]/new">): Promise<Metadata> {
  const { resource } = await params;
  return { title: `Add ${findCatalogue(resource)?.singular ?? "item"}` };
}

export default async function NewCatalogueItemPage({ params }: PageProps<"/catalogue/[resource]/new">) {
  const { resource: key } = await params;
  const resource = findCatalogue(key);
  if (resource == undefined) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow={resource.title}
        title={`Add ${resource.singular}`}
        description={resource.addNote ?? "New items start as drafts. Publish them to show them on the website."}
        color={resource.color}
        back={{ href: resource.path, label: resource.title }}
      />
      <NoPermissionNotice privilege={resource.privilege} />
      <ResourceForm resourceKey={resource.key} options={await formOptions(resource)} />
    </>
  );
}
