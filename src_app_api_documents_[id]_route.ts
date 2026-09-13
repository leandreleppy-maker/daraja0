// DARAJA — API : Opérations sur un document (GET, PATCH, DELETE, sign)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { deleteFile, formatBytes } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  const { id } = await params;
  const doc = await db.document.findFirst({
    where: { id, organizationId: orgId },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      folder: { select: { id: true, name: true, color: true } },
    },
  });
  if (!doc) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  return NextResponse.json({
    ...doc,
    aiTags: doc.aiTags ? JSON.parse(doc.aiTags) : [],
    sizeFormatted: formatBytes(doc.sizeBytes),
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  const { id } = await params;
  const body = await req.json();

  const allowed: any = {};
  if (typeof body.title === "string") allowed.title = body.title;
  if (typeof body.folderId === "string" || body.folderId === null) allowed.folderId = body.folderId;
  if (typeof body.status === "string") allowed.status = body.status;
  if (typeof body.description === "string") allowed.description = body.description;
  if (body.sign === true) {
    allowed.signedBy = user.name;
    allowed.signedAt = new Date();
    allowed.status = "signed";
  }

  const updated = await db.document.update({
    where: { id },
    data: allowed,
  });

  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      action: body.sign === true ? "sign" : "rename",
      targetType: "document",
      targetId: id,
      metadata: JSON.stringify(allowed),
      ipAddress: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
    },
  });

  return NextResponse.json({ ok: true, document: updated });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  const { id } = await params;
  const doc = await db.document.findFirst({ where: { id, organizationId: orgId } });
  if (!doc) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await deleteFile(doc.storagePath);
  await db.document.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      action: "delete",
      targetType: "document",
      targetId: id,
      metadata: JSON.stringify({ title: doc.title }),
      ipAddress: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
    },
  });

  return NextResponse.json({ ok: true });
}
