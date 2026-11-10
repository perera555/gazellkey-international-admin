"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api-client";

// Redeem a member's points (reward / discount) or add / remove them (gift, correction)
export default function PointsForm({ membershipId, balance }: { membershipId: string; balance: number }) {
  const router = useRouter();
  const [reason, setReason] = useState<"REDEMPTION" | "ADJUSTMENT">("REDEMPTION");
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const value = Number(points);
    if (!Number.isInteger(value) || value == 0) {
      setError("Enter a whole number of points.");
      return;
    }
    if (reason == "REDEMPTION" && Math.abs(value) > balance) {
      setError(`Only ${balance} points are available.`);
      return;
    }
    setBusy(true);
    const result = await apiRequest("POST", `/api/memberships/${membershipId}/points`, { points: value, reason, note });
    setBusy(false);
    if (!result.ok) {
      setError(result.data.message ?? "Something went wrong.");
      return;
    }
    toast.success(reason == "REDEMPTION" ? "Points redeemed." : "Points updated.");
    setPoints("");
    setNote("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <h2 className="heading-display text-lg">Redeem or add points</h2>
      <div className="flex gap-2">
        {(["REDEMPTION", "ADJUSTMENT"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setReason(option)}
            className={reason == option ? "btn-gold btn-sm" : "btn-outline btn-sm"}
          >
            {option == "REDEMPTION" ? "Redeem" : "Add / correct"}
          </button>
        ))}
      </div>
      <label className="block text-sm">
        <span className="font-medium text-navy-900">Points</span>
        <input
          type="number"
          step={1}
          value={points}
          onChange={(event) => setPoints(event.target.value)}
          className="input mt-1 w-full"
          placeholder={reason == "REDEMPTION" ? "e.g. 500" : "e.g. 100 (or -50 to remove)"}
          required
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-navy-900">What for?</span>
        <input
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="input mt-1 w-full"
          placeholder={reason == "REDEMPTION" ? "e.g. LKR 5,000 discount on tour TRV-ORD-2026-00012" : "e.g. Welcome gift"}
          required
          minLength={2}
          maxLength={300}
        />
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-gold w-full">
        {busy ? "Saving..." : reason == "REDEMPTION" ? "Redeem points" : "Save points"}
      </button>
    </form>
  );
}
