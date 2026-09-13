// DARAJA — API : Connexion
// POST /api/auth/login
// Body: { email, password }
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            organization: {
              include: { subscription: { include: { plan: true } } },
            },
          },
        },
      },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
    }

    const token = await createSession(user.id);

    // Audit log
    const orgId = user.memberships[0]?.organizationId;
    if (orgId) {
      await db.auditLog.create({
        data: {
          organizationId: orgId,
          userId: user.id,
          action: "login",
          targetType: "user",
          targetId: user.id,
          metadata: JSON.stringify({ method: "password" }),
          ipAddress: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
        },
      });
    }

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        superAdmin: user.superAdmin,
        role: user.memberships[0]?.role ?? "employe",
      },
      organization: user.memberships[0]?.organization
        ? {
            id: user.memberships[0].organization.id,
            name: user.memberships[0].organization.name,
            type: user.memberships[0].organization.type,
            plan: user.memberships[0].organization.subscription?.plan ?? null,
          }
        : null,
    });
    res.cookies.set(setSessionCookie(token));
    return res;
  } catch (e: any) {
    console.error("[login]", e);
    return NextResponse.json({ error: "Erreur serveur lors de la connexion." }, { status: 500 });
  }
}
