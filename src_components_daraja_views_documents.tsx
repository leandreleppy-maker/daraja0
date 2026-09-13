// DARAJA — Documents View (grid, filters, share, sign, delete)
'use client';

import { useEffect, useState, useCallback } from "react";
import {
  FileText, Image as ImageIcon, Search, Filter, MoreVertical,
  Download, Trash2, PenLine, Share2, MessageCircle, Clock,
  Grid2x2, List, FolderInput, CheckCircle2, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api, timeAgo } from "@/lib/client";
import { toast } from "sonner";
import { ShareDialog } from "./share-dialog";

type Doc = {
  id: string;
  title: string;
  type: string;
  mimeType: string | null;
  sizeBytes: number;
  sizeFormatted: string;
  aiCategory: string | null;
  aiTags: string[];
  aiLanguage: string | null;
  aiConfidence: number | null;
  aiOcrText: string | null;
  status: string;
  signedBy: string | null;
  signedAt: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string; email: string } | null;
  folder: { id: string; name: string; color: string } | null;
};

export function DocumentsView({
  onUpload, onRefresh,
}: {
  onUpload: () => void;
  onRefresh: () => void;
}) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [localSearch, setLocalSearch] = useState("");
  const [preview, setPreview] = useState<Doc | null>(null);
  const [shareDoc, setShareDoc] = useState<Doc | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.set("type", filterType);
      if (filterStatus !== "all") params.set("status", filterStatus);
      params.set("pageSize", "50");
      const data = await api<{ items: Doc[] }>(`/api/documents?${params}`);
      setDocs(data.items);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const filtered = docs.filter((d) => {
    if (!localSearch) return true;
    const q = localSearch.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      (d.aiCategory ?? "").toLowerCase().includes(q) ||
      (d.aiTags ?? []).some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleSign = async (d: Doc) => {
    try {
      await api(`/api/documents/${d.id}`, {
        method: "PATCH",
        body: JSON.stringify({ sign: true }),
      });
      toast.success(`Document signé électroniquement par vous.`);
      load();
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (d: Doc) => {
    if (!confirm(`Supprimer définitivement « ${d.title} » ?`)) return;
    try {
      await api(`/api/documents/${d.id}`, { method: "DELETE" });
      toast.success("Document supprimé.");
      load();
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const statusBadge = (s: string, signedAt: string | null) => {
    if (s === "signed" || signedAt) return <Badge className="bg-success/15 text-success"><CheckCircle2 className="w-3 h-3 mr-1" />Signé</Badge>;
    if (s === "validated") return <Badge className="bg-success/10 text-success">Validé</Badge>;
    if (s === "ocr_done") return <Badge className="bg-primary/10 text-primary">OCR OK</Badge>;
    return <Badge variant="outline" className="text-foreground/60">{s}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary font-[family-name:var(--font-poppins)]">Documents</h1>
          <p className="text-sm text-foreground/60">{docs.length} document(s) archivé(s) dans votre coffre-fort.</p>
        </div>
        <Button onClick={onUpload} className="bg-primary hover:bg-primary/90">
          <FileText className="w-4 h-4 mr-1.5" /> Archiver
        </Button>
      </div>

      {/* Filters bar */}
      <Card className="border-border/70">
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <Input
              placeholder="Filtrer par titre, catégorie ou tag…"
              className="pl-9"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32"><Filter className="w-3.5 h-3.5 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="scan">Scans</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="uploaded">Uploadés</SelectItem>
              <SelectItem value="validated">Validés</SelectItem>
              <SelectItem value="signed">Signés</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setLayout("grid")}
              className={`p-2 ${layout === "grid" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:bg-muted"}`}
            >
              <Grid2x2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout("list")}
              className={`p-2 ${layout === "list" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:bg-muted"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
            <div className="text-foreground/60 mb-3">Aucun document trouvé.</div>
            <Button onClick={onUpload} className="bg-primary hover:bg-primary/90">
              <FileText className="w-4 h-4 mr-1.5" /> Archiver mon premier document
            </Button>
          </CardContent>
        </Card>
      ) : layout === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((d) => (
            <Card
              key={d.id}
              className="daraja-card cursor-pointer border-border/70"
              onClick={() => setPreview(d)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                    d.type === "pdf" ? "bg-primary/10 text-primary" :
                    d.type === "image" ? "bg-success/10 text-success" :
                    "bg-gold/15 text-accent-foreground"
                  }`}>
                    {d.type === "image" ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => setPreview(d)}>
                        <FileText className="w-3.5 h-3.5 mr-2" /> Aperçu
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSign(d)}>
                        <PenLine className="w-3.5 h-3.5 mr-2" /> Signer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShareDoc(d)}>
                        <Share2 className="w-3.5 h-3.5 mr-2" /> Partager
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(d)}>
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="font-medium text-sm text-foreground line-clamp-2 mb-1.5" title={d.title}>
                  {d.title}
                </div>
                <div className="text-[11px] text-foreground/50 mb-2 line-clamp-1">
                  {d.aiCategory}
                </div>
                <div className="flex items-center justify-between text-[11px] text-foreground/50 mb-2">
                  <span>{d.sizeFormatted}</span>
                  <span>{timeAgo(d.createdAt)}</span>
                </div>
                <div>{statusBadge(d.status, d.signedAt)}</div>
                {d.aiConfidence != null && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] text-foreground/50 mb-0.5">
                      <span>Confiance IA</span>
                      <span>{Math.round(d.aiConfidence * 100)}%</span>
                    </div>
                    <Progress value={d.aiConfidence * 100} className="h-1" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List view
        <Card className="border-border/70 overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/40 cursor-pointer"
                onClick={() => setPreview(d)}
              >
                <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                  d.type === "pdf" ? "bg-primary/10 text-primary" :
                  d.type === "image" ? "bg-success/10 text-success" :
                  "bg-gold/15 text-accent-foreground"
                }`}>
                  {d.type === "image" ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">{d.title}</div>
                  <div className="text-[11px] text-foreground/50 truncate">
                    {d.aiCategory} · {d.folder?.name ?? "Sans dossier"} · {timeAgo(d.createdAt)}
                  </div>
                </div>
                <div className="hidden md:block text-[11px] text-foreground/50 w-16 text-right">
                  {d.sizeFormatted}
                </div>
                <div className="w-24 text-right">
                  {statusBadge(d.status, d.signedAt)}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => setPreview(d)}>
                      <FileText className="w-3.5 h-3.5 mr-2" /> Aperçu
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSign(d)}>
                      <PenLine className="w-3.5 h-3.5 mr-2" /> Signer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShareDoc(d)}>
                      <Share2 className="w-3.5 h-3.5 mr-2" /> Partager
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(d)}>
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto daraja-scroll">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle className="text-primary flex items-start gap-2">
                  <FileText className="w-5 h-5 mt-0.5" />
                  <span className="flex-1">{preview.title}</span>
                </DialogTitle>
                <DialogDescription>{preview.aiCategory}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Aperçu visuel */}
                <div className="aspect-[4/3] bg-gradient-to-br from-muted to-card border border-border rounded-lg flex items-center justify-center">
                  {preview.type === "image" ? (
                    <ImageIcon className="w-16 h-16 text-foreground/20" />
                  ) : (
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-primary/40 mx-auto mb-2" />
                      <div className="text-xs text-foreground/50">Document PDF chiffré</div>
                      <div className="text-[10px] text-foreground/40 mt-1">Aperçu non disponible en démo</div>
                    </div>
                  )}
                </div>

                {/* Tags IA */}
                {preview.aiTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {preview.aiTags.map((t) => (
                      <Badge key={t} variant="outline" className="bg-accent/40 border-gold/20">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* OCR extrait */}
                {preview.aiOcrText && (
                  <div>
                    <div className="text-xs font-medium text-foreground/70 mb-1.5 flex items-center gap-1.5">
                      <Search className="w-3 h-3" /> Texte extrait par OCR (DARAJA Brain)
                    </div>
                    <div className="text-xs text-foreground/70 bg-muted/40 border border-border rounded-md p-3 max-h-40 overflow-y-auto daraja-scroll whitespace-pre-line font-mono">
                      {preview.aiOcrText}
                    </div>
                  </div>
                )}

                {/* Métadonnées */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="text-foreground/50">Taille</div>
                    <div className="font-medium">{preview.sizeFormatted}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-foreground/50">Type MIME</div>
                    <div className="font-medium">{preview.mimeType ?? "—"}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-foreground/50">Langue détectée</div>
                    <div className="font-medium">{preview.aiLanguage ?? "—"}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-foreground/50">Confiance IA</div>
                    <div className="font-medium text-success">
                      {preview.aiConfidence ? Math.round(preview.aiConfidence * 100) + "%" : "—"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-foreground/50">Dossier</div>
                    <div className="font-medium">
                      {preview.folder ? (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ background: preview.folder.color }} />
                          {preview.folder.name}
                        </span>
                      ) : "Sans dossier"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-foreground/50">Uploadé par</div>
                    <div className="font-medium">{preview.uploadedBy?.name ?? "—"}</div>
                  </div>
                  {preview.signedAt && (
                    <div className="space-y-1 col-span-2">
                      <div className="text-foreground/50">Signé électroniquement</div>
                      <div className="font-medium text-success flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> {preview.signedBy} · {timeAgo(preview.signedAt)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShareDoc(preview)}>
                  <Share2 className="w-4 h-4 mr-1.5" /> Partager
                </Button>
                {preview.status !== "signed" && (
                  <Button onClick={() => handleSign(preview)} className="bg-primary hover:bg-primary/90">
                    <PenLine className="w-4 h-4 mr-1.5" /> Signer
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 📤 Nouveau ShareDialog — style Google Drive */}
      <ShareDialog
        doc={shareDoc ? {
          id: shareDoc.id,
          title: shareDoc.title,
          type: shareDoc.type,
          mimeType: shareDoc.mimeType,
          sizeBytes: shareDoc.sizeBytes,
          sizeFormatted: shareDoc.sizeFormatted,
        } : null}
        open={!!shareDoc}
        onClose={() => setShareDoc(null)}
      />
    </div>
  );
}
