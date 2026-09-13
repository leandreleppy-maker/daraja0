// DARAJA — API : Revenus agrégés plateforme (PROPRIÉTAIRE UNIQUEMENT)
// GET /api/admin/revenue
//
// ⚠️ ACCÈS VERROUILLÉ PAR CODE SECRET (header x-daraja-admin-code)
//
// 🔒 CONFIDENTIALITÉ : Aucun nom d'organisation n'est exposé.
// Seules des statistiques agrégées par plan et par fournisseur sont renvoyées.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminCode, ADMIN_SECRET_HEADER } from "@/lib/admin-secret";

export async function GET(req: NextRequest) {
  const code = req.headers.get(ADMIN_SECRET_HEADER);
  if (!verifyAdminCode(code)) {
    return NextResponse.json(
      { error: "Accès refusé. Code secret propriétaire requis." },
      { status: 403 },
    );
  }

  const subs = await db.subscription.findMany({
    include: {
      plan: true,
    },
  });

  const active = subs.filter((s) => s.status === "active");
  const mrr = active.reduce((sum, s) => sum + (s.plan.priceMonthlyFcfa ?? 0), 0);
  const arr = mrr * 12;

  // Par plan (agrégat — aucun nom)
  const byPlan: Record<string, { count: number; mrr: number }> = {};
  for (const s of active) {
    const code = s.plan.code;
    if (!byPlan[code]) byPlan[code] = { count: 0, mrr: 0 };
    byPlan[code].count += 1;
    byPlan[code].mrr += s.plan.priceMonthlyFcfa ?? 0;
  }

  // Par fournisseur de paiement (agrégat)
  const byProvider: Record<string, number> = {};
  for (const s of active) {
    const p = s.paymentProvider ?? "virement";
    byProvider[p] = (byProvider[p] ?? 0) + 1;
  }

  const churned = subs.filter((s) => s.status === "canceled").length;
  const churnRate = subs.length > 0 ? Math.round((churned / subs.length) * 100) : 0;

  return NextResponse.json({
    mrr,
    arr,
    activeSubscriptions: active.length,
    churnedSubscriptions: churned,
    churnRate,
    byPlan: Object.entries(byPlan).map(([code, v]) => ({ code, ...v })),
    byProvider: Object.entries(byProvider).map(([provider, count]) => ({ provider, count })),
    // ⚠️ AUCUN topContributors[] nominatif — confidentialité préservée
  });
}
