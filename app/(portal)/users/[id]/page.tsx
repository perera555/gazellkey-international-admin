import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ResourceForm from "@/components/ResourceForm";
import StatusBadge from "@/components/StatusBadge";
import { apiGetOne } from "@/lib/api";
import { formatDateTime, humanize } from "@/lib/format";
import { getSessionUser } from "@/lib/session";
import { Item, User } from "@/lib/types";

export const metadata: Metadata = { title: "Edit user" };

export default async function EditUserPage({ params }: PageProps<"/users/[id]">) {
  const { id } = await params;
  const [user, me] = await Promise.all([
    apiGetOne<User & Item>(`/api/users/${encodeURIComponent(id)}`),
    getSessionUser(),
  ]);
  const isMe = me?.id == user.id;

  return (
    <>
      <PageHeader
        eyebrow={`${humanize(user.role)} account`}
        title={`${user.firstName} ${user.lastName}`}
        description={`${user.email} · last sign in ${formatDateTime(user.lastLogin) || "never"}`}
        back={{ href: "/users", label: "Users" }}
        actions={<StatusBadge value={user.status} />}
      />
      {isMe && (
        <p className="card mb-6 border-gold-400/50 bg-gold-100 px-5 py-3 text-sm text-navy-900">
          This is your own account. You can change your name and phone here; another admin must change your role,
          status, email or privileges.
        </p>
      )}
      <ResourceForm resourceKey="users" item={user} canRemove={!isMe} />
    </>
  );
}
