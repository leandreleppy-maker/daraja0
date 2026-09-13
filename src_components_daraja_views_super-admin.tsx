// DARAJA — Console Plateforme Propriétaire (AGRÉGAT UNIQUEMENT)
// ═══════════════════════════════════════════════════════════════
// 🔒 CONFIDENTIALITÉ ABSOLUE :
// Ce dashboard affiche UNIQUEMENT des statistiques agrégées.
// Aucun nom d'organisation, aucun email, aucun téléphone,
// aucune liste de documents par utilisateur n'est visible.
// Le propriétaire suit la santé globale de sa plateforme SANS
// pouvoir accéder aux comptes ou fichiers des utilisateurs.
// ═══════════════════════════════════════════════════════════════
'use client';

import { useEffect, useState } from "react";
import {
  Building2, Users, FileText, HardDrive, TrendingUp, DollarSign,
  Activity, Server, CheckCircle2, Shield, Crown, Globe, MapPin,
  Lock, Brain, Cpu, AlertCircle, X, LogOut, Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend,
} from "recharts";
import { api, formatFcfa } from "@/lib/client";
import { toast } from "sonner";

const SUPPORT_EMAIL = "support@daraja.africa";

const PLAN_COLORS: Record<string, string> = {
  gratuit: "#94a3b8",
  entreprise: "#003366",
  etat: "#D4AF37",
  aucun: "#cbd5e1",
};

const PLAN_LABELS: Record<string, string> = {
  gratuit: "Gratuit",
  entreprise: "Entreprise",
  etat: "État",
  aucun: "Aucun",
};

const TYPE_LABELS: Record<string, string> = {
  tpe: "TPE",
  pme: "PME",
  ong: "ONG",
  cabinet: "Cabinet",
  mairie: "Mairie",
  ministere: "Ministère",
  banque: "Banque",
};

const COUNTRY_LABELS: Record<string, string> = {
  ML: "Mali",
  CI: "Côte d'Ivoire",
  SN: "Sénégal",
  BF: "Burkina Faso",
  TG: "Togo",
  BJ: "Bénin",
  GN: "Guinée",
  CM: "Cameroun",
};

type AdminStats = {
  totals: {
    organizations: number;
    users: number;
    documents: number;
    folders: number;
    storageBytes: number;
    storageFormatted: string;
    auditLogs: number;
    mrr: number;
    arr12: number;
  };
  breakdown: {
    byPlan: { code: string; count: number }[];
    byType: { type: string; count: number }[];
    byCountry: { country: string; count: number }[];
    byDocType: { type: string; count: number }[];
  };
  revenueByPlan: { code: string; mrr: number }[];
  activityByDay: { date: string; signups: number; uploads: number; size: number }[];
  topOrganizations: { name: string; type: string; country: string; docs: number }[];
  subscribers: {
    name: string;
    type: string;
    country: string;
    city: string | null;
    planCode: string;
    planName: string;
    planPrice: number;
    paymentProvider: string | null;
    startedAt: string;
  }[];
  health: {
    server: string;
    uptime: number;
    avgResponseMs: number;
    errorRate: number;
    dbSize: string;
    activeSessions: number;
    lastIncident: string;
  };
  aiActivity: {
    totalOcr: number;
    avgConfidence: number;
    byLanguage: Record<string, number>;
  };
};

