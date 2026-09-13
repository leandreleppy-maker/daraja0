// DARAJA — API : Vérifier le mot de passe d'un lien de partage
// POST /api/share/[token]/verify — Public (sans auth)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySharePassword, isShareLinkValid } from "@/lib/share";
import { formatBytes } from "@/lib/storage";

type Ctx = { params: Promise<{ token: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { token } = await params;
  const { password } = await req.json();

  if (!password) {
    return NextResponse.json({ error: "Mot de passe requis." }, { status: 400 });
  }

  const link = await db.shareLink.findUnique({
    where: { token },
    include: {
      document: true,
      organization: { select: { name: true, type: true } },
    },
  });

  if (!link) {
    return NextResponse.json({ error: "Lien introuvable." }, { status: 404 });
  }

  // Vérifie validité (non expiré, non révoqué)
  const validity = isShareLinkValid(link);
  if (!validity.valid) {
    return NextResponse.json({ error: "Lien expiré ou révoqué." }, { status: 410 });
  }

  // Vérifie le mot de passe
  if (!link.passwordHash || !verifySharePassword(password, link.passwordHash)) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 403 });
  }

  // Mot de passe correct — retourne les infos du document
  return NextResponse.json({
    ok: true,
    document: {
      title: link.document.title,
      type: link.document.type,
      mimeType: link.document.mimeType,
      sizeBytes: link.document.sizeBytes,
      sizeFormatted: formatBytes(link.document.sizeBytes),
      createdAt: link.document.createdAt,
      aiCategory: link.document.aiCategory,
    },
    organization: {
      name: link.organization.name,
      type: link.organization.type,
    },
    permission: link.permission,
  });
}
