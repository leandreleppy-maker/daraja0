// DARAJA — Code secret propriétaire de la plateforme
// ═══════════════════════════════════════════════════════════
// ⚠️ CONFIDENTIEL — RÉSERVÉ AU PROPRIÉTAIRE DE L'APPLICATION
// ═══════════════════════════════════════════════════════════
//
// Ce code protège l'accès au tableau de bord super-administrateur.
// Aucun utilisateur (y compris les admins d'organisation) ne peut
// accéder à la console plateforme sans connaître ce code.
//
// Le code est vérifié CÔTÉ SERVEUR dans chaque route /api/admin/*.
// Le tableau de bord super-admin n'affiche QUE des statistiques
// agrégées (aucune donnée individuelle utilisateur ou organisation)
// afin de préserver la confidentialité absolue des comptes clients.
//
// Code secret : 847825
//
// Raccourci clavier pour déverrouiller : Ctrl + Shift + Alt + D
// ═══════════════════════════════════════════════════════════

export const ADMIN_SECRET_CODE = "847825";
export const ADMIN_SECRET_HEADER = "x-daraja-admin-code";

export function verifyAdminCode(code: string | null | undefined): boolean {
  if (!code) return false;
  // Comparaison temps constant pour éviter les attaques timing
  if (code.length !== ADMIN_SECRET_CODE.length) return false;
  let result = 0;
  for (let i = 0; i < ADMIN_SECRET_CODE.length; i++) {
    result |= code.charCodeAt(i) ^ ADMIN_SECRET_CODE.charCodeAt(i);
  }
  return result === 0;
}
