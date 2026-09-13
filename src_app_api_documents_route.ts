// DARAJA — API : Liste & Upload de documents
// GET  /api/documents?folderId=&type=&status=&page=&pageSize=
// POST /api/documents (multipart/form-data : file, folderId?, title?)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { saveFile, formatBytes } from "@/lib/storage";
import { classifyDocument } from "@/lib/daraja-brain";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));

  const where: any = { organizationId: orgId };
  if (folderId === "null" || folderId === "") {
    where.folderId = null;
  } else if (folderId) {
    where.folderId = folderId;
  }
  if (type) where.type = type;
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    db.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        folder: { select: { id: true, name: true, color: true } },
      },
    }),
    db.document.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((d) => ({
      ...d,
      aiTags: d.aiTags ? JSON.parse(d.aiTags) : [],
      sizeFormatted: formatBytes(d.sizeBytes),
    })),
    total,
    page,
    pageSize,
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderId = (formData.get("folderId") as string) || null;
    const titleOverride = (formData.get("title") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier envoyé." }, { status: 400 });
    }

    // Vérif taille (< 25 Mo pour démo)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 25 Mo)." }, { status: 413 });
    }

    // Lecture du buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();

    // Stockage
    const { storagePath } = await saveFile(buffer, ext);

    // Classification IA
    const ai = classifyDocument({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });

    // Persistance
    const doc = await db.document.create({
      data: {
        title: titleOverride ?? ai.suggestedTitle,
        type: file.type.includes("pdf") ? "pdf" : file.type.includes("image") ? "image" : "autre",
        mimeType: file.type,
        sizeBytes: file.size,
        storagePath,
        aiCategory: ai.category,
        aiTags: JSON.stringify(ai.tags),
        aiOcrText: ai.ocrText,
        aiLanguage: ai.language,
        aiConfidence: ai.confidence,
        status: ai.confidence > 0.7 ? "validated" : "uploaded",
        organizationId: orgId,
        folderId: folderId ?? null,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        folder: { select: { id: true, name: true, color: true } },
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        action: "upload",
        targetType: "document",
        targetId: doc.id,
        metadata: JSON.stringify({ filename: file.name, size: file.size, category: ai.category }),
        ipAddress: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
      },
    });

    return NextResponse.json({
      ok: true,
      document: {
        ...doc,
        aiTags: JSON.parse(doc.aiTags ?? "[]"),
        sizeFormatted: formatBytes(doc.sizeBytes),
      },
      classification: ai,
    });
  } catch (e: any) {
    console.error("[documents/upload]", e);
    return NextResponse.json({ error: "Erreur lors de l'upload." }, { status: 500 });
  }
}
