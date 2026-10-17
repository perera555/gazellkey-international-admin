import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Division, SessionUser } from "@/lib/types";

export const STAFF_ROLES = ["STAFF", "FINANCE", "ADMIN"];

// Signed-in user, read once per request from GET /api/auth/me
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const { ok, body } = await apiFetch("/api/auth/me");
  return ok ? body.user : null;
});

// Pages and layouts of the portal call this. Customers and suppliers
// are sent back to the login page - this portal is for staff only.
export async function requireStaff(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user == null) {
    redirect("/login");
  }
  if (!STAFF_ROLES.includes(user.role)) {
    redirect("/login?error=not-staff");
  }
  return user;
}

// Mirrors hasPrivilege() in the backend: administrators have everything
export function hasPrivilege(user: SessionUser, privilege?: string) {
  if (privilege == undefined || user.role == "ADMIN") {
    return true;
  }
  return user.privileges.includes(privilege);
}

// Mirrors canAccessDivision() in the backend: admins and finance see all
export function canAccessDivision(user: SessionUser, division?: Division) {
  if (division == undefined || user.role == "ADMIN" || user.role == "FINANCE") {
    return true;
  }
  return user.divisions.includes(division);
}
