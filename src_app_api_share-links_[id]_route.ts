// DARAJA — API : Révoquer un lien de partage
// DELETE /api/share-links/[id] — Révoque immédiatement
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  const { id } = await params;

  // Vérifie que le lien appartient à l'organisation de l'utilisateur
  const link = await db.shareLink.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!link) return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });

  // Révoque immédiatement
  await db.shareLink.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      action: "share",
      targetType: "document",
      targetId: link.documentId,
      metadata: JSON.stringify({ action: "revoke", token: link.token.slice(0, 8) + "..." }),
      ipAddress: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
    },
  });

  return NextResponse.json({ ok: true, message: "Lien révoqué immédiatement." });
}
