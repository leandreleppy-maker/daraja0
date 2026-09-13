// DARAJA — API : Dossier individuel (rename, move, delete)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  const { id } = await params;
  const body = await req.json();
  const allowed: any = {};
  if (typeof body.name === "string") allowed.name = body.name;
  if (typeof body.color === "string") allowed.color = body.color;
  if (typeof body.icon === "string") allowed.icon = body.icon;
  if (typeof body.parentId === "string" || body.parentId === null) allowed.parentId = body.parentId;

  const updated = await db.folder.update({
    where: { id },
    data: allowed,
  });

  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      action: "rename",
      targetType: "folder",
      targetId: id,
      metadata: JSON.stringify(allowed),
      ipAddress: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
    },
  });

  return NextResponse.json({ ok: true, folder: updated });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  const { id } = await params;
  // Détache les documents (folderId = null) avant suppression
  await db.document.updateMany({
    where: { folderId: id },
    data: { folderId: null },
  });
  // Réassigne les sous-dossiers au parent
  const folder = await db.folder.findFirst({ where: { id, organizationId: orgId } });
  if (!folder) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  await db.folder.updateMany({
    where: { parentId: id },
    data: { parentId: folder.parentId },
  });
  await db.folder.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      action: "delete",
      targetType: "folder",
      targetId: id,
      metadata: JSON.stringify({ name: folder.name }),
      ipAddress: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
    },
  });

  return NextResponse.json({ ok: true });
}
