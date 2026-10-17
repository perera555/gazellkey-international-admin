import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ResourceForm from "@/components/ResourceForm";
import { apiGetOne } from "@/lib/api";
import { customerName, formatDate } from "@/lib/format";
import { Customer, Item } from "@/lib/types";

export const metadata: Metadata = { title: "Edit customer" };

export default async function EditCustomerPage({ params }: PageProps<"/customers/[id]">) {
  const { id } = await params;
  const customer = await apiGetOne<Customer & Item>(`/api/customers/${encodeURIComponent(id)}`);

  return (
    <>
      <PageHeader
        eyebrow={`Customer ${customer.reference}`}
        title={customerName(customer)}
        description={`${customer.email} · customer since ${formatDate(customer.createdAt)}`}
        back={{ href: "/customers", label: "Customers" }}
        actions={
          customer.status == "INACTIVE" ? (
            <span className="badge bg-red-100 text-red-800">Deleted</span>
          ) : undefined
        }
      />
      <ResourceForm resourceKey="customers" item={customer} />
    </>
  );
}
