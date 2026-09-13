// DARAJA — App Shell (sidebar + topbar + main area)
'use client';

import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard, FolderTree, FileText, Settings, LogOut,
  Search, Bell, Plus, Menu, X, Shield, ChevronDown, MessageCircle,
  Share2,
} from "lucide-react";
import { DarajaLogo } from "./logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SessionUser, SessionOrg } from "@/app/page";
import { DashboardView } from "./views/dashboard";
import { DocumentsView } from "./views/documents";
import { FoldersView } from "./views/folders";
import { SettingsView } from "./views/settings";
import { SearchResults } from "./views/search-results";
import { UploadDialog } from "./views/upload-dialog";
import { SuperAdminView, AdminUnlockModal } from "./views/super-admin";
import { SharedLinksView } from "./views/shared-links";

type View = "dashboard" | "documents" | "folders" | "settings" | "platform" | "shared";

// ⚠️ La vue "platform" est cachée — accessible uniquement via code secret
const NAV: { id: View; label: string; icon: any }[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "folders", label: "Dossiers", icon: FolderTree },
  { id: "shared", label: "Liens partagés", icon: Share2 },
  { id: "settings", label: "Paramètres", icon: Settings },
];

export function DarajaAppShell({
  user, org, onLogout, onOrgChange,
}: {
  user: SessionUser;
  org: SessionOrg | null;
  onLogout: () => void;
  onOrgChange: () => void;
}) {
  const [view, setView] = useState<View>("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 🔒 Console propriétaire — verrouillée par code secret
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminSecretCode, setAdminSecretCode] = useState("");

  // Recherche live : on ouvre le dropdown si l'utilisateur tape ou focus le champ
  const searchOpen = searchFocused && search.trim().length > 0 && !search.startsWith("admin:");

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // 🔒 Raccourci clavier caché : Ctrl + Shift + Alt + D
  // Ouvre la modal de déverrouillage de la console propriétaire
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.altKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        if (adminUnlocked) {
          setView("platform");
        } else {
          setAdminModalOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [adminUnlocked]);

  // 🔒 Commande secrète dans la barre de recherche : "admin:CODE"
  // Si l'utilisateur tape admin:847825, déverrouille automatiquement
  useEffect(() => {
    const match = search.match(/^admin:(.+)$/i);
    if (match) {
      const code = match[1].trim();
      // Vérification via API
      fetch("/api/admin/stats", { headers: { "x-daraja-admin-code": code } })
        .then((r) => {
          if (r.ok) {
            setAdminSecretCode(code);
            setAdminUnlocked(true);
            setView("platform");
            toast.success("Console propriétaire déverrouillée.");
          } else {
            toast.error("Code secret incorrect.");
          }
        })
        .catch(() => toast.error("Erreur réseau."))
        .finally(() => setSearch(""));
    }
  }, [search]);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel: Record<string, string> = {
    admin: "Administrateur",
    manager: "Manager",
    employe: "Employé",
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* SIDEBAR (desktop) */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar text-sidebar-foreground sticky top-0 h-screen">
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
          <DarajaLogo size={32} variant="white" />
        </div>

        <div className="px-3 py-4 border-b border-sidebar-border">
          <div className="text-[10px] uppercase tracking-wide text-white/50 px-2 mb-1.5">Organisation</div>
          <div className="px-2 py-1.5 rounded-md hover:bg-sidebar-accent/50 cursor-default">
            <div className="text-sm font-medium text-white truncate">{org?.name ?? "—"}</div>
            <div className="text-[11px] text-white/60 capitalize">{org?.type ?? "—"}</div>
          </div>
          {org?.plan && (
            <div className="mt-2 px-2">
              <Badge className="bg-gold/20 text-gold border-gold/30 hover:bg-gold/30">
                <Shield className="w-3 h-3 mr-1" /> Plan {org.plan.name}
              </Badge>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => { setView(n.id); setMobileNav(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                view === n.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white",
              )}
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <Button
            className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
            onClick={() => setUploadOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" /> Archiver un document
          </Button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:text-white"
          >
            <LogOut className="w-3.5 h-3.5" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR (Sheet) */}
      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-72 bg-sidebar text-sidebar-foreground border-sidebar-border p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
            <DarajaLogo size={32} variant="white" />
          </div>
          <div className="px-3 py-4 border-b border-sidebar-border">
            <div className="text-[10px] uppercase tracking-wide text-white/50 px-2 mb-1.5">Organisation</div>
            <div className="px-2 py-1.5">
              <div className="text-sm font-medium text-white truncate">{org?.name ?? "—"}</div>
              <div className="text-[11px] text-white/60 capitalize">{org?.type ?? "—"}</div>
            </div>
            {org?.plan && (
              <div className="mt-2 px-2">
                <Badge className="bg-gold/20 text-gold border-gold/30">
                  <Shield className="w-3 h-3 mr-1" /> {org.plan.name}
                </Badge>
              </div>
            )}
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => { setView(n.id); setMobileNav(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  view === n.id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white",
                )}
              >
                <n.icon className="w-4 h-4" />
                {n.label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-sidebar-border space-y-2">
            <Button
              className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => { setUploadOpen(true); setMobileNav(false); }}
            >
              <Plus className="w-4 h-4 mr-1" /> Archiver
            </Button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:text-white"
            >
              <LogOut className="w-3.5 h-3.5" /> Déconnexion
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR */}
        <header className="h-16 sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border flex items-center px-4 lg:px-6 gap-3">
          {/* Mobile menu button */}
          <Sheet open={mobileNav} onOpenChange={setMobileNav}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
          </Sheet>

          {/* Logo mobile */}
          <div className="lg:hidden">
            <DarajaLogo size={28} showText={false} />
          </div>

          {/* Search */}
          <div className="flex-1 max-w-2xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <Input
              placeholder="Rechercher un document (ex: Contrat Marché Public 2024)…"
              className="pl-9 pr-3 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
            {searchOpen && (
              <SearchResults
                query={search}
                onClose={() => { setSearch(""); }}
                onPicked={() => { setView("documents"); refresh(); }}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => setUploadOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" /> Archiver
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-success rounded-full ring-2 ring-background" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start gap-0.5">
                  <div className="text-sm font-medium">Document à signer</div>
                  <div className="text-xs text-foreground/60">Contrat SOTACI 2024 — en attente</div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-0.5">
                  <div className="text-sm font-medium">Upload terminé</div>
                  <div className="text-xs text-foreground/60">Facture CIE Octobre 2026 archivée</div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-foreground/60 justify-center">
                  <MessageCircle className="w-3 h-3 mr-1.5" /> Alertes WhatsApp activées
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-muted">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-foreground/50 leading-tight">
                      {roleLabel[user.role]}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-foreground/50 hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-foreground/60 font-normal">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setView("settings")}>
                  <Settings className="w-4 h-4 mr-2" /> Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto daraja-scroll">
          {view === "dashboard" && <DashboardView key={refreshKey} user={user} org={org} />}
          {view === "documents" && (
            <DocumentsView key={refreshKey} onUpload={() => setUploadOpen(true)} onRefresh={refresh} />
          )}
          {view === "folders" && <FoldersView key={refreshKey} />}
          {view === "shared" && <SharedLinksView key={refreshKey} />}
          {view === "settings" && (
            <SettingsView key={refreshKey} user={user} org={org} onOrgChange={onOrgChange} />
          )}
          {view === "platform" && adminUnlocked && (
            <SuperAdminView
              key={refreshKey}
              secretCode={adminSecretCode}
              onLock={() => {
                setAdminUnlocked(false);
                setAdminSecretCode("");
                setView("dashboard");
              }}
            />
          )}
        </main>
      </div>

      {/* Upload Dialog (scanner) */}
      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => { refresh(); }}
      />

      {/* 🔒 Modal de déverrouillage console propriétaire */}
      <AdminUnlockModal
        open={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onUnlock={(code) => {
          setAdminSecretCode(code);
          setAdminUnlocked(true);
          setAdminModalOpen(false);
          setView("platform");
        }}
      />
    </div>
  );
}
