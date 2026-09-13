// DARAJA — API : Alertes WhatsApp
// POST /api/whatsapp { phone, message, documentId? }
// Simule l'envoi d'une notification via WhatsApp Business API.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sendWhatsAppAlert } from "@/lib/daraja-brain";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = user.memberships?.[0]?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Aucune organisation" }, { status: 400 });

  const { phone, message, documentId } = await req.json();
  if (!phone || !message) {
    return NextResponse.json({ error: "phone et message requis." }, { status: 400 });
  }

  const result = await sendWhatsAppAlert({ phone, message });

  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      action: "share",
      targetType: documentId ? "document" : "user",
      targetId: documentId ?? phone,
      metadata: JSON.stringify({ channel: "whatsapp", phone, success: result.success, messageId: result.messageId }),
      ipAddress: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
    },
  });

  return NextResponse.json({ ok: true, ...result });
}
