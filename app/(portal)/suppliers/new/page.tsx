import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ResourceForm from "@/components/ResourceForm";

export const metadata: Metadata = { title: "Add supplier" };

export default function NewSupplierPage() {
  return (
    <>
      <PageHeader
        eyebrow="Suppliers"
        title="Add supplier"
        description="Supplier details and costs are never shown to customers."
        back={{ href: "/suppliers", label: "Suppliers" }}
      />
      <ResourceForm resourceKey="suppliers" />
    </>
  );
}
