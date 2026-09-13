// DARAJA — Modal de partage (style Google Drive)
// Bouton Partager → génère un lien sécurisé → WhatsApp / Copier / Email / QR Code
'use client';

import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Share2, Copy, Check, MessageCircle, Mail, QrCode, Lock, Clock,
  Eye, Pencil, Shield, FileText, Image as ImageIcon, HardDrive, X,
  ExternalLink, Loader2, Calendar,
} from "lucide-react";
import { api, formatFcfa, timeAgo } from "@/lib/client";
import { toast } from "sonner";

type Doc = {
  id: string;
  title: string;
  type: string;
  mimeType: string | null;
  sizeBytes: number;
  sizeFormatted: string;
};

type Permission = "view" | "edit" | "private";

type ShareLinkInfo = {
  id: string;
  token: string;
  url: string;
  permission: Permission;
  hasPassword: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export function ShareDialog({
  doc, open, onClose,
}: {
  doc: Doc | null;
  open: boolean;
  onClose: () => void;
}) {
  const [shareUrl, setShareUrl] = useState("");
  const [permission, setPermission] = useState<Permission>("view");
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [creating, setCreating] = useState(false);
  const [existingLinks, setExistingLinks] = useState<ShareLinkInfo[]>([]);
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Charge les liens existants quand la modale s'ouvre
  useEffect(() => {
    if (open && doc) {
      api<{ links: ShareLinkInfo[] }>(`/api/documents/${doc.id}/share`)
        .then((data) => {
          setExistingLinks(data.links);
          // S'il y a déjà un lien actif, l'affiche
          const activeLink = data.links.find((l: any) => l.isActive);
          if (activeLink) {
            setShareUrl(activeLink.url);
            setPermission(activeLink.permission);
          }
        })
        .catch(() => {});
    }
  }, [open, doc]);

  // Génère le QR code quand l'URL change
  useEffect(() => {
    if (shareUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 256,
        margin: 2,
        color: { dark: "#003366", light: "#FFFFFF" },
      })
        .then(setQrCodeDataUrl)
        .catch(() => setQrCodeDataUrl(null));
    } else {
      setQrCodeDataUrl(null);
    }
  }, [shareUrl]);

  const handleCreateLink = useCallback(async () => {
    if (!doc) return;
    setCreating(true);
    try {
      const body: any = { permission };
      if (usePassword && password) body.password = password;
      if (useExpiry) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + expiryDays);
        body.expiresAt = expiry.toISOString();
      }
      const data = await api<{ ok: boolean; link: ShareLinkInfo }>(
        `/api/documents/${doc.id}/share`,
        { method: "POST", body: JSON.stringify(body) },
      );
      setShareUrl(data.link.url);
      toast.success("Lien de partage généré avec succès.");
      // Rafraîchit la liste
      const refreshed = await api<{ links: ShareLinkInfo[] }>(`/api/documents/${doc.id}/share`);
      setExistingLinks(refreshed.links);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  }, [doc, permission, usePassword, password, useExpiry, expiryDays]);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Lien copié dans le presse-papier !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  }, [shareUrl]);

  const handleWhatsApp = useCallback(() => {
    if (!doc || !shareUrl) return;
    const message = `📄 Document partagé avec vous\n\nNom : ${doc.title}\n\n🔗 Consultez le document :\n${shareUrl}\n\n☁️ DARAJA — Le pont vers vos archives`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    toast.success("WhatsApp ouvert avec le message prérempli.");
  }, [doc, shareUrl]);

  const handleEmail = useCallback(() => {
    if (!doc || !shareUrl) return;
    const subject = encodeURIComponent(`📄 Document partagé : ${doc.title}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nUn document a été partagé avec vous via DARAJA.\n\n📄 Nom : ${doc.title}\n🔗 Consultez le document :\n${shareUrl}\n\n☁️ DARAJA — Le pont vers vos archives`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, [doc, shareUrl]);

  if (!doc) return null;

  const isImage = doc.type === "image" || doc.mimeType?.includes("image");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg max-h-[92vh] overflow-y-auto daraja-scroll">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2">
            <Share2 className="w-5 h-5" /> Partager le document
          </DialogTitle>
          <DialogDescription>
            Générez un lien sécurisé et partagez-le via WhatsApp, email ou QR code.
          </DialogDescription>
        </DialogHeader>

        {/* Document info */}
        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
          <div className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 ${
            isImage ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
          }`}>
            {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{doc.title}</div>
            <div className="text-[11px] text-foreground/50 flex items-center gap-2">
              <span className="flex items-center gap-0.5"><HardDrive className="w-2.5 h-2.5" />{doc.sizeFormatted}</span>
              <span>·</span>
              <span className="uppercase">{doc.type}</span>
            </div>
          </div>
        </div>

        {/* Share URL + actions rapides */}
        {shareUrl ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-foreground/50">Lien de partage</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  readOnly
                  value={shareUrl}
                  className="text-xs font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  onClick={handleCopy}
                  variant={copied ? "default" : "outline"}
                  className={copied ? "bg-success text-success-foreground hover:bg-success/90" : ""}
                  size="icon"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Boutons de partage */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                onClick={handleWhatsApp}
                className="bg-[#25D366] hover:bg-[#25D366]/90 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              <Button onClick={handleEmail} variant="outline">
                <Mail className="w-4 h-4 mr-1" />
                <span className="text-xs">Email</span>
              </Button>
              <Button onClick={() => setShowQR(!showQR)} variant="outline">
                <QrCode className="w-4 h-4 mr-1" />
                <span className="text-xs">QR Code</span>
              </Button>
              <Button asChild variant="outline">
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  <span className="text-xs">Ouvrir</span>
                </a>
              </Button>
            </div>

            {/* QR Code */}
            {showQR && qrCodeDataUrl && (
              <div className="flex flex-col items-center p-4 bg-card border border-border rounded-lg">
                <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
                <div className="text-xs text-foreground/60 mt-2 text-center">
                  Scannez ce QR code pour ouvrir le document sur mobile
                </div>
              </div>
            )}

            {/* Permissions actuelles */}
            <div className="flex items-center gap-2 text-xs text-foreground/60 p-2 bg-muted/30 rounded-md">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Permission : {permission === "view" ? "👁️ Consultation" : permission === "edit" ? "✏️ Modification" : "🔒 Privé"}</span>
              {usePassword && <span>· 🔐 Protégé par mot de passe</span>}
              {useExpiry && <span>· ⏳ Expire dans {expiryDays}j</span>}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Permissions */}
            <div className="space-y-2">
              <Label className="text-xs text-foreground/50">Permissions d'accès</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPermission("view")}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    permission === "view" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  <Eye className="w-4 h-4 text-primary mb-1" />
                  <div className="text-xs font-medium">Consultation</div>
                  <div className="text-[10px] text-foreground/50">Lecture seule</div>
                </button>
                <button
                  onClick={() => setPermission("edit")}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    permission === "edit" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  <Pencil className="w-4 h-4 text-primary mb-1" />
                  <div className="text-xs font-medium">Modification</div>
                  <div className="text-[10px] text-foreground/50">Lecture + écriture</div>
                </button>
                <button
                  onClick={() => setPermission("private")}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    permission === "private" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  <Lock className="w-4 h-4 text-primary mb-1" />
                  <div className="text-xs font-medium">Privé</div>
                  <div className="text-[10px] text-foreground/50">Créateur uniquement</div>
                </button>
              </div>
            </div>

            {/* Options avancées */}
            <div className="space-y-3">
              {/* Mot de passe */}
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-foreground/60" />
                  <div>
                    <div className="text-sm font-medium">Protéger par mot de passe</div>
                    <div className="text-[10px] text-foreground/50">Le destinataire devra saisir un mot de passe</div>
                  </div>
                </div>
                <Switch checked={usePassword} onCheckedChange={setUsePassword} />
              </div>
              {usePassword && (
                <Input
                  type="password"
                  placeholder="Mot de passe (min. 4 caractères)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}

              {/* Expiration */}
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-foreground/60" />
                  <div>
                    <div className="text-sm font-medium">Lien à expiration</div>
                    <div className="text-[10px] text-foreground/50">Le lien expire automatiquement</div>
                  </div>
                </div>
                <Switch checked={useExpiry} onCheckedChange={setUseExpiry} />
              </div>
              {useExpiry && (
                <div className="flex gap-2">
                  {[1, 7, 30, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setExpiryDays(d)}
                      className={`flex-1 py-2 text-xs rounded-md border transition-all ${
                        expiryDays === d ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-foreground/60 hover:border-primary/40"
                      }`}
                    >
                      {d === 1 ? "24h" : `${d}j`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleCreateLink}
              disabled={creating}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
              Générer le lien de partage
            </Button>
          </div>
        )}

        {/* Liens existants */}
        {existingLinks.length > 0 && (
          <div className="border-t border-border pt-3">
            <Label className="text-xs text-foreground/50 mb-2 block">Liens existants ({existingLinks.length})</Label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto daraja-scroll">
              {existingLinks.map((l) => (
                <div key={l.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono truncate text-foreground/70">{l.url}</div>
                    <div className="text-[10px] text-foreground/50 flex items-center gap-1.5">
                      {l.permission === "view" ? "👁️" : l.permission === "edit" ? "✏️" : "🔒"} · {timeAgo(l.createdAt)}
                      {l.hasPassword && " · 🔐"}
                      {l.expiresAt && " · ⏳"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(l.url);
                      toast.success("Lien copié !");
                    }}
                    className="text-foreground/40 hover:text-primary"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
