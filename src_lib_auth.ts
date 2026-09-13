// DARAJA — Utilitaires d'authentification (cookie-based session)
// Simule JWT + 2FA avec sessions en base. Sécurisé par défaut (hash bcrypt-like).

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";

// Hash simple basé sur PBKDF2 (sans dépendance externe, suffisant pour démo)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100_000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = crypto
    .pbkdf2Sync(password, salt, 100_000, 64, "sha512")
    .toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verify));
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 jours
  await db.session.create({
    data: { userId, token, expiresAt },
  });
  return token;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("daraja_session")?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          passwordHash: true,
          avatarUrl: true,
          twoFactorOn: true,
          superAdmin: true,
          createdAt: true,
          updatedAt: true,
          memberships: {
            include: {
              organization: {
                include: { subscription: { include: { plan: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function getCurrentOrg(user: any) {
  // Première organisation de l'utilisateur (active par défaut)
  return user?.memberships?.[0]?.organization ?? null;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("daraja_session")?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {});
  }
}

export function setSessionCookie(token: string) {
  return {
    name: "daraja_session",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}
