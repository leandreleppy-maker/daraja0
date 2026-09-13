// DARAJA — API : Liste tous les liens partagés de l'utilisateur
// GET /api/share-links — Liste
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatBytes } from "@/lib/storage";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  // Récupère tous les liens de partage de l'organisation
  const links = await db.shareLink.findMany({
    where: { organizationId: orgId },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          type: true,
          mimeType: true,
          sizeBytes: true,
          status: true,
        },
      },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://daraja.africa";

  return NextResponse.json({
    links: links.map((l) => {
      const isExpired = l.expiresAt && l.expiresAt < new Date();
      const isRevoked = !!l.revokedAt;
      const isActive = !isRevoked && !isExpired;

      return {
        id: l.id,
        token: l.token,
        url: `${baseUrl}/share/${l.token}`,
        document: l.document ? {
          id: l.document.id,
          title: l.document.title,
          type: l.document.type,
          mimeType: l.document.mimeType,
          sizeFormatted: formatBytes(l.document.sizeBytes),
          status: l.document.status,
        } : null,
        permission: l.permission,
        hasPassword: !!l.passwordHash,
        expiresAt: l.expiresAt,
        revokedAt: l.revokedAt,
        viewCount: l.viewCount,
        downloadCount: l.downloadCount,
        lastViewedAt: l.lastViewedAt,
        createdByName: l.createdBy?.name ?? "—",
        createdAt: l.createdAt,
        isActive,
        isExpired,
        isRevoked,
        status: isRevoked ? "Révoqué" : isExpired ? "Expiré" : "Actif",
      };
    }),
  });
}