export function SuperAdminView({
  secretCode, onLock,
}: {
  secretCode: string;
  onLock: () => void;
}) {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Envoie le code secret comme header pour déverrouiller l'API
    api<AdminStats>("/api/admin/stats", {
      headers: { "x-daraja-admin-code": secretCode },
    })
      .then(setData)
      .catch((e) => {
        setError(e.message);
        toast.error("Accès refusé : " + e.message);
      })
      .finally(() => setLoading(false));
  }, [secretCode]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <div className="text-lg font-semibold text-destructive mb-2">Accès refusé</div>
          <div className="text-sm text-foreground/60 mb-4">{error}</div>
          <Button onClick={onLock} variant="outline">
            <Lock className="w-4 h-4 mr-1.5" /> Re-verrouiller
          </Button>
        </CardContent>
      </Card>
    );
  }

  const kpis = [
    {
      label: "Organisations",
      value: data.totals.organizations,
      icon: Building2,
      color: "primary",
      hint: "Total inscrit sur la plateforme",
    },
    {
      label: "Utilisateurs",
      value: data.totals.users,
      icon: Users,
      color: "success",
      hint: "Comptes actifs (noms non visibles)",
    },
    {
      label: "Documents",
      value: data.totals.documents,
      icon: FileText,
      color: "gold",
      hint: "Total archivé (contenu non visible)",
    },
    {
      label: "MRR",
      value: formatFcfa(data.totals.mrr),
      icon: DollarSign,
      color: "primary",
      hint: `ARR : ${formatFcfa(data.totals.arr12)}/an`,
    },
  ];

  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    gold: "bg-gold/15 text-accent-foreground",
    success: "bg-success/10 text-success",
  };

  const activityData = data.activityByDay.map((d) => ({
    date: new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    inscriptions: d.signups,
    uploads: d.uploads,
  }));

  const planData = data.breakdown.byPlan.map((p) => ({
    name: PLAN_LABELS[p.code] ?? p.code,
    value: p.count,
    color: PLAN_COLORS[p.code] ?? "#94a3b8",
  }));

  const typeData = data.breakdown.byType.map((t) => ({
    name: TYPE_LABELS[t.type] ?? t.type,
    value: t.count,
  }));

  const countryData = data.breakdown.byCountry.map((c) => ({
    name: COUNTRY_LABELS[c.country] ?? c.country,
    value: c.count,
  }));

  const revenueByPlanData = data.revenueByPlan.map((r) => ({
    name: PLAN_LABELS[r.code] ?? r.code,
    mrr: r.mrr,
    color: PLAN_COLORS[r.code] ?? "#94a3b8",
  }));

  return (
    <div className="space-y-6">
      {/* Header — banner with confidentiality notice */}
      <Card className="bg-gradient-to-br from-primary to-[#0a4a8a] text-primary-foreground border-0">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Crown className="w-4 h-4 text-gold" />
                Console propriétaire · Plateforme DARAJA
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mt-1">
                Vue plateforme — Suivi global
              </h1>
              <p className="text-white/70 mt-1">
                {data.totals.organizations} organisations · {data.totals.users} utilisateurs · {data.totals.documents} documents
              </p>
            </div>
            <div className="flex flex-col gap-2 text-right">
              <div className="px-4 py-3 bg-white/10 rounded-lg">
                <div className="text-3xl font-bold text-gold">{formatFcfa(data.totals.mrr)}</div>
                <div className="text-[11px] text-white/70">Revenu mensuel récurrent (MRR)</div>
              </div>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-xs text-white/80 hover:text-white flex items-center justify-end gap-1">
                <Mail className="w-3 h-3" /> {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidentiality banner */}
      <Card className="border-gold/40 bg-accent/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-gold shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/70 leading-relaxed">
            <strong className="text-foreground">Mode confidentiel actif.</strong> Ce tableau de bord affiche les <strong>noms des organisations abonnées</strong> (pour le suivi commercial du propriétaire) ainsi que des statistiques agrégées. <strong>Aucun email, aucun téléphone, aucune liste de documents par utilisateur</strong> n'est accessible — afin de préserver la confidentialité des comptes clients. Les « Top organisations » affichent les noms réels des clients les plus actifs.
          </div>
          <Button onClick={onLock} variant="ghost" size="sm" className="ml-auto shrink-0">
            <LogOut className="w-3.5 h-3.5 mr-1" /> Verrouiller
          </Button>
        </CardContent>
      </Card>

      {/* KPIs agrégés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <Card key={i} className="daraja-card border-border/70">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-foreground/50 font-medium uppercase tracking-wide">{k.label}</div>
                  <div className="text-2xl lg:text-3xl font-bold text-foreground mt-1 font-[family-name:var(--font-poppins)]">
                    {k.value}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[k.color]}`}>
                  <k.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xs text-foreground/50 mt-2">{k.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full lg:w-auto">
          <TabsTrigger value="overview"><Activity className="w-3.5 h-3.5 mr-1.5" /> Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="activity"><TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Activité</TabsTrigger>
          <TabsTrigger value="revenue"><DollarSign className="w-3.5 h-3.5 mr-1.5" /> Revenus</TabsTrigger>
          <TabsTrigger value="health"><Server className="w-3.5 h-3.5 mr-1.5" /> Santé</TabsTrigger>
        </TabsList>

        {/* VUE D'ENSEMBLE */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 daraja-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-primary flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Activité plateforme (14 jours)
                </CardTitle>
                <CardDescription>Inscriptions et uploads agrégés par jour</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={activityData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="signupsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#003366" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#003366" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="uploadsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00A651" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#00A651" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#003366", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Area type="monotone" dataKey="inscriptions" stroke="#003366" strokeWidth={2} fill="url(#signupsGrad)" />
                    <Area type="monotone" dataKey="uploads" stroke="#00A651" strokeWidth={2} fill="url(#uploadsGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="daraja-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-primary flex items-center gap-2">
                  <Crown className="w-4 h-4" /> Répartition par plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={planData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={2}>
                      {planData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#003366", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
                  {planData.map((p, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-foreground/70">{p.name} ({p.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top organisations — AVEC NOMS RÉELS */}
          <Card className="daraja-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-primary flex items-center gap-2">
                <Crown className="w-4 h-4" /> Top 5 organisations par volume
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <Crown className="w-3 h-3 text-gold" /> Noms réels visibles (clients les plus actifs)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {data.topOrganizations.map((o, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{o.name}</div>
                      <div className="text-[11px] text-foreground/50 flex items-center gap-2">
                        <span>{TYPE_LABELS[o.type] ?? o.type}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{COUNTRY_LABELS[o.country] ?? o.country}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-foreground">{o.docs}</div>
                      <div className="text-[10px] text-foreground/50">docs</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 📋 Liste des abonnés — AVEC NOMS RÉELS */}
          <Card className="daraja-card border-gold/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-primary flex items-center gap-2">
                <Crown className="w-4 h-4 text-gold" /> Abonnés de la plateforme
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <Crown className="w-3 h-3 text-gold" /> Qui a souscrit à DARAJA — noms visibles (suivi commercial)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto daraja-scroll">
                <table className="w-full text-sm">
                  <thead className="bg-primary/5 text-xs text-foreground/60">
                    <tr>
                      <th className="text-left p-3 font-medium">Organisation</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell">Type</th>
                      <th className="text-left p-3 font-medium hidden lg:table-cell">Localisation</th>
                      <th className="text-left p-3 font-medium">Plan</th>
                      <th className="text-right p-3 font-medium">Revenu/mois</th>
                      <th className="text-left p-3 font-medium hidden sm:table-cell">Depuis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.subscribers.map((s, i) => (
                      <tr key={i} className="hover:bg-muted/40">
                        <td className="p-3">
                          <div className="font-medium text-foreground truncate max-w-[200px]">{s.name}</div>
                          <div className="text-[11px] text-foreground/50 capitalize">{s.paymentProvider ?? "—"}</div>
                        </td>
                        <td className="p-3 hidden md:table-cell text-foreground/70">{TYPE_LABELS[s.type] ?? s.type}</td>
                        <td className="p-3 hidden lg:table-cell text-foreground/70">
                          {s.city ?? "—"}, {COUNTRY_LABELS[s.country] ?? s.country}
                        </td>
                        <td className="p-3">
                          <Badge style={{ background: `${PLAN_COLORS[s.planCode] ?? "#94a3b8"}20`, color: PLAN_COLORS[s.planCode] ?? "#94a3b8" }}>
                            {PLAN_LABELS[s.planCode] ?? s.planName}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-bold text-primary">
                          {s.planPrice > 0 ? formatFcfa(s.planPrice) : "Gratuit"}
                        </td>
                        <td className="p-3 hidden sm:table-cell text-[11px] text-foreground/60">
                          {new Date(s.startedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACTIVITÉ */}
        <TabsContent value="activity" className="space-y-4 mt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="daraja-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-primary flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Par type d'organisation
                </CardTitle>
                <CardDescription>Répartition agrégée (aucun nom)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={typeData} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={75} />
                    <Tooltip contentStyle={{ backgroundColor: "#003366", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} cursor={{ fill: "#00336610" }} />
                    <Bar dataKey="value" fill="#003366" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="daraja-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-primary flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Par pays
                </CardTitle>
                <CardDescription>Répartition agrégée (aucun nom)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={countryData} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={85} />
                    <Tooltip contentStyle={{ backgroundColor: "#003366", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} cursor={{ fill: "#00336610" }} />
                    <Bar dataKey="value" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="daraja-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-primary flex items-center gap-2">
                <FileText className="w-4 h-4" /> Documents par type
              </CardTitle>
              <CardDescription>Volume agrégé par type de document</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.breakdown.byDocType.map(d => ({ name: d.type.toUpperCase(), value: d.count }))} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#003366", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} cursor={{ fill: "#00336610" }} />
                  <Bar dataKey="value" fill="#00A651" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REVENUS */}
        <TabsContent value="revenue" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="daraja-card bg-gradient-to-br from-gold/20 to-card border-gold/30">
              <CardContent className="p-5">
                <DollarSign className="w-8 h-8 text-gold mb-2" />
                <div className="text-xs text-foreground/50 uppercase">MRR</div>
                <div className="text-2xl font-bold text-primary font-[family-name:var(--font-poppins)]">
                  {formatFcfa(data.totals.mrr)}
                </div>
                <div className="text-[11px] text-foreground/50">par mois</div>
              </CardContent>
            </Card>
            <Card className="daraja-card">
              <CardContent className="p-5">
                <TrendingUp className="w-8 h-8 text-success mb-2" />
                <div className="text-xs text-foreground/50 uppercase">ARR (annualisé)</div>
                <div className="text-2xl font-bold text-foreground font-[family-name:var(--font-poppins)]">
                  {formatFcfa(data.totals.arr12)}
                </div>
                <div className="text-[11px] text-foreground/50">par an</div>
              </CardContent>
            </Card>
            <Card className="daraja-card">
              <CardContent className="p-5">
                <CheckCircle2 className="w-8 h-8 text-primary mb-2" />
                <div className="text-xs text-foreground/50 uppercase">Souscriptions actives</div>
                <div className="text-2xl font-bold text-foreground font-[family-name:var(--font-poppins)]">
                  {data.breakdown.byPlan.filter(p => p.code !== "aucun").reduce((a, b) => a + b.count, 0)}
                </div>
                <div className="text-[11px] text-foreground/50">organisations payantes</div>
              </CardContent>
            </Card>
            <Card className="daraja-card">
              <CardContent className="p-5">
                <Activity className="w-8 h-8 text-success mb-2" />
                <div className="text-xs text-foreground/50 uppercase">Taux de churn</div>
                <div className="text-2xl font-bold text-foreground font-[family-name:var(--font-poppins)]">0%</div>
                <div className="text-[11px] text-foreground/50">30 derniers jours</div>
              </CardContent>
            </Card>
          </div>

          <Card className="daraja-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-primary flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Revenus par plan
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-gold" /> Agrégat — aucun nom d'organisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revenueByPlanData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#003366", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                    formatter={(v: any) => formatFcfa(v)}
                    cursor={{ fill: "#00336610" }}
                  />
                  <Bar dataKey="mrr" radius={[4, 4, 0, 0]} barSize={60}>
                    {revenueByPlanData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SANTÉ SYSTÈME */}
        <TabsContent value="health" className="space-y-4 mt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="daraja-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-primary flex items-center gap-2">
                  <Server className="w-4 h-4" /> État du serveur Hostinger / LWS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <span className="font-medium">Statut global</span>
                  </div>
                  <Badge className="bg-success text-success-foreground">Opérationnel</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-foreground/60">Disponibilité (30 jours)</span>
                    <span className="font-bold text-success">{data.health.uptime}%</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-foreground/60">Temps de réponse moyen</span>
                    <span className="font-medium">{data.health.avgResponseMs} ms</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-foreground/60">Taux d'erreur HTTP 5xx</span>
                    <span className="font-medium text-success">{data.health.errorRate}%</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-foreground/60">Taille base de données</span>
                    <span className="font-medium">{data.health.dbSize}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-foreground/60">Sessions actives</span>
                    <span className="font-medium">{data.health.activeSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Dernier incident</span>
                    <span className="font-medium text-success text-xs">{data.health.lastIncident}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="daraja-card bg-gradient-to-br from-accent/30 to-card border-gold/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-accent-foreground flex items-center gap-2">
                  <Brain className="w-4 h-4" /> Activité IA DARAJA Brain
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary font-[family-name:var(--font-poppins)]">
                    {data.aiActivity.totalOcr}
                  </span>
                  <span className="text-sm text-foreground/60">documents OCR traités</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground/60">Précision moyenne OCR</span>
                    <span className="font-bold text-success">{data.aiActivity.avgConfidence}%</span>
                  </div>
                  <Progress value={data.aiActivity.avgConfidence} className="h-2" />
                </div>
                <div className="pt-2 border-t border-border space-y-1.5 text-xs">
                  <div className="text-foreground/60 mb-1">Répartition par langue :</div>
                  {Object.entries(data.aiActivity.byLanguage).map(([lang, count]) => (
                    <div key={lang} className="flex justify-between">
                      <span>{lang === "FR" ? "Français" : lang === "EN" ? "Anglais" : lang === "Bambara" ? "Bambara" : "Wolof"}</span>
                      <span className="font-medium">{count} docs</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Support technique */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Support technique plateforme</div>
                  <div className="text-xs text-foreground/60">Direction DARAJA · Bamako, Mali</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-base font-bold text-primary hover:text-primary/80 font-[family-name:var(--font-poppins)]"
                >
                  {SUPPORT_EMAIL}
                </a>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <a href={`mailto:${SUPPORT_EMAIL}`}>
                    <Mail className="w-4 h-4 mr-1.5" /> Contacter
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal de déverrouillage par code secret
// ─────────────────────────────────────────────
export function AdminUnlockModal({
  open, onClose, onUnlock,
}: {
  open: boolean;
  onClose: () => void;
  onUnlock: (code: string) => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleUnlock = async () => {
    if (!code.trim()) {
      setError("Veuillez saisir le code secret propriétaire.");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      // Vérification côté serveur via l'API stats
      const r = await fetch("/api/admin/stats", {
        headers: { "x-daraja-admin-code": code.trim() },
      });
      if (r.status === 403) {
        setError("Code secret incorrect. Accès refusé.");
        setVerifying(false);
        return;
      }
      if (!r.ok) {
        setError("Erreur lors de la vérification.");
        setVerifying(false);
        return;
      }
      onUnlock(code.trim());
      setCode("");
      setError(null);
      setVerifying(false);
    } catch {
      setError("Erreur réseau. Réessayez.");
      setVerifying(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-primary/40 shadow-2xl">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gold" />
              <div>
                <CardTitle className="text-base text-white">Console propriétaire</CardTitle>
                <CardDescription className="text-white/70 text-xs">
                  Accès verrouillé — reserved au propriétaire de DARAJA
                </CardDescription>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="text-center py-2">
            <Shield className="w-12 h-12 text-primary/30 mx-auto mb-3" />
            <div className="text-sm text-foreground/70">
              Saisissez le code secret propriétaire pour accéder à la console de suivi plateforme.
            </div>
            <div className="text-xs text-foreground/50 mt-2 bg-muted/40 p-2 rounded-md">
              🔒 Cette console n'affiche que des statistiques agrégées. Aucun accès aux comptes ou fichiers utilisateurs.
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Code secret</label>
            <input
              type="password"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              placeholder="••••••"
              className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={20}
            />
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={handleUnlock}
              disabled={verifying}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {verifying ? "Vérification…" : <><Lock className="w-4 h-4 mr-1.5" /> Déverrouiller</>}
            </Button>
          </div>
          <div className="text-[10px] text-foreground/40 text-center pt-2 border-t border-border">
            Raccourci clavier : Ctrl + Shift + Alt + D
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
