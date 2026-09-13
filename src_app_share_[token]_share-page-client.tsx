// DARAJA — Client component pour la page de partage publique
// Gère : vérification mot de passe, aperçu, téléchargement
'use client';

import { useState, useCallback } from "react";
import {
  FileText, Image as ImageIcon, Download, Eye, Lock, Shield, Clock,
  CheckCircle2, AlertCircle, FileSignature, Calendar, HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type DocInfo = {
  title: string;
  type: string;
  mimeType: string | null;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  aiCategory: string | null;
};

type OrgInfo = {
  name: string;
  type: string;
  country: string;
  city: string | null;
};

export function SharePageClient({
  token, document: doc, organization, permission, requiresPassword, expiresAt,
}: {
  token: string;
  document: DocInfo | null;
  organization: OrgInfo | null;
  permission: string;
  requiresPassword: boolean;
  expiresAt: string | null;
}) {
  const [unlocked, setUnlocked] = useState(!requiresPassword);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [docData, setDocData] = useState(doc);
  const [downloading, setDownloading] = useState(false);

  const handleUnlock = useCallback(async () => {
    if (!password) return;
    setVerifying(true);
    try {
      const r = await fetch(`/api/share/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json();
      if (r.ok) {
        setUnlocked(true);
        setDocData(data.document);
        toast.success("Accès autorisé.");
      } else {
        toast.error(data.error ?? "Mot de passe incorrect.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setVerifying(false);
    }
  }, [password, token]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      // Si le document a un mot de passe, on envoie le mot de passe dans le header
      const headers: Record<string, string> = {};
      if (requiresPassword && password) {
        headers["x-share-password"] = password;
      }
      const r = await fetch(`/api/share/${token}/download`, { headers });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error ?? "Téléchargement impossible");
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = docData?.title || "document";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Téléchargement démarré.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDownloading(false);
    }
  }, [token, requiresPassword, password, docData]);

  // ── Mot de passe requis ──
  if (requiresPassword && !unlocked) {
    return (
      <Card className="w-full max-w-md border-primary/30 shadow-xl">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary">Accès protégé par mot de passe</h2>
            <p className="text-sm text-foreground/60 mt-1">
              Ce document est protégé. Saisissez le mot de passe fourni par {organization?.name ?? "l'expéditeur"}.
            </p>
          </div>
          <Input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            className="text-center"
            autoFocus
          />
          <Button
            onClick={handleUnlock}
            disabled={verifying || !password}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {verifying ? "Vérification…" : <><Lock className="w-4 h-4 mr-1.5" /> Déverrouiller</>}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Document déverrouillé — affiche l'aperçu ──
  if (!docData) return null;

  const isImage = docData.type === "image" || docData.mimeType?.includes("image");
  const isPdf = docData.type === "pdf" || docData.mimeType?.includes("pdf");
  const canDownload = permission !== "private";

  return (
    <Card className="w-full max-w-2xl shadow-xl border-border/70 overflow-hidden">
      {/* Bandeau couleur primaire */}
      <div className="bg-primary text-primary-foreground p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            {isImage ? <ImageIcon className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold leading-tight">{docData.title}</h1>
            <div className="text-sm text-white/70 mt-1 flex flex-wrap gap-3">
              <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{docData.sizeFormatted}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(docData.createdAt).toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-5">
        {/* Métadonnées */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-foreground/50">Type :</span>
            <Badge variant="outline" className="capitalize">{docData.type}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-foreground/50">Taille :</span>
            <span className="font-medium">{docData.sizeFormatted}</span>
          </div>
          {docData.aiCategory && (
            <div className="col-span-2 flex items-center gap-2">
              <span className="text-foreground/50">Catégorie :</span>
              <span className="font-medium text-foreground/80">{docData.aiCategory}</span>
            </div>
          )}
          {organization && (
            <div className="col-span-2 flex items-center gap-2">
              <span className="text-foreground/50">Partagé par :</span>
              <span className="font-medium">{organization.name}</span>
            </div>
          )}
        </div>

        {/* Permissions info */}
        <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-foreground/70">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">Permissions :</span>
            <span>
              {permission === "view" && "👁️ Consultation autorisée"}
              {permission === "edit" && "✏️ Consultation et modification autorisées"}
              {permission === "private" && "🔒 Accès privé"}
            </span>
          </div>
          {expiresAt && (
            <div className="flex items-center gap-1.5 text-foreground/60">
              <Clock className="w-3 h-3" />
              Expire le {new Date(expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          )}
        </div>

        {/* Aperçu (placeholder pour PDF/image — en production, on afficherait un viewer) */}
        <div className="aspect-[4/3] bg-gradient-to-br from-muted to-card border border-border rounded-lg flex items-center justify-center">
          {isImage ? (
            <ImageIcon className="w-16 h-16 text-foreground/20" />
          ) : (
            <div className="text-center">
              <FileText className="w-16 h-16 text-primary/30 mx-auto mb-2" />
              <div className="text-xs text-foreground/50">Aperçu du document</div>
              {isPdf && <div className="text-[10px] text-foreground/40 mt-1">PDF · Cliquez « Consulter » pour ouvrir</div>}
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-wrap gap-2">
          {canDownload ? (
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {downloading ? "Téléchargement…" : "Télécharger"}
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => toast.info("Le visionneuse intégrée sera disponible dans une prochaine version.")}
          >
            <Eye className="w-4 h-4 mr-1.5" /> Consulter
          </Button>
        </div>

        {/* Footer sécurité */}
        <div className="text-[10px] text-foreground/40 text-center pt-2 border-t border-border">
          🔐 Document partagé de manière sécurisée via DARAJA · Chiffré AES-256
        </div>
      </CardContent>
    </Card>
  );
}
