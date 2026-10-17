import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ResourceForm from "@/components/ResourceForm";
import StatusBadge from "@/components/StatusBadge";
import { apiGetOne } from "@/lib/api";
import { Item, Supplier } from "@/lib/types";

export const metadata: Metadata = { title: "Edit supplier" };

export default async function EditSupplierPage({ params }: PageProps<"/suppliers/[id]">) {
  const { id } = await params;
  const supplier = await apiGetOne<Supplier & Item>(`/api/suppliers/${encodeURIComponent(id)}`);

  return (
    <>
      <PageHeader
        eyebrow={`Supplier ${supplier.reference}`}
        title={supplier.name}
        back={{ href: "/suppliers", label: "Suppliers" }}
        actions={<StatusBadge value={supplier.status} />}
      />
      <ResourceForm resourceKey="suppliers" item={supplier} />
    </>
  );
}
