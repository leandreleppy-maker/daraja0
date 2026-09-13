// DARAJA — Settings View
'use client';

import { useEffect, useState } from "react";
import {
  CreditCard, Shield, MessageCircle, Users, Check, Crown,
  Loader2, Lock, Smartphone, Globe, Building2, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { api, formatFcfa } from "@/lib/client";
import { toast } from "sonner";
import type { SessionUser, SessionOrg } from "@/app/page";

type Plan = {
  id: string;
  code: string;
  name: string;
  priceMonthlyFcfa: number;
  storageGb: number;
  maxUsers: number;
  features: string[];
};

const PROVIDERS = [
  { code: "cinetpay", name: "CinetPay", color: "#FF6B35", logo: "CP" },
  { code: "fedapay", name: "FedaPay", color: "#00A651", logo: "FP" },
  { code: "wave", name: "Wave", color: "#1DC8FF", logo: "W" },
  { code: "orange_money", name: "Orange Money", color: "#FF7900", logo: "OM" },
  { code: "virement", name: "Virement bancaire", color: "#003366", logo: "VB" },
];

const PLAN_FEATURES_LABELS: Record<string, string> = {
  scan: "Scanner & Upload",
  dossiers: "Dossiers illimités",
  recherche: "Recherche instantanée",
  ia: "IA DARAJA Brain (OCR multilingue)",
  workflow: "Workflow & validation",
  whatsapp: "Alertes WhatsApp",
  signature: "Signature électronique",
  prioritaire: "Support prioritaire 24h",
  api: "API REST",
  serveur_dedie: "Serveur dédié",
  audit: "Audit & logs avancés",
  formation: "Formation sur site",
  iso_27001: "Conformité ISO 27001",
};

export function SettingsView({
  user, org, onOrgChange,
}: {
  user: SessionUser;
  org: SessionOrg | null;
  onOrgChange: () => void;
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [twoFA, setTwoFA] = useState(user.twoFactorOn ?? false);
  const [phone, setPhone] = useState(user.phone ?? "");

  useEffect(() => {
    api<{ plans: Plan[] }>("/api/plans").then((d) => setPlans(d.plans)).catch(() => {});
  }, []);

  const handleSubscribe = async (planCode: string, provider: string) => {
    setProcessing(`${planCode}:${provider}`);
    try {
      const r = await api<{ ok: boolean; message: string }>("/api/payments", {
        method: "POST",
        body: JSON.stringify({ planCode, provider }),
      });
      toast.success(r.message);
      onOrgChange();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setProcessing(null);
    }
  };

  const currentPlanCode = org?.plan?.code ?? "gratuit";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-primary font-[family-name:var(--font-poppins)]">Paramètres</h1>
        <p className="text-sm text-foreground/60">Gérez votre abonnement, vos paiements et votre équipe.</p>
      </div>

      <Tabs defaultValue="plans">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full lg:w-auto">
          <TabsTrigger value="plans"><Crown className="w-3.5 h-3.5 mr-1.5" /> Plans</TabsTrigger>
          <TabsTrigger value="payment"><CreditCard className="w-3.5 h-3.5 mr-1.5" /> Paiement</TabsTrigger>
          <TabsTrigger value="integrations"><Zap className="w-3.5 h-3.5 mr-1.5" /> Intégrations</TabsTrigger>
          <TabsTrigger value="team"><Users className="w-3.5 h-3.5 mr-1.5" /> Équipe</TabsTrigger>
        </TabsList>

        {/* PLANS */}
        <TabsContent value="plans" className="space-y-4 mt-4">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base text-primary">Votre plan actuel</CardTitle>
            </CardHeader>
            <CardContent>
              {org?.plan ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-gold" />
                      <span className="text-lg font-semibold text-foreground">{org.plan.name}</span>
                      <Badge className="bg-success/15 text-success">Actif</Badge>
                    </div>
                    <div className="text-sm text-foreground/60 mt-1">
                      {org.plan.storageGb >= 1024
                        ? `${org.plan.storageGb / 1024} To`
                        : `${org.plan.storageGb} Go`} de stockage ·{" "}
                      {org.plan.maxUsers === -1 ? "Utilisateurs illimités" : `${org.plan.maxUsers} utilisateurs`}
                      {org.plan.priceMonthlyFcfa > 0 && (
                        <> · {formatFcfa(org.plan.priceMonthlyFcfa)}/mois</>
                      )}
                    </div>
                  </div>
                  {org.subscription?.paymentProvider && (
                    <Badge variant="outline" className="capitalize">
                      <CreditCard className="w-3 h-3 mr-1" />
                      {org.subscription.paymentProvider.replace("_", " ")}
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="text-foreground/60">Aucun plan actif.</div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const isCurrent = p.code === currentPlanCode;
              const isAccent = p.code === "entreprise";
              return (
                <Card
                  key={p.code}
                  className={`relative ${isAccent ? "border-primary border-2" : "border-border/70"} ${isCurrent ? "ring-2 ring-success" : ""}`}
                >
                  {isAccent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1">Populaire</Badge>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 right-3">
                      <Badge className="bg-success text-success-foreground px-3 py-1">
                        <Check className="w-3 h-3 mr-1" /> Votre plan
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="text-xs uppercase tracking-wide text-foreground/50">{p.name}</div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-primary font-[family-name:var(--font-poppins)]">
                        {p.priceMonthlyFcfa === 0 ? "0 F" : formatFcfa(p.priceMonthlyFcfa)}
                      </span>
                      <span className="text-xs text-foreground/50">/ mois</span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-foreground/70">
                      <div>📦 {p.storageGb >= 1024 ? `${p.storageGb / 1024} To` : `${p.storageGb} Go`}</div>
                      <div>👥 {p.maxUsers === -1 ? "Illimité" : `${p.maxUsers} utilisateurs`}</div>
                    </div>
                    <Separator className="my-3" />
                    <ul className="space-y-1.5 text-xs">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5">
                          <Check className="w-3 h-3 text-success mt-0.5 shrink-0" />
                          <span className="text-foreground/70">{PLAN_FEATURES_LABELS[f] ?? f}</span>
                        </li>
                      ))}
                    </ul>
                    {!isCurrent && (
                      <Button
                        className="w-full mt-4 bg-primary hover:bg-primary/90"
                        disabled={!!processing}
                        onClick={() => handleSubscribe(p.code, "cinetpay")}
                      >
                        {processing === `${p.code}:cinetpay` ? (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : null}
                        Passer à {p.name}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* PAYMENT */}
        <TabsContent value="payment" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-primary flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Moyens de paiement
              </CardTitle>
              <CardDescription>
                Mode <Badge className="bg-gold/15 text-accent-foreground">SANDBOX</Badge> —
                paiements simulés, aucune transaction réelle. Activé immédiatement pour la démo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {PROVIDERS.map((p) => (
                  <div
                    key={p.code}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: p.color }}
                    >
                      {p.logo}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{p.name}</div>
                      <div className="text-[11px] text-foreground/50">
                        {p.code === "virement" ? "Manuel" : "Paiement mobile/web"}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Sandbox</Badge>
                  </div>
                ))}
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium text-foreground mb-2">Changer de plan via un fournisseur</div>
                <div className="grid sm:grid-cols-3 gap-2">
                  {plans.filter((p) => p.code !== currentPlanCode).map((p) => (
                    <div key={p.code} className="border border-border rounded-lg p-3">
                      <div className="text-xs font-medium text-foreground">{p.name}</div>
                      <div className="text-sm font-bold text-primary">
                        {p.priceMonthlyFcfa === 0 ? "Gratuit" : formatFcfa(p.priceMonthlyFcfa) + "/m"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {PROVIDERS.slice(0, 4).map((pr) => (
                          <Button
                            key={pr.code}
                            variant="outline"
                            size="sm"
                            className="text-[10px] h-7 px-2"
                            disabled={!!processing}
                            onClick={() => handleSubscribe(p.code, pr.code)}
                          >
                            {processing === `${p.code}:${pr.code}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : pr.logo}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INTEGRATIONS */}
        <TabsContent value="integrations" className="space-y-4 mt-4">
          {/* WhatsApp */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-primary flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-success" /> WhatsApp Business API
              </CardTitle>
              <CardDescription>
                Recevez vos notifications et documents importants directement sur WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-success/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Alertes WhatsApp</div>
                    <div className="text-[11px] text-foreground/50">
                      Nouveau document à signer, upload terminé, partage…
                    </div>
                  </div>
                </div>
                <Switch
                  checked={whatsappEnabled}
                  onCheckedChange={(v) => {
                    setWhatsappEnabled(v);
                    toast.success(v ? "WhatsApp activé." : "WhatsApp désactivé.");
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wa-phone">Numéro WhatsApp de réception</Label>
                <Input
                  id="wa-phone"
                  placeholder="+223 XX XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Microsoft / Google */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-primary flex items-center gap-2">
                <Globe className="w-4 h-4" /> Intégrations cloud
              </CardTitle>
              <CardDescription>Connectez vos comptes pour import automatique.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              {[
                { name: "Microsoft 365", desc: "OneDrive, SharePoint, Outlook", color: "#0078D4" },
                { name: "Google Workspace", desc: "Drive, Gmail, Calendar", color: "#4285F4" },
              ].map((it) => (
                <div key={it.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md flex items-center justify-center text-white" style={{ background: it.color }}>
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{it.name}</div>
                      <div className="text-[11px] text-foreground/50">{it.desc}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Connexion OAuth à venir en V2.")}>
                    Connecter
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sécurité 2FA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-primary flex items-center gap-2">
                <Shield className="w-4 h-4" /> Sécurité du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Authentification à deux facteurs (2FA)</div>
                    <div className="text-[11px] text-foreground/50">Code SMS à chaque connexion</div>
                  </div>
                </div>
                <Switch
                  checked={twoFA}
                  onCheckedChange={(v) => {
                    setTwoFA(v);
                    toast.success(v ? "2FA activé." : "2FA désactivé.");
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEAM */}
        <TabsContent value="team" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base text-primary flex items-center gap-2">
                  <Users className="w-4 h-4" /> Équipe — {org?.name}
                </CardTitle>
                <CardDescription>Rôles : Admin, Manager, Employé</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => toast.info("Invitation par email à venir en V2.")}>
                <Users className="w-3.5 h-3.5 mr-1.5" /> Inviter
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {DEMO_TEAM.map((m) => (
                  <div key={m.email} className="flex items-center gap-3 p-3">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback
                        className={m.role === "admin" ? "bg-primary text-primary-foreground" :
                                   m.role === "manager" ? "bg-gold text-gold-foreground" :
                                   "bg-muted text-foreground"}
                      >
                        {m.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{m.name}</div>
                      <div className="text-[11px] text-foreground/50">{m.email}</div>
                    </div>
                    <Badge className={
                      m.role === "admin" ? "bg-primary/10 text-primary" :
                      m.role === "manager" ? "bg-gold/15 text-accent-foreground" :
                      "bg-muted text-foreground/70"
                    }>
                      {m.role === "admin" ? "Administrateur" : m.role === "manager" ? "Manager" : "Employé"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base text-primary flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Profil de l'organisation
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="text-xs text-foreground/50">Nom</Label>
                <div className="font-medium">{org?.name}</div>
              </div>
              <div>
                <Label className="text-xs text-foreground/50">Type</Label>
                <div className="font-medium capitalize">{org?.type}</div>
              </div>
              <div>
                <Label className="text-xs text-foreground/50">Pays</Label>
                <div className="font-medium">{org?.country}</div>
              </div>
              <div>
                <Label className="text-xs text-foreground/50">Ville</Label>
                <div className="font-medium">{org?.city ?? "—"}</div>
              </div>
              <div>
                <Label className="text-xs text-foreground/50">Téléphone</Label>
                <div className="font-medium">{org?.phone ?? "—"}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const DEMO_TEAM = [
  { name: "Aïcha Koné", email: "admin@daraja.demo", role: "admin" },
  { name: "Mamadou Traoré", email: "manager@daraja.demo", role: "manager" },
  { name: "Fatou Diabaté", email: "employe@daraja.demo", role: "employe" },
];
