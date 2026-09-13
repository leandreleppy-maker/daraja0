// DARAJA — API : Liste des utilisateurs (super-admin)
// GET /api/admin/users
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!user.superAdmin) return NextResponse.json({ error: "Accès réservé au super-administrateur" }, { status: 403 });

  const users = await db.user.findMany({
    include: {
      memberships: { include: { organization: { select: { id: true, name: true } } } },
      _count: { select: { uploads: true, sessions: true, auditLogs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      superAdmin: u.superAdmin,
      twoFactorOn: u.twoFactorOn,
      createdAt: u.createdAt,
      uploads: u._count.uploads,
      auditActions: u._count.auditLogs,
      activeSessions: u._count.sessions,
      organizations: u.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role,
      })),
    })),
  });
}
