// DARAJA — API : Liens de partage d'un document
// POST /api/documents/[id]/share — Créer un lien de partage
// GET  /api/documents/[id]/share — Lister les liens actifs du document
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { hashSharePassword, generateShareToken } from "@/lib/share";
import { formatBytes } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

// ── POST : Créer un lien de partage ──
export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  const { id } = await params;
  const body = await req.json();
  const { permission, password, expiresAt } = body;

  // Vérifie que le document appartient à l'org de l'utilisateur
  const doc = await db.document.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  // Valide la permission
  const validPerms = ["view", "edit", "private"];
  const perm = validPerms.includes(permission) ? permission : "view";

  // Hash le mot de passe si fourni
  let passwordHash: string | null = null;
  if (password && password.length > 0) {
    if (password.length < 4) {
      return NextResponse.json({ error: "Le mot de passe doit faire au moins 4 caractères." }, { status: 400 });
    }
    passwordHash = hashSharePassword(password);
  }

  // Valide la date d'expiration
  let expiry: Date | null = null;
  if (expiresAt) {
    expiry = new Date(expiresAt);
    if (isNaN(expiry.getTime())) {
      return NextResponse.json({ error: "Date d'expiration invalide." }, { status: 400 });
    }
    if (expiry < new Date()) {
      return NextResponse.json({ error: "La date d'expiration ne peut pas être dans le passé." }, { status: 400 });
    }
  }

  // Génère le token sécurisé
  const token = generateShareToken();

  // Crée le lien
  const link = await db.shareLink.create({
    data: {
      token,
      documentId: id,
      organizationId: orgId,
      createdById: user.id,
      permission: perm,
      passwordHash,
      expiresAt: expiry,
    },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      action: "share",
      targetType: "document",
      targetId: id,
      metadata: JSON.stringify({ token: token.slice(0, 8) + "...", permission: perm, hasPassword: !!passwordHash, hasExpiry: !!expiry }),
      ipAddress: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://daraja.africa";
  return NextResponse.json({
    ok: true,
    link: {
      id: link.id,
      token: link.token,
      url: `${baseUrl}/share/${link.token}`,
      permission: link.permission,
      expiresAt: link.expiresAt,
      hasPassword: !!link.passwordHash,
      createdAt: link.createdAt,
    },
  });
}

// ── GET : Lister les liens de partage d'un document ──
export async function GET(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  const { id } = await params;
  const doc = await db.document.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const links = await db.shareLink.findMany({
    where: { documentId: id },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://daraja.africa";

  return NextResponse.json({
    links: links.map((l) => ({
      id: l.id,
      token: l.token,
      url: `${baseUrl}/share/${l.token}`,
      permission: l.permission,
      hasPassword: !!l.passwordHash,
      expiresAt: l.expiresAt,
      revokedAt: l.revokedAt,
      viewCount: l.viewCount,
      downloadCount: l.downloadCount,
      lastViewedAt: l.lastViewedAt,
      createdByName: l.createdBy?.name ?? "—",
      createdAt: l.createdAt,
      isActive: !l.revokedAt && (!l.expiresAt || l.expiresAt > new Date()),
    })),
  });
}
