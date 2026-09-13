// DARAJA — API : Informations publiques d'un lien de partage
// GET /api/share/[token] — Page publique (sans auth)
// Vérifications : token existe, non expiré, non révoqué, document existe
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isShareLinkValid } from "@/lib/share";
import { formatBytes } from "@/lib/storage";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { token } = await params;

  // 1. Le lien existe ?
  const link = await db.shareLink.findUnique({
    where: { token },
    include: {
      document: true,
      organization: { select: { name: true, type: true } },
    },
  });
  if (!link) {
    return NextResponse.json(
      { error: "Ce lien de partage n'existe pas ou a été supprimé.", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  // 2. Le lien est-il révoqué ou expiré ?
  const validity = isShareLinkValid(link);
  if (!validity.valid) {
    return NextResponse.json({
      error: validity.reason === "revoked"
        ? "Ce lien de partage a été désactivé par son créateur."
        : "Ce lien de partage a expiré.",
      code: validity.reason?.toUpperCase(),
    }, { status: 410 });
  }

  // 3. Le document existe-t-il toujours et n'est-il pas supprimé ?
  if (!link.document || link.document.status === "deleted") {
    return NextResponse.json(
      { error: "Le document associé à ce lien n'existe plus.", code: "DOC_DELETED" },
      { status: 404 },
    );
  }

  // 4. Incrémente le compteur de vues
  await db.shareLink.update({
    where: { id: link.id },
    data: {
      viewCount: { increment: 1 },
      lastViewedAt: new Date(),
    },
  }).catch(() => {});

  // 5. Retourne les infos publiques
  //    Si le lien a un mot de passe, on ne retourne PAS les infos du document
  //    tant que le mot de passe n'est pas vérifié
  const requiresPassword = !!link.passwordHash;

  return NextResponse.json({
    token: link.token,
    requiresPassword,
    permission: link.permission,
    expiresAt: link.expiresAt,
    document: requiresPassword ? null : {
      title: link.document.title,
      type: link.document.type,
      mimeType: link.document.mimeType,
      sizeBytes: link.document.sizeBytes,
      sizeFormatted: formatBytes(link.document.sizeBytes),
      createdAt: link.document.createdAt,
      aiCategory: link.document.aiCategory,
    },
    organization: requiresPassword ? null : {
      name: link.organization.name,
      type: link.organization.type,
    },
    platformName: "DARAJA",
    platformTagline: "Le pont vers vos archives",
  });
}
