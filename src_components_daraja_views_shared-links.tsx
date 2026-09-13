// DARAJA — Vue "Liens partagés" (gestion + statistiques + révocation)
'use client';

import { useEffect, useState, useCallback } from "react";
import {
  Share2, Copy, Ban, Eye, Download, Clock, Shield, FileText,
  Image as ImageIcon, Loader2, CheckCircle2, XCircle, ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { api, timeAgo, formatFcfa } from "@/lib/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SharedLink = {
  id: string;
  token: string;
  url: string;
  document: {
    id: string;
    title: string;
    type: string;
    mimeType: string | null;
    sizeFormatted: string;
    status: string;
  } | null;
  permission: string;
  hasPassword: boolean;
  expiresAt: string | null;
  revokedAt: string | null;
  viewCount: number;
  downloadCount: number;
  lastViewedAt: string | null;
  createdByName: string;
  createdAt: string;
  isActive: boolean;
  isExpired: boolean;
  isRevoked: boolean;
  status: string;
};

export function SharedLinksView() {
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<SharedLink | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ links: SharedLink[] }>("/api/share-links");
      setLinks(data.links);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCopy = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Lien copié dans le presse-papier !");
  }, []);

  const handleRevoke = useCallback(async () => {
    if (!revokeTarget) return;
    try {
      await api(`/api/share-links/${revokeTarget.id}`, { method: "DELETE" });
      toast.success("Lien révoqué immédiatement.");
      setRevokeTarget(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }, [revokeTarget, load]);

  const filtered = links.filter((l) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      (l.document?.title ?? "").toLowerCase().includes(q) ||
      l.token.toLowerCase().includes(q) ||
      l.createdByName.toLowerCase().includes(q)
    );
  });

  // Stats globales
  const stats = {
    total: links.length,
    active: links.filter((l) => l.isActive).length,
    totalViews: links.reduce((a, b) => a + b.viewCount, 0),
    totalDownloads: links.reduce((a, b) => a + b.downloadCount, 0),
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary font-[family-name:var(--font-poppins)]">Liens partagés</h1>
        <p className="text-sm text-foreground/60">Gérez tous vos liens de partage, consultez les statistiques et révoquez l'accès à tout moment.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="daraja-card border-border/70">
          <CardContent className="p-4">
            <Share2 className="w-6 h-6 text-primary mb-1" />
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-xs text-foreground/50">Liens créés</div>
          </CardContent>
        </Card>
        <Card className="daraja-card border-border/70">
          <CardContent className="p-4">
            <CheckCircle2 className="w-6 h-6 text-success mb-1" />
            <div className="text-2xl font-bold text-foreground">{stats.active}</div>
            <div className="text-xs text-foreground/50">Liens actifs</div>
          </CardContent>
        </Card>
        <Card className="daraja-card border-border/70">
          <CardContent className="p-4">
            <Eye className="w-6 h-6 text-gold mb-1" />
            <div className="text-2xl font-bold text-foreground">{stats.totalViews}</div>
            <div className="text-xs text-foreground/50">Consultations</div>
          </CardContent>
        </Card>
        <Card className="daraja-card border-border/70">
          <CardContent className="p-4">
            <Download className="w-6 h-6 text-primary mb-1" />
            <div className="text-2xl font-bold text-foreground">{stats.totalDownloads}</div>
            <div className="text-xs text-foreground/50">Téléchargements</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtre */}
      <Card className="border-border/70">
        <CardContent className="p-3">
          <Input
            placeholder="Filtrer par nom de document, token ou créateur…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Share2 className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
            <div className="text-foreground/60 mb-2">Aucun lien de partage créé.</div>
            <p className="text-xs text-foreground/40">
              Allez dans la vue Documents et cliquez sur « Partager » pour créer votre premier lien.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/70 overflow-hidden">
          <div className="overflow-x-auto daraja-scroll">
            <table className="w-full text-sm">
              <thead className="bg-primary text-primary-foreground text-xs">
                <tr>
                  <th className="text-left p-3 font-medium">Document</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Permission</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Créé</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Expire</th>
                  <th className="text-right p-3 font-medium hidden md:table-cell">Vues</th>
                  <th className="text-right p-3 font-medium hidden lg:table-cell">DL</th>
                  <th className="text-left p-3 font-medium">Statut</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((l) => {
                  const isImage = l.document?.type === "image" || l.document?.mimeType?.includes("image");
                  return (
                    <tr key={l.id} className="hover:bg-muted/40">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                            isImage ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                          }`}>
                            {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate max-w-[200px]">
                              {l.document?.title ?? "Document supprimé"}
                            </div>
                            <div className="text-[10px] text-foreground/40 font-mono truncate max-w-[200px]">
                              /share/{l.token.slice(0, 12)}…
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs">
                          {l.permission === "view" && "👁️ Consultation"}
                          {l.permission === "edit" && "✏️ Modification"}
                          {l.permission === "private" && "🔒 Privé"}
                          {l.hasPassword && <Shield className="w-3 h-3 text-gold" />}
                        </div>
                      </td>
                      <td className="p-3 hidden sm:table-cell text-xs text-foreground/60">
                        <div>{timeAgo(l.createdAt)}</div>
                        <div className="text-[10px] text-foreground/40">{l.createdByName}</div>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-xs text-foreground/60">
                        {l.expiresAt ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(l.expiresAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                          </div>
                        ) : (
                          <span className="text-foreground/30">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right hidden md:table-cell">
                        <span className="font-medium">{l.viewCount}</span>
                      </td>
                      <td className="p-3 text-right hidden lg:table-cell">
                        <span className="font-medium">{l.downloadCount}</span>
                      </td>
                      <td className="p-3">
                        {l.isRevoked ? (
                          <Badge className="bg-destructive/10 text-destructive"><XCircle className="w-3 h-3 mr-1" />Révoqué</Badge>
                        ) : l.isExpired ? (
                          <Badge className="bg-muted text-foreground/60"><Clock className="w-3 h-3 mr-1" />Expiré</Badge>
                        ) : (
                          <Badge className="bg-success/15 text-success"><CheckCircle2 className="w-3 h-3 mr-1" />Actif</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleCopy(l.url)}
                            className="p-1.5 rounded hover:bg-muted text-foreground/60 hover:text-primary"
                            title="Copier le lien"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-muted text-foreground/60 hover:text-primary"
                            title="Ouvrir le lien"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          {l.isActive && (
                            <button
                              onClick={() => setRevokeTarget(l)}
                              className="p-1.5 rounded hover:bg-destructive/10 text-foreground/60 hover:text-destructive"
                              title="Révoquer le lien"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Dialogue de confirmation de révocation */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer ce lien de partage ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est immédiate et irréversible. Toute personne qui tente d'accéder à ce lien verra un message « Lien désactivé ».
              {revokeTarget?.document && (
                <span className="block mt-2 text-sm">
                  Document : <strong>{revokeTarget.document.title}</strong>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Ban className="w-4 h-4 mr-1.5" /> Révoquer immédiatement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
