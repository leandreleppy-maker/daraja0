// DARAJA — API : Liste des organisations (super-admin)
// GET /api/admin/organizations
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!user.superAdmin) return NextResponse.json({ error: "Accès réservé au super-administrateur" }, { status: 403 });

  const orgs = await db.organization.findMany({
    include: {
      subscription: { include: { plan: true } },
      _count: { select: { documents: true, members: true, folders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    organizations: orgs.map((o) => ({
      id: o.id,
      name: o.name,
      type: o.type,
      country: o.country,
      city: o.city,
      phone: o.phone,
      createdAt: o.createdAt,
      plan: o.subscription?.plan?.code ?? "gratuit",
      planName: o.subscription?.plan?.name ?? "Aucun",
      planPrice: o.subscription?.plan?.priceMonthlyFcfa ?? 0,
      subscriptionStatus: o.subscription?.status ?? "none",
      paymentProvider: o.subscription?.paymentProvider ?? null,
      docs: o._count.documents,
      members: o._count.members,
      folders: o._count.folders,
    })),
  });
}

// PATCH — suspendre / réactiver une organisation
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!user.superAdmin) return NextResponse.json({ error: "Accès réservé au super-administrateur" }, { status: 403 });

  const { organizationId, action } = await req.json();
  // action: "suspend" | "reactivate" | "force_2fa"
  if (action === "suspend") {
    await db.subscription.updateMany({
      where: { organizationId },
      data: { status: "canceled" },
    });
    return NextResponse.json({ ok: true, message: "Organisation suspendue." });
  }
  if (action === "reactivate") {
    await db.subscription.updateMany({
      where: { organizationId },
      data: { status: "active" },
    });
    return NextResponse.json({ ok: true, message: "Organisation réactivée." });
  }
  return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
}
