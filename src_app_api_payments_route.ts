// DARAJA — API : Paiements (CinetPay / FedaPay — Mode Sandbox)
// POST /api/payments { planCode, provider: 'cinetpay' | 'fedapay' | 'wave' | 'orange_money' | 'virement' }
// En production : rediriger vers le provider, recevoir le webhook, activer la souscription.
// Ici : simulation complète du tunnel sandbox.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  const { planCode, provider } = await req.json();
  if (!planCode || !provider) {
    return NextResponse.json({ error: "planCode et provider requis." }, { status: 400 });
  }

  const plan = await db.plan.findUnique({ where: { code: planCode } });
  if (!plan) return NextResponse.json({ error: "Plan introuvable." }, { status: 404 });

  // Simule la création d'un paiement auprès du provider sandbox
  const sandboxTxId = `TX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const checkoutUrl =
    provider === "cinetpay"
      ? `https://checkout.cinetpay.com/sandbox/${sandboxTxId}`
      : provider === "fedapay"
      ? `https://sandbox.fedapay.com/s/${sandboxTxId}`
      : provider === "wave"
      ? `https://pay.wave.com/sandbox/${sandboxTxId}`
      : provider === "orange_money"
      ? `https://pay.orange-money.com/sandbox/${sandboxTxId}`
      : `virement://sandbox/${sandboxTxId}`;

  // En sandbox : on active immédiatement la souscription
  const existing = await db.subscription.findUnique({ where: { organizationId: orgId } });
  if (existing) {
    await db.subscription.update({
      where: { id: existing.id },
      data: {
        planId: plan.id,
        status: "active",
        paymentProvider: provider,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
    });
  } else {
    await db.subscription.create({
      data: {
        organizationId: orgId,
        planId: plan.id,
        status: "active",
        paymentProvider: provider,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
    });
  }

  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      action: "settings",
      targetType: "plan",
      targetId: plan.id,
      metadata: JSON.stringify({
        plan: plan.code,
        provider,
        amount: plan.priceMonthlyFcfa,
        sandboxTxId,
        mode: "sandbox",
      }),
      ipAddress: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
    },
  });

  return NextResponse.json({
    ok: true,
    sandbox: true,
    transactionId: sandboxTxId,
    provider,
    checkoutUrl,
    amount: plan.priceMonthlyFcfa,
    currency: "XOF",
    plan: { code: plan.code, name: plan.name },
    message: `Paiement sandbox ${provider} simulé. Plan « ${plan.name} » activé.`,
  });
}
