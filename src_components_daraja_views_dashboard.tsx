// DARAJA — Dashboard View
'use client';

import { useEffect, useState } from "react";
import {
  FileText, HardDrive, FolderTree, Users, TrendingUp,
  Brain, ShieldCheck, Activity, CheckCircle2, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
} from "recharts";
import { api, timeAgo } from "@/lib/client";
import type { SessionUser, SessionOrg } from "@/app/page";

type Dashboard = {
  totals: {
    documents: number;
    folders: number;
    members: number;
    sizeBytes: number;
    sizeFormatted: string;
    storagePct: number;
    storageTotalFormatted: string;
    avgConfidence: number;
  };
  documentsByType: { type: string; count: number }[];
  uploadsByDay: { date: string; count: number; size: number }[];
  topCategories: { name: string; count: number }[];
  recentDocuments: any[];
  recentActivity: any[];
  plan: any;
};

const TYPE_COLORS: Record<string, string> = {
  pdf: "#003366",
  image: "#00A651",
  audio: "#D4AF37",
  scan: "#7c3aed",
  autre: "#94a3b8",
};

const TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  image: "Images",
  audio: "Audio",
  scan: "Scans",
  autre: "Autres",
};

export function DashboardView({ user, org }: { user: SessionUser; org: SessionOrg | null }) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Dashboard>("/api/dashboard")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Documents",
      value: data.totals.documents,
      icon: FileText,
      color: "primary",
      hint: `${data.documentsByType.find((d) => d.type === "pdf")?.count ?? 0} PDF archivés`,
    },
    {
      label: "Espace utilisé",
      value: data.totals.sizeFormatted,
      icon: HardDrive,
      color: "gold",
      hint: `${data.totals.storagePct}% de ${data.totals.storageTotalFormatted}`,
    },
    {
      label: "Dossiers",
      value: data.totals.folders,
      icon: FolderTree,
      color: "success",
      hint: "Arborescence complète",
    },
    {
      label: "Utilisateurs",
      value: data.totals.members,
      icon: Users,
      color: "primary",
      hint: `Plan ${org?.plan?.name ?? "—"}`,
    },
  ];

  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    gold: "bg-gold/15 text-accent-foreground",
    success: "bg-success/10 text-success",
  };

  // Chart data
  const uploadsData = data.uploadsByDay.map((d) => ({
    date: new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    docs: d.count,
  }));

  const pieData = data.documentsByType.map((d) => ({
    name: TYPE_LABELS[d.type] ?? d.type,
    value: d.count,
    color: TYPE_COLORS[d.type] ?? "#94a3b8",
  }));

  const catData = data.topCategories.map((c) => ({
    name: c.name,
    value: c.count,
  }));

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <Card className="bg-gradient-to-br from-primary to-[#0a4a8a] text-primary-foreground border-0">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm text-white/70">
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mt-1">
                Bonjour, {user.name.split(" ")[0]} 👋
              </h1>
              <p className="text-white/70 mt-1">
                {org?.name} — Voici l'état de vos archives aujourd'hui.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-3 bg-white/10 rounded-lg">
                <div className="text-3xl font-bold text-gold">{data.totals.avgConfidence}%</div>
                <div className="text-[11px] text-white/70 mt-0.5">Précision IA</div>
              </div>
              <div className="text-center px-4 py-3 bg-white/10 rounded-lg">
                <div className="text-3xl font-bold">{data.totals.documents}</div>
                <div className="text-[11px] text-white/70 mt-0.5">Documents</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="daraja-card border-border/70">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-foreground/50 font-medium uppercase tracking-wide">{s.label}</div>
                  <div className="text-2xl lg:text-3xl font-bold text-foreground mt-1 font-[family-name:var(--font-poppins)]">
                    {s.value}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[s.color]}`}>
                  <s.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xs text-foreground/50 mt-2">{s.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Storage + IA */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 daraja-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary flex items-center gap-2">
              <HardDrive className="w-4 h-4" /> Espace de stockage
            </CardTitle>
            <CardDescription>
              {data.totals.sizeFormatted} utilisés sur {data.totals.storageTotalFormatted}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Progress value={data.totals.storagePct} className="h-3" />
            <div className="mt-3 flex items-center justify-between text-xs text-foreground/60">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-primary rounded-full" /> Utilisé ({data.totals.storagePct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-muted-foreground/30 rounded-full" /> Disponible ({100 - data.totals.storagePct}%)
              </span>
            </div>
            <div className="mt-4 p-3 bg-accent/30 border border-gold/20 rounded-md text-xs text-accent-foreground flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-success" />
              <div>
                <strong className="font-medium">Stockage chiffré AES-256.</strong> Hébergé sur Hostinger / LWS, sauvegarde redondante. Conforme UEMOA.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="daraja-card bg-gradient-to-br from-accent/40 to-card border-gold/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-accent-foreground flex items-center gap-2">
              <Brain className="w-4 h-4" /> DARAJA Brain
            </CardTitle>
            <CardDescription>Classification IA automatique</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold text-primary font-[family-name:var(--font-poppins)]">
              {data.totals.avgConfidence}%
            </div>
            <div className="text-xs text-foreground/60">Précision moyenne OCR</div>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">FR</span>
                <Badge className="bg-success/15 text-success">98%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">EN</span>
                <Badge className="bg-success/15 text-success">96%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">Bambara</span>
                <Badge className="bg-gold/15 text-accent-foreground">87%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">Wolof</span>
                <Badge className="bg-gold/15 text-accent-foreground">85%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Uploads 14j */}
        <Card className="lg:col-span-2 daraja-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Activité d'archivage (14 jours)
            </CardTitle>
            <CardDescription>Documents ajoutés par jour</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={uploadsData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="uploadsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#003366" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#003366" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#003366",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Area type="monotone" dataKey="docs" stroke="#003366" strokeWidth={2} fill="url(#uploadsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie by type */}
        <Card className="daraja-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary flex items-center gap-2">
              <FileText className="w-4 h-4" /> Par type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#003366",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
              {pieData.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-foreground/70">{p.name} ({p.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top categories + Recent docs */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="daraja-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary flex items-center gap-2">
              <FolderTree className="w-4 h-4" /> Top catégories IA
            </CardTitle>
            <CardDescription>Répartition automatique par DARAJA Brain</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#003366",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "#00336610" }}
                />
                <Bar dataKey="value" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="daraja-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary flex items-center gap-2">
              <Clock className="w-4 h-4" /> Derniers ajouts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border max-h-[260px] overflow-y-auto daraja-scroll">
              {data.recentDocuments.length === 0 ? (
                <div className="p-6 text-center text-sm text-foreground/50">
                  Aucun document récent. Commencez par archiver.
                </div>
              ) : (
                data.recentDocuments.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 p-3 hover:bg-muted/40">
                    <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                      d.type === "pdf" ? "bg-primary/10 text-primary" :
                      d.type === "image" ? "bg-success/10 text-success" :
                      "bg-gold/15 text-accent-foreground"
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{d.title}</div>
                      <div className="text-[11px] text-foreground/50 truncate">
                        {d.aiCategory} · {timeAgo(d.createdAt)}
                      </div>
                    </div>
                    {d.status === "signed" ? (
                      <Badge className="bg-success/15 text-success"><CheckCircle2 className="w-3 h-3 mr-1" />Signé</Badge>
                    ) : d.status === "validated" ? (
                      <Badge className="bg-success/10 text-success">Validé</Badge>
                    ) : (
                      <Badge variant="outline" className="text-foreground/60">{d.status}</Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity log */}
      <Card className="daraja-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-primary flex items-center gap-2">
            <Activity className="w-4 h-4" /> Journal d'activité (audit)
          </CardTitle>
          <CardDescription>Conformité UEMOA — traçabilité complète</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border max-h-72 overflow-y-auto daraja-scroll">
            {data.recentActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                    {(a.user?.name ?? "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-sm">
                  <span className="font-medium text-foreground">{a.user?.name ?? "Système"}</span>{" "}
                  <span className="text-foreground/60">
                    {ACTION_LABELS[a.action] ?? a.action}
                  </span>
                </div>
                <div className="text-[11px] text-foreground/50 shrink-0">{timeAgo(a.createdAt)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  login: "s'est connecté",
  upload: "a archivé un document",
  download: "a téléchargé un document",
  delete: "a supprimé un document",
  rename: "a renommé un élément",
  share: "a partagé un document",
  sign: "a signé un document",
  settings: "a modifié les paramètres",
};
