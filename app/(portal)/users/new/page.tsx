import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ResourceForm from "@/components/ResourceForm";

export const metadata: Metadata = { title: "Add user" };

export default function NewUserPage() {
  return (
    <>
      <PageHeader
        eyebrow="Users"
        title="Add user"
        description="Create a staff, finance, admin or supplier account. Customers usually register on the website."
        back={{ href: "/users", label: "Users" }}
      />
      <ResourceForm resourceKey="users" />
    </>
  );
}
