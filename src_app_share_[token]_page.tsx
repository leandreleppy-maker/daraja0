// DARAJA — Page publique de partage /share/[token]
// Server component avec métadonnées Open Graph pour prévisualisation WhatsApp
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isShareLinkValid } from "@/lib/share";
import { formatBytes } from "@/lib/storage";
import { SharePageClient } from "./share-page-client";
import { DarajaLogo } from "@/components/daraja/logo";

// ── Métadonnées Open Graph (pour prévisualisation WhatsApp / réseaux sociaux) ──
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await db.shareLink.findUnique({
    where: { token },
    include: { document: true, organization: true },
  });

  if (!link) {
    return {
      title: "DARAJA — Lien de partage introuvable",
      description: "Ce lien de partage n'existe pas ou a été supprimé.",
      openGraph: {
        title: "DARAJA — Lien introuvable",
        description: "Ce lien de partage n'existe pas ou a été supprimé.",
        siteName: "DARAJA",
        type: "website",
      },
    };
  }

  const validity = isShareLinkValid(link);
  if (!validity.valid) {
    const msg = validity.reason === "revoked"
      ? "Ce lien a été désactivé par son créateur."
      : "Ce lien a expiré.";
    return {
      title: `DARAJA — Lien ${validity.reason === "revoked" ? "désactivé" : "expiré"}`,
      description: msg,
      openGraph: {
        title: `DARAJA — Lien ${validity.reason === "revoked" ? "désactivé" : "expiré"}`,
        description: msg,
        siteName: "DARAJA",
        type: "website",
      },
    };
  }

  const doc = link.document;
  const title = doc?.title ?? "Document partagé";
  const description = `📄 ${title} · ${formatBytes(doc?.sizeBytes ?? 0)} · Partagé via DARAJA, le SaaS d'archivage n°1 pour l'Afrique.`;

  return {
    title: `${title} — DARAJA`,
    description,
    openGraph: {
      title: `📄 ${title}`,
      description,
      url: `/share/${token}`,
      siteName: "DARAJA — Le pont vers vos archives",
      type: "website",
      images: [
        {
          url: "/logo.svg",
          width: 200,
          height: 48,
          alt: "DARAJA",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `📄 ${title}`,
      description,
    },
  };
}

// ── Page (server component) ──
export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const link = await db.shareLink.findUnique({
    where: { token },
    include: {
      document: true,
      organization: { select: { name: true, type: true, country: true, city: true } },
      createdBy: { select: { name: true } },
    },
  });

  // Cas 1 : Lien introuvable
  if (!link) {
    return <NotFoundPage />;
  }

  // Cas 2 : Lien expiré ou révoqué
  const validity = isShareLinkValid(link);
  if (!validity.valid) {
    return (
      <ExpiredPage
        reason={validity.reason ?? "expired"}
      />
    );
  }

  // Cas 3 : Document supprimé
  if (!link.document || link.document.status === "deleted") {
    return <NotFoundPage docDeleted />;
  }

  // Cas 4 : Lien valide — affiche la page de partage
  const doc = link.document;
  return (
    <div className="min-h-screen bg-background daraja-bridge-bg flex flex-col">
      {/* Header avec logo */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <DarajaLogo size={36} />
          <span className="text-xs text-foreground/50">
            SaaS d'archivage n°1 pour l'Afrique
          </span>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 flex items-center justify-center p-4">
        <SharePageClient
          token={token}
          document={{
            title: doc.title,
            type: doc.type,
            mimeType: doc.mimeType,
            sizeBytes: doc.sizeBytes,
            sizeFormatted: formatBytes(doc.sizeBytes),
            createdAt: doc.createdAt.toISOString(),
            aiCategory: doc.aiCategory,
          }}
          organization={{
            name: link.organization.name,
            type: link.organization.type,
            country: link.organization.country,
            city: link.organization.city,
          }}
          permission={link.permission}
          requiresPassword={!!link.passwordHash}
          expiresAt={link.expiresAt?.toISOString() ?? null}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4">
        <div className="mx-auto max-w-3xl px-4 text-center text-xs text-foreground/50">
          ☁️ DARAJA — Le pont vers vos archives · Hébergement Hostinger / LWS · Direction Bamako, Mali
        </div>
      </footer>
    </div>
  );
}

// ── Page "lien introuvable" ──
function NotFoundPage({ docDeleted }: { docDeleted?: boolean }) {
  return (
    <div className="min-h-screen bg-background daraja-bridge-bg flex flex-col items-center justify-center p-4">
      <DarajaLogo size={36} />
      <div className="mt-8 text-center max-w-md">
        <div className="text-5xl mb-4">📭</div>
        <h1 className="text-xl font-bold text-primary mb-2">
          {docDeleted ? "Document supprimé" : "Lien introuvable"}
        </h1>
        <p className="text-sm text-foreground/60">
          {docDeleted
            ? "Le document associé à ce lien a été supprimé par son propriétaire."
            : "Ce lien de partage n'existe pas ou a été supprimé."}
        </p>
      </div>
    </div>
  );
}

// ── Page "lien expiré / révoqué" ──
function ExpiredPage({ reason }: { reason: string }) {
  const isRevoked = reason === "revoked";
  return (
    <div className="min-h-screen bg-background daraja-bridge-bg flex flex-col items-center justify-center p-4">
      <DarajaLogo size={36} />
      <div className="mt-8 text-center max-w-md">
        <div className="text-5xl mb-4">{isRevoked ? "🔒" : "⏳"}</div>
        <h1 className="text-xl font-bold text-primary mb-2">
          {isRevoked ? "Lien désactivé" : "Lien expiré"}
        </h1>
        <p className="text-sm text-foreground/60">
          {isRevoked
            ? "Ce lien de partage a été désactivé par son créateur. Il n'est plus accessible."
            : "Ce lien de partage a expiré. Contactez la personne qui vous l'a envoyé pour obtenir un nouveau lien."}
        </p>
      </div>
    </div>
  );
}
