// DARAJA — API : Recherche temps réel dans les documents
// GET /api/documents/search?q=contrat+marche+2024&limit=20
// Recherche dans : titre, catégorie IA, tags, texte OCR.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatBytes } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));

  if (q.length < 1) {
    return NextResponse.json({ items: [], total: 0, q: "" });
  }

  // Découpe la requête en tokens
  const tokens = q.split(/\s+/).filter(Boolean);

  // Construit les conditions OR par token (title, aiCategory, aiOcrText, aiTags)
  const orClauses: any[] = [];
  for (const t of tokens) {
    orClauses.push({ title: { contains: t } });
    orClauses.push({ aiCategory: { contains: t } });
    orClauses.push({ aiOcrText: { contains: t } });
    orClauses.push({ aiTags: { contains: t } });
  }

  const items = await db.document.findMany({
    where: {
      organizationId: orgId,
      AND: [{ OR: orClauses }],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      uploadedBy: { select: { id: true, name: true } },
      folder: { select: { id: true, name: true, color: true } },
    },
  });

  return NextResponse.json({
    items: items.map((d) => ({
      ...d,
      aiTags: d.aiTags ? JSON.parse(d.aiTags) : [],
      sizeFormatted: formatBytes(d.sizeBytes),
    })),
    total: items.length,
    q,
  });
}
