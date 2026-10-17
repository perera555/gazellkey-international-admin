import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ResourceForm from "@/components/ResourceForm";

export const metadata: Metadata = { title: "Add customer" };

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="Add customer"
        description="For walk-ins and phone enquiries. Website sign-ups are added automatically."
        back={{ href: "/customers", label: "Customers" }}
      />
      <ResourceForm resourceKey="customers" />
    </>
  );
}
