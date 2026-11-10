import { humanize } from "@/lib/format";
import { getSessionUser, hasPrivilege } from "@/lib/session";

// Shown above a form the signed-in account may open but not save
// (e.g. staff without "content:edit" on Directors, managers & team)
export default async function NoPermissionNotice({ privilege }: { privilege: string }) {
  const user = await getSessionUser();
  if (user == null || hasPrivilege(user, privilege)) {
    return null;
  }
  return (
    <p role="alert" className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
      You are signed in as <strong>{user.email}</strong> ({humanize(user.role)}), which cannot save here - it needs the{" "}
      <strong>{privilege}</strong> permission. Sign out and sign in with an administrator account, or ask an administrator
      to add this permission to your account under Administration &gt; Users.
    </p>
  );
}
