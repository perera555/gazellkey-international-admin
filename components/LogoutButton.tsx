"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "@/lib/api-client";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await apiRequest("POST", "/api/auth/logout");
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={logout} disabled={busy} className="btn-outline">
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}
