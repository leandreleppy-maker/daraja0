// DARAJA — API : Statistiques du Dashboard
// GET /api/dashboard
// Retourne : totalDocuments, totalSizeBytes, totalFolders, totalUsers,
// documentsByType, uploadsLast30Days, recentDocuments, topCategories, auditActivity
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatBytes } from "@/lib/storage";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  // Agrégations parallèles
  const [
    totalDocuments,
    sizeAgg,
    totalFolders,
    totalMembers,
    recentDocuments,
    recentAudits,
    allDocs,
  ] = await Promise.all([
    db.document.count({ where: { organizationId: orgId } }),
    db.document.aggregate({
      where: { organizationId: orgId },
      _sum: { sizeBytes: true },
    }),
    db.folder.count({ where: { organizationId: orgId } }),
    db.member.count({ where: { organizationId: orgId } }),
    db.document.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        uploadedBy: { select: { id: true, name: true } },
        folder: { select: { id: true, name: true, color: true } },
      },
    }),
    db.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { id: true, name: true } } },
    }),
    db.document.findMany({
      where: { organizationId: orgId },
      select: { type: true, sizeBytes: true, createdAt: true, aiCategory: true, aiConfidence: true },
    }),
  ]);

  // Documents par type
  const byType: Record<string, number> = {};
  for (const d of allDocs) byType[d.type] = (byType[d.type] ?? 0) + 1;

  // Uploads 14 derniers jours (par jour)
  const days = 14;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const uploadsByDay = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    return { date: d.toISOString().slice(0, 10), count: 0, size: 0 };
  });
  for (const d of allDocs) {
    const ds = d.createdAt.toISOString().slice(0, 10);
    const bucket = uploadsByDay.find((b) => b.date === ds);
    if (bucket) {
      bucket.count += 1;
      bucket.size += d.sizeBytes;
    }
  }

  // Top catégories IA
  const catCount: Record<string, number> = {};
  for (const d of allDocs) {
    const top = (d.aiCategory ?? "Non classés").split(" > ")[0];
    catCount[top] = (catCount[top] ?? 0) + 1;
  }
  const topCategories = Object.entries(catCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // Confiance IA moyenne
  const confidences = allDocs.map((d) => d.aiConfidence).filter(Boolean) as number[];
  const avgConfidence = confidences.length
    ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100)
    : 0;

  // Quota plan
  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: { subscription: { include: { plan: true } } },
  });
  const planStorageGb = org?.subscription?.plan?.storageGb ?? 5;
  const usedBytes = sizeAgg._sum.sizeBytes ?? 0;
  const totalBytes = planStorageGb * 1024 * 1024 * 1024;
  const storagePct = Math.min(100, Math.round((usedBytes / totalBytes) * 100));

  return NextResponse.json({
    totals: {
      documents: totalDocuments,
      folders: totalFolders,
      members: totalMembers,
      sizeBytes: usedBytes,
      sizeFormatted: formatBytes(usedBytes),
      storagePct,
      storageTotalFormatted: formatBytes(totalBytes),
      avgConfidence,
    },
    documentsByType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    uploadsByDay,
    topCategories,
    recentDocuments: recentDocuments.map((d) => ({
      ...d,
      aiTags: d.aiTags ? JSON.parse(d.aiTags) : [],
      sizeFormatted: formatBytes(d.sizeBytes),
    })),
    recentActivity: recentAudits,
    plan: org?.subscription?.plan ?? null,
  });
}
