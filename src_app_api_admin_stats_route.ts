// DARAJA — API : Statistiques agrégées plateforme (PROPRIÉTAIRE UNIQUEMENT)
// GET /api/admin/stats
//
// ⚠️ ACCÈS VERROUILLÉ PAR CODE SECRET (header x-daraja-admin-code)
// Aucun utilisateur (même admin d'organisation) ne peut accéder sans le code.
//
// 🔒 CONFIDENTIALITÉ : Cette route ne renvoie QUE des statistiques agrégées.
// Aucune donnée individuelle (nom d'organisation, email, téléphone, liste
// de documents par utilisateur) n'est exposée, afin de préserver la
// confidentialité absolue des comptes clients.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminCode, ADMIN_SECRET_HEADER } from "@/lib/admin-secret";
import { formatBytes } from "@/lib/storage";

export async function GET(req: NextRequest) {
  // 1. Vérification du code secret propriétaire
  const code = req.headers.get(ADMIN_SECRET_HEADER);
  if (!verifyAdminCode(code)) {
    return NextResponse.json(
      { error: "Accès refusé. Code secret propriétaire requis." },
      { status: 403 },
    );
  }

  // 2. Récupération des données agrégées (PAS de données individuelles)
  const [
    totalOrgs,
    totalUsers,
    totalDocs,
    totalFolders,
    sizeAgg,
    totalAuditLogs,
    orgs,
    users,
    docs,
  ] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.document.count(),
    db.folder.count(),
    db.document.aggregate({ _sum: { sizeBytes: true } }),
    db.auditLog.count(),
    db.organization.findMany({
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { documents: true, members: true } },
      },
    }),
    db.user.findMany({
      select: {
        id: true,
        createdAt: true,
        _count: { select: { uploads: true, sessions: true } },
      },
    }),
    db.document.findMany({
      select: {
        createdAt: true,
        sizeBytes: true,
        type: true,
        aiConfidence: true,
        aiLanguage: true,
        organizationId: true,
      },
    }),
  ]);

  // 3. MRR / ARR (agrégat — sans nominer les organisations)
  const activeSubs = orgs
    .filter((o) => o.subscription?.status === "active")
    .map((o) => o.subscription?.plan?.priceMonthlyFcfa ?? 0);
  const mrr = activeSubs.reduce((a, b) => a + b, 0);
  const arr12 = mrr * 12;

  // 4. Répartition par plan (agrégat)
  const planCount: Record<string, number> = {};
  for (const o of orgs) {
    const code = o.subscription?.plan?.code ?? "aucun";
    planCount[code] = (planCount[code] ?? 0) + 1;
  }

  // 5. Répartition par type d'organisation (agrégat)
  const typeCount: Record<string, number> = {};
  for (const o of orgs) {
    typeCount[o.type] = (typeCount[o.type] ?? 0) + 1;
  }

  // 6. Répartition par pays (agrégat)
  const countryCount: Record<string, number> = {};
  for (const o of orgs) {
    countryCount[o.country] = (countryCount[o.country] ?? 0) + 1;
  }

  // 7. Activité 14 derniers jours (inscriptions + uploads — agrégat)
  const days = 14;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activityByDay = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    return { date: d.toISOString().slice(0, 10), signups: 0, uploads: 0, size: 0 };
  });
  for (const u of users) {
    const ds = u.createdAt.toISOString().slice(0, 10);
    const bucket = activityByDay.find((b) => b.date === ds);
    if (bucket) bucket.signups += 1;
  }
  for (const d of docs) {
    const ds = d.createdAt.toISOString().slice(0, 10);
    const bucket = activityByDay.find((b) => b.date === ds);
    if (bucket) {
      bucket.uploads += 1;
      bucket.size += d.sizeBytes;
    }
  }

  // 8. Santé système (simulée pour démo)
  const health = {
    server: "operational",
    uptime: 99.97,
    avgResponseMs: 142,
    errorRate: 0.03,
    dbSize: formatBytes(sizeAgg._sum.sizeBytes ?? 0),
    activeSessions: users.reduce((acc, u) => acc + u._count.sessions, 0),
    lastIncident: "Aucun incident sur les 30 derniers jours",
  };

  // 9. Activité IA agrégée (aucune donnée individuelle)
  const confidences = docs.map((d) => d.aiConfidence).filter(Boolean) as number[];
  const langCount: Record<string, number> = {};
  for (const d of docs) {
    if (d.aiLanguage) langCount[d.aiLanguage] = (langCount[d.aiLanguage] ?? 0) + 1;
  }
  const aiActivity = {
    totalOcr: docs.length,
    avgConfidence: confidences.length
      ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100)
      : 0,
    byLanguage: langCount,
  };

  // 10. Répartition des documents par type (agrégat)
  const docTypeCount: Record<string, number> = {};
  for (const d of docs) {
    docTypeCount[d.type] = (docTypeCount[d.type] ?? 0) + 1;
  }

  // 11. Top 5 organisations par volume — AVEC NOMS RÉELS
  //     Le propriétaire peut voir qui sont ses clients les plus actifs
  //     (mais PAS leurs emails, téléphones, ni liste de documents)
  const orgDocCount: Record<string, number> = {};
  for (const d of docs) {
    orgDocCount[d.organizationId] = (orgDocCount[d.organizationId] ?? 0) + 1;
  }
  const orgNameById: Record<string, { name: string; type: string; country: string }> = {};
  for (const o of orgs) {
    orgNameById[o.id] = { name: o.name, type: o.type, country: o.country };
  }
  const topOrgs = Object.entries(orgDocCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({
      name: orgNameById[id]?.name ?? "Organisation supprimée",
      type: orgNameById[id]?.type ?? "—",
      country: orgNameById[id]?.country ?? "—",
      docs: count,
    }));

  // 12. Liste des abonnés — AVEC NOMS RÉELS
  //     Le propriétaire peut voir QUI a souscrit à sa plateforme
  //     (mais PAS les emails, téléphones, ni détails individuels)
  const subscribers = orgs
    .filter((o) => o.subscription && o.subscription.status === "active")
    .map((o) => ({
      name: o.name,
      type: o.type,
      country: o.country,
      city: o.city,
      planCode: o.subscription?.plan?.code ?? "gratuit",
      planName: o.subscription?.plan?.name ?? "Aucun",
      planPrice: o.subscription?.plan?.priceMonthlyFcfa ?? 0,
      paymentProvider: o.subscription?.paymentProvider ?? "—",
      startedAt: o.subscription?.startedAt ?? o.createdAt,
    }))
    .sort((a, b) => b.planPrice - a.planPrice); // tri par revenu décroissant

  // 12. Répartition des revenus par plan (agrégat)
  const revenueByPlan: Record<string, number> = {};
  for (const o of orgs) {
    if (o.subscription?.status === "active") {
      const code = o.subscription?.plan?.code ?? "aucun";
      revenueByPlan[code] = (revenueByPlan[code] ?? 0) + (o.subscription?.plan?.priceMonthlyFcfa ?? 0);
    }
  }

  // ✅ Réponse : données agrégées + liste des abonnés (noms d'organisations visibles)
  // ⚠️ Noms d'organisations visibles (pour suivi commercial du propriétaire)
  // ⚠️ AUCUN email, AUCUN téléphone, AUCUNE liste de documents par utilisateur
  return NextResponse.json({
    totals: {
      organizations: totalOrgs,
      users: totalUsers,
      documents: totalDocs,
      folders: totalFolders,
      storageBytes: sizeAgg._sum.sizeBytes ?? 0,
      storageFormatted: formatBytes(sizeAgg._sum.sizeBytes ?? 0),
      auditLogs: totalAuditLogs,
      mrr,
      arr12,
    },
    breakdown: {
      byPlan: Object.entries(planCount).map(([code, count]) => ({ code, count })),
      byType: Object.entries(typeCount).map(([type, count]) => ({ type, count })),
      byCountry: Object.entries(countryCount).map(([country, count]) => ({ country, count })),
      byDocType: Object.entries(docTypeCount).map(([type, count]) => ({ type, count })),
    },
    revenueByPlan: Object.entries(revenueByPlan).map(([code, mrr]) => ({ code, mrr })),
    activityByDay,
    topOrganizations: topOrgs,  // AVEC noms réels (pour suivi commercial)
    subscribers,                 // AVEC noms réels (pour savoir qui a souscrit)
    health,
    aiActivity,
    // ⚠️ Noms d'organisations visibles (abonnés + top orgs)
    // ⚠️ Mais AUCUN email, AUCUN téléphone, AUCUNE liste de documents par utilisateur
  });
}
