// DARAJA — API : Inscription
// POST /api/auth/signup
// Body: { name, email, password, phone?, orgName, orgType, planCode }
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone, orgName, orgType, planCode } = body;

    if (!name || !email || !password || !orgName) {
      return NextResponse.json(
        { error: "Champs requis manquants." },
        { status: 400 },
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 409 },
      );
    }

    // 1. Utilisateur
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash: hashPassword(password),
        phone: phone ?? null,
      },
    });

    // 2. Organisation
    const org = await db.organization.create({
      data: {
        name: orgName,
        type: orgType ?? "pme",
        country: "ML",
      },
    });

    // 3. Membre (admin de sa propre org)
    await db.member.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: "admin",
      },
    });

    // 4. Souscription au plan choisi
    const plan = await db.plan.findUnique({ where: { code: planCode ?? "gratuit" } });
    if (plan) {
      await db.subscription.create({
        data: {
          organizationId: org.id,
          planId: plan.id,
          status: plan.code === "gratuit" ? "active" : "pending",
        },
      });
    }

    // 5. Session
    const token = await createSession(user.id);
    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
      organizationId: org.id,
    });
    res.cookies.set(setSessionCookie(token));
    return res;
  } catch (e: any) {
    console.error("[signup]", e);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'inscription." },
      { status: 500 },
    );
  }
}
