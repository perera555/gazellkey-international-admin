"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import PasswordInput from "@/components/PasswordInput";
import { apiRequest } from "@/lib/api-client";
import { Role } from "@/lib/types";

const STAFF_ROLES: Role[] = ["STAFF", "FINANCE", "ADMIN"];

// Only follow same-site paths after login ("/x", never "//evil.com")
function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function LoginForm({
  next,
  initialError,
}: {
  next: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState(initialError ?? "");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    const form = new FormData(event.currentTarget);
    const result = await apiRequest<{ user?: { role: Role } }>(
      "POST",
      "/api/auth/login",
      { email: form.get("email"), password: form.get("password"), remember: form.get("remember") == "on" },
    );

    if (!result.ok) {
      setError(result.data.message ?? "Sign in failed.");
      setBusy(false);
      return;
    }

    // Customers and suppliers have valid accounts but no business here
    if (!result.data.user || !STAFF_ROLES.includes(result.data.user.role)) {
      await apiRequest("POST", "/api/auth/logout");
      setError("This portal is for staff accounts only.");
      setBusy(false);
      return;
    }

    router.replace(safeNext(next));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-white/90">
          Email
        </label>
        {/* "username" tells browsers this is the login name to save with the password */}
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="input"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-white/90">
          Password
        </label>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-white/85">
        <input id="remember" name="remember" type="checkbox" className="h-4 w-4 accent-amber-400" />
        Remember me for 30 days
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-gold w-full">
        {busy ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
