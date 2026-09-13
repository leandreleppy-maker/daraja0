// DARAJA — Utilitaires de partage sécurisé de documents
// Génération de tokens, vérification de permissions, validation de liens

import crypto from "crypto";

/**
 * Génère un token de partage sécurisé (32 caractères hex)
 * Jamais l'ID numérique du document — impossible à deviner.
 */
export function generateShareToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Hash un mot de passe de partage (PBKDF2, 100k itérations)
 */
export function hashSharePassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100_000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Vérifie un mot de passe de partage
 */
export function verifySharePassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = crypto
    .pbkdf2Sync(password, salt, 100_000, 64, "sha512")
    .toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verify));
}

/**
 * Vérifie si un lien de partage est valide (non expiré, non révoqué)
 */
export function isShareLinkValid(link: {
  revokedAt: Date | null;
  expiresAt: Date | null;
}): { valid: boolean; reason?: string } {
  if (link.revokedAt) {
    return { valid: false, reason: "revoked" };
  }
  if (link.expiresAt && link.expiresAt < new Date()) {
    return { valid: false, reason: "expired" };
  }
  return { valid: true };
}

/**
 * Construit l'URL publique de partage
 */
export function buildShareUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://daraja.africa";
  return `${base}/share/${token}`;
}

/**
 * Construit le message WhatsApp prérempli
 */
export function buildWhatsAppMessage(docTitle: string, shareUrl: string): string {
  return `📄 Document partagé avec vous

Nom : ${docTitle}

🔗 Consultez le document :
${shareUrl}

☁️ DARAJA — Le pont vers vos archives`;
}

/**
 * Construit l'URL de partage WhatsApp (wa.me)
 * Fonctionne sur WhatsApp Web, Desktop, Android, iPhone
 */
export function buildWhatsAppUrl(phone: string | null, message: string): string {
  const encoded = encodeURIComponent(message);
  if (phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

/**
 * Construit le lien mailto pour le partage par email
 */
export function buildEmailUrl(docTitle: string, shareUrl: string): string {
  const subject = encodeURIComponent(`📄 Document partagé : ${docTitle}`);
  const body = encodeURIComponent(
    `Bonjour,\n\nUn document a été partagé avec vous via DARAJA.\n\n📄 Nom : ${docTitle}\n\n🔗 Consultez le document :\n${shareUrl}\n\n☁️ DARAJA — Le pont vers vos archives`,
  );
  return `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Permissions de partage
 */
export type SharePermission = "view" | "edit" | "private";

export const PERMISSION_LABELS: Record<SharePermission, string> = {
  view: "👁️ Consultation",
  edit: "✏️ Modification",
  private: "🔒 Privé",
};

export const PERMISSION_DESCRIPTIONS: Record<SharePermission, string> = {
  view: "Toute personne disposant du lien peut consulter",
  edit: "Toute personne disposant du lien peut modifier",
  private: "Accès privé — seul le créateur peut consulter",
};
