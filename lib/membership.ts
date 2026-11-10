// Membership cards and points (backend: /api/memberships, lib/membership.ts)

export type MembershipTier = "BLUE" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface Membership {
  id: string;
  cardNumber: string;
  tier: MembershipTier;
  pointsBalance: number;
  lifetimePoints: number;
  status: string;
  joinedAt: string;
  customer: {
    id: string;
    reference: string;
    firstName: string;
    lastName: string | null;
    companyName: string | null;
    email: string;
    phone: string | null;
  };
}

export interface PointsTransaction {
  id: string;
  points: number;
  reason: "PURCHASE" | "REFUND" | "REDEMPTION" | "ADJUSTMENT";
  note: string | null;
  createdAt: string;
}

export interface MembershipDetail extends Membership {
  transactions: PointsTransaction[];
  next: { tier: MembershipTier; pointsNeeded: number } | null;
}

// Card names, lowest first (points earned in total: 0, 250, 1,000, 2,500, 5,000)
export const TIERS: MembershipTier[] = ["BLUE", "BRONZE", "SILVER", "GOLD", "PLATINUM"];

export const CARD_NAMES: Record<MembershipTier, string> = {
  BLUE: "Blue Card",
  BRONZE: "Bronze Card",
  SILVER: "Silver Card",
  GOLD: "Gold Card",
  PLATINUM: "Platinum Card",
};

export const TIER_BADGE: Record<MembershipTier, string> = {
  BLUE: "bg-sky-100 text-sky-800",
  BRONZE: "bg-orange-100 text-orange-900",
  SILVER: "bg-slate-200 text-slate-700",
  GOLD: "bg-amber-100 text-amber-800",
  PLATINUM: "bg-zinc-800 text-white",
};

export const REASON_LABELS: Record<PointsTransaction["reason"], string> = {
  PURCHASE: "Earned - payment",
  REFUND: "Taken back - refund",
  REDEMPTION: "Redeemed",
  ADJUSTMENT: "Adjusted by staff",
};
