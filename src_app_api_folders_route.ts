// DARAJA — API : Dossiers (liste + création)
// GET  /api/folders
// POST /api/folders { name, color?, icon?, parentId? }
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  const folders = await db.folder.findMany({
    where: { organizationId: orgId },
    orderBy: [{ name: "asc" }],
    include: {
      _count: { select: { documents: true, children: true } },
    },
  });

  return NextResponse.json({ folders });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  const body = await req.json();
  const { name, color, icon, parentId } = body;
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Nom requis." }, { status: 400 });
  }

  const folder = await db.folder.create({
    data: {
      name: name.trim(),
      color: color ?? "#003366",
      icon: icon ?? "Folder",
      parentId: parentId ?? null,
      organizationId: orgId,
      createdBy: user.id,
    },
  });

  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      action: "rename",
      targetType: "folder",
      targetId: folder.id,
      metadata: JSON.stringify({ name: folder.name, parentId }),
      ipAddress: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
    },
  });

  return NextResponse.json({ ok: true, folder });
}
