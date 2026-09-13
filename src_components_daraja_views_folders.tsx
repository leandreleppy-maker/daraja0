// DARAJA — Folders View (tree, create, rename, move)
'use client';

import { useEffect, useState, useCallback } from "react";
// Note: useEffect utilisé pour le chargement initial via load()
import {
  FolderPlus, Folder, FolderOpen, MoreVertical, Pencil, Trash2,
  ChevronRight, ChevronDown, FileText, Plus, ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, timeAgo } from "@/lib/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FolderItem = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  parentId: string | null;
  createdAt: string;
  _count: { documents: number; children: number };
};

type TreeNode = FolderItem & { children: TreeNode[] };

type Doc = {
  id: string;
  title: string;
  type: string;
  sizeFormatted: string;
  aiCategory: string | null;
  createdAt: string;
  folder: { id: string; name: string; color: string } | null;
};

const FOLDER_COLORS = ["#003366", "#D4AF37", "#00A651", "#7c3aed", "#ed8936", "#0ea5e9"];

export function FoldersView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createParent, setCreateParent] = useState<string | null>(null);
  const [renameFolder, setRenameFolder] = useState<FolderItem | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fd, dd] = await Promise.all([
        api<{ folders: FolderItem[] }>("/api/folders"),
        api<{ items: Doc[] }>("/api/documents?pageSize=50"),
      ]);
      setFolders(fd.folders);
      setDocs(dd.items);
      // Auto-expand top-level
      setExpanded((prev) => {
        const next = { ...prev };
        fd.folders.filter((f) => !f.parentId).forEach((f) => {
          if (next[f.id] === undefined) next[f.id] = true;
        });
        return next;
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build tree
  const buildTree = (parentId: string | null): TreeNode[] => {
    return folders
      .filter((f) => f.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((f) => ({ ...f, children: buildTree(f.id) }));
  };
  const tree = buildTree(null);

  const folderDocs = selectedFolder
    ? docs.filter((d) => d.folder?.id === selectedFolder)
    : docs.filter((d) => !d.folder);

  const handleCreate = async (name: string, color: string, parentId: string | null) => {
    try {
      await api("/api/folders", {
        method: "POST",
        body: JSON.stringify({ name, color, parentId, icon: "Folder" }),
      });
      toast.success("Dossier créé.");
      setCreateOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRename = async (folder: FolderItem, name: string, color: string) => {
    try {
      await api(`/api/folders/${folder.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, color }),
      });
      toast.success("Dossier renommé.");
      setRenameFolder(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (folder: FolderItem) => {
    if (!confirm(`Supprimer le dossier « ${folder.name} » ? Les documents seront déplacés à la racine.`)) return;
    try {
      await api(`/api/folders/${folder.id}`, { method: "DELETE" });
      toast.success("Dossier supprimé.");
      if (selectedFolder === folder.id) setSelectedFolder(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Drag-drop de document vers un dossier
  const handleDrop = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolder(null);
    const docId = e.dataTransfer.getData("text/docId");
    if (!docId) return;
    try {
      await api(`/api/documents/${docId}`, {
        method: "PATCH",
        body: JSON.stringify({ folderId }),
      });
      toast.success("Document déplacé.");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = expanded[node.id] !== false;
      const isSelected = selectedFolder === node.id;
      const isDragOver = dragOverFolder === node.id;
      return (
        <div key={node.id}>
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer group transition-colors",
              isSelected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted",
              isDragOver && "ring-2 ring-gold bg-gold/10",
            )}
            style={{ paddingLeft: depth * 14 + 8 }}
            draggable
            onDragOver={(e) => { e.preventDefault(); setDragOverFolder(node.id); }}
            onDragLeave={() => setDragOverFolder(null)}
            onDrop={(e) => handleDrop(e, node.id)}
            onClick={() => {
              setSelectedFolder(node.id);
              setExpanded((p) => ({ ...p, [node.id]: !isExpanded }));
            }}
          >
            {node.children.length > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((p) => ({ ...p, [node.id]: !isExpanded }));
                }}
                className="text-foreground/50 hover:text-foreground"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-3.5" />
            )}
            {isExpanded && node.children.length > 0 ? (
              <FolderOpen className="w-4 h-4 shrink-0" style={{ color: node.color ?? "#003366" }} />
            ) : (
              <Folder className="w-4 h-4 shrink-0" style={{ color: node.color ?? "#003366" }} />
            )}
            <span className="text-sm font-medium text-foreground flex-1 truncate">{node.name}</span>
            <span className="text-[10px] text-foreground/40">{node._count.documents}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost" size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => { setCreateParent(node.id); setCreateOpen(true); }}>
                  <Plus className="w-3.5 h-3.5 mr-2" /> Sous-dossier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRenameFolder(node)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" /> Renommer
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(node)}>
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {isExpanded && node.children.length > 0 && renderTree(node.children, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary font-[family-name:var(--font-poppins)]">Dossiers</h1>
          <p className="text-sm text-foreground/60">
            Arborescence · {folders.length} dossier(s) · {docs.length} document(s)
          </p>
        </div>
        <Button
          onClick={() => { setCreateParent(null); setCreateOpen(true); }}
          className="bg-primary hover:bg-primary/90"
        >
          <FolderPlus className="w-4 h-4 mr-1.5" /> Nouveau dossier
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Tree */}
        <Card className="lg:col-span-1 border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary flex items-center gap-2">
              <FolderOpen className="w-4 h-4" /> Arborescence
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-7" />)}
              </div>
            ) : (
              <div className="space-y-0.5 max-h-[500px] overflow-y-auto daraja-scroll">
                {/* Racine */}
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted",
                    !selectedFolder && "bg-primary/10 ring-1 ring-primary/30",
                  )}
                  onDragOver={(e) => { e.preventDefault(); setDragOverFolder("__root__"); }}
                  onDragLeave={() => setDragOverFolder(null)}
                  onDrop={(e) => handleDrop(e, null)}
                >
                  <Folder className="w-4 h-4 text-foreground/60" />
                  <span className="text-sm font-medium text-foreground/70 flex-1">Racine (sans dossier)</span>
                  <span className="text-[10px] text-foreground/40">
                    {docs.filter((d) => !d.folder).length}
                  </span>
                </div>
                {renderTree(tree)}
              </div>
            )}
            <div className="mt-3 text-[11px] text-foreground/50 bg-muted/40 p-2 rounded-md">
              💡 Astuce : glissez un document depuis la liste vers un dossier pour le déplacer.
            </div>
          </CardContent>
        </Card>

        {/* Contenu du dossier sélectionné */}
        <Card className="lg:col-span-2 border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary flex items-center gap-2">
              {selectedFolder ? (
                <>
                  <FolderOpen className="w-4 h-4" />
                  {folders.find((f) => f.id === selectedFolder)?.name ?? "Dossier"}
                </>
              ) : (
                <>
                  <Folder className="w-4 h-4" /> Racine — documents non classés
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto daraja-scroll">
              {folderDocs.length === 0 ? (
                <div className="p-8 text-center text-sm text-foreground/50">
                  <Folder className="w-10 h-10 text-foreground/20 mx-auto mb-2" />
                  Aucun document dans ce dossier.
                </div>
              ) : (
                folderDocs.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/40 cursor-move"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/docId", d.id)}
                  >
                    <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                      d.type === "pdf" ? "bg-primary/10 text-primary" :
                      d.type === "image" ? "bg-success/10 text-success" :
                      "bg-gold/15 text-accent-foreground"
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">{d.title}</div>
                      <div className="text-[11px] text-foreground/50 truncate">
                        {d.aiCategory} · {d.sizeFormatted} · {timeAgo(d.createdAt)}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-foreground/60 text-[10px]">
                      {d.type.toUpperCase()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create dialog */}
      <CreateFolderDialog
        open={createOpen}
        parentName={createParent ? folders.find((f) => f.id === createParent)?.name : null}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        initialParentId={createParent}
      />

      {/* Rename dialog */}
      <RenameFolderDialog
        folder={renameFolder}
        onClose={() => setRenameFolder(null)}
        onRename={handleRename}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Dialogs
// ─────────────────────────────────────────────
function CreateFolderDialog({
  open, parentName, onClose, onCreate, initialParentId,
}: {
  open: boolean;
  parentName: string | null;
  onClose: () => void;
  onCreate: (name: string, color: string, parentId: string | null) => void;
  initialParentId: string | null;
}) {
  if (!open) return null;
  return (
    <CreateFolderDialogInner
      key="create-open"
      parentName={parentName}
      initialParentId={initialParentId}
      onClose={onClose}
      onCreate={onCreate}
    />
  );
}

function CreateFolderDialogInner({
  parentName, onClose, onCreate, initialParentId,
}: {
  parentName: string | null;
  onClose: () => void;
  onCreate: (name: string, color: string, parentId: string | null) => void;
  initialParentId: string | null;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(FOLDER_COLORS[0]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2">
            <FolderPlus className="w-5 h-5" /> Nouveau dossier
          </DialogTitle>
          <DialogDescription>
            {parentName ? `Sous-dossier de : ${parentName}` : "Dossier racine"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="fname">Nom du dossier</Label>
            <Input
              id="fname" autoFocus
              placeholder="Ex: Factures 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name && onCreate(name, color, initialParentId)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-md ring-2 transition-all",
                    color === c ? "ring-foreground scale-110" : "ring-transparent hover:scale-105",
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            disabled={!name.trim()}
            onClick={() => onCreate(name.trim(), color, initialParentId)}
            className="bg-primary hover:bg-primary/90"
          >
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RenameFolderDialog({
  folder, onClose, onRename,
}: {
  folder: FolderItem | null;
  onClose: () => void;
  onRename: (folder: FolderItem, name: string, color: string) => void;
}) {
  if (!folder) return null;
  return (
    <RenameFolderDialogInner
      key={folder.id}
      folder={folder}
      onClose={onClose}
      onRename={onRename}
    />
  );
}

function RenameFolderDialogInner({
  folder, onClose, onRename,
}: {
  folder: FolderItem;
  onClose: () => void;
  onRename: (folder: FolderItem, name: string, color: string) => void;
}) {
  const [name, setName] = useState(folder.name);
  const [color, setColor] = useState(folder.color ?? FOLDER_COLORS[0]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2">
            <Pencil className="w-5 h-5" /> Renommer le dossier
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="rname">Nom</Label>
            <Input
              id="rname" autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name && onRename(folder, name, color)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-md ring-2 transition-all",
                    color === c ? "ring-foreground scale-110" : "ring-transparent hover:scale-105",
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            disabled={!name.trim()}
            onClick={() => onRename(folder, name.trim(), color)}
            className="bg-primary hover:bg-primary/90"
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
