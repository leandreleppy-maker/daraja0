// DARAJA — Auth Modal (login + signup avec sélecteur de plan)
'use client';

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DarajaLogo } from "./logo";
import { api, formatFcfa } from "@/lib/client";
import { toast } from "sonner";
import { Loader2, Shield, Check, Mail, Lock, User, Building2, Phone } from "lucide-react";

type Plan = {
  id: string;
  code: string;
  name: string;
  priceMonthlyFcfa: number;
  storageGb: number;
};

export function AuthModal({
  open,
  mode,
  onModeChange,
  onClose,
  onSuccess,
}: {
  open: boolean;
  mode: "login" | "signup";
  onModeChange: (m: "login" | "signup") => void;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [signup, setSignup] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    orgName: "",
    orgType: "pme",
    planCode: "gratuit",
  });
  const [login, setLogin] = useState({ email: "admin@daraja.demo", password: "daraja123" });

  useEffect(() => {
    if (open && mode === "signup") {
      api<{ plans: Plan[] }>("/api/plans")
        .then((d) => setPlans(d.plans))
        .catch(() => {});
    }
  }, [open, mode]);

  const submitLogin = async () => {
    setLoading(true);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(login),
      });
      toast.success("Connexion réussie. Bienvenue sur DARAJA.");
      onClose();
      onSuccess();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const submitSignup = async () => {
    if (!signup.name || !signup.email || !signup.password || !signup.orgName) {
      toast.error("Veuillez remplir tous les champs requis.");
      return;
    }
    setLoading(true);
    try {
      await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(signup),
      });
      toast.success("Compte créé. Bienvenue sur DARAJA.");
      onClose();
      onSuccess();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg max-h-[92vh] overflow-y-auto daraja-scroll">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <DarajaLogo size={36} />
          </div>
          <DialogTitle className="text-primary text-xl">
            {mode === "login" ? "Connexion à DARAJA" : "Créer votre compte DARAJA"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Accédez à vos archives. Le pont vers vos documents."
              : "Zéro papier. Zéro perte. Démarrage en 30 secondes."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => onModeChange(v as any)} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Inscription</TabsTrigger>
          </TabsList>

          {/* LOGIN */}
          <TabsContent value="login" className="space-y-3 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <Input
                  id="login-email" type="email" autoComplete="email"
                  className="pl-9"
                  value={login.email}
                  onChange={(e) => setLogin({ ...login, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-pwd">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <Input
                  id="login-pwd" type="password" autoComplete="current-password"
                  className="pl-9"
                  value={login.password}
                  onChange={(e) => setLogin({ ...login, password: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && submitLogin()}
                />
              </div>
            </div>

            {/* Comptes de démo */}
            <div className="bg-accent/40 border border-gold/20 rounded-lg p-3 text-xs space-y-1">
              <div className="font-semibold text-accent-foreground flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> Comptes de démonstration
              </div>
              <button
                type="button"
                className="block w-full text-left hover:text-primary"
                onClick={() => setLogin({ email: "admin@daraja.demo", password: "daraja123" })}
              >
                👤 admin@daraja.demo / daraja123 <span className="text-foreground/50">(Admin)</span>
              </button>
              <button
                type="button"
                className="block w-full text-left hover:text-primary"
                onClick={() => setLogin({ email: "manager@daraja.demo", password: "daraja123" })}
              >
                👤 manager@daraja.demo / daraja123 <span className="text-foreground/50">(Manager)</span>
              </button>
              <button
                type="button"
                className="block w-full text-left hover:text-primary"
                onClick={() => setLogin({ email: "employe@daraja.demo", password: "daraja123" })}
              >
                👤 employe@daraja.demo / daraja123 <span className="text-foreground/50">(Employé)</span>
              </button>
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90" onClick={submitLogin} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Se connecter
            </Button>
          </TabsContent>

          {/* SIGNUP */}
          <TabsContent value="signup" className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="su-name">Nom complet *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <Input
                    id="su-name" className="pl-9"
                    value={signup.name}
                    onChange={(e) => setSignup({ ...signup, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <Input
                    id="su-phone" className="pl-9"
                    placeholder="+223 XX XX XX XX"
                    value={signup.phone}
                    onChange={(e) => setSignup({ ...signup, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="su-email">Email professionnel *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <Input
                  id="su-email" type="email" className="pl-9"
                  value={signup.email}
                  onChange={(e) => setSignup({ ...signup, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="su-pwd">Mot de passe *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <Input
                  id="su-pwd" type="password" className="pl-9"
                  value={signup.password}
                  onChange={(e) => setSignup({ ...signup, password: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="su-org">Organisation *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <Input
                    id="su-org" className="pl-9"
                    placeholder="Mairie de Cocody"
                    value={signup.orgName}
                    onChange={(e) => setSignup({ ...signup, orgName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-type">Type</Label>
                <Select
                  value={signup.orgType}
                  onValueChange={(v) => setSignup({ ...signup, orgType: v })}
                >
                  <SelectTrigger id="su-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tpe">TPE / Indépendant</SelectItem>
                    <SelectItem value="pme">PME</SelectItem>
                    <SelectItem value="ong">ONG</SelectItem>
                    <SelectItem value="cabinet">Cabinet</SelectItem>
                    <SelectItem value="mairie">Mairie</SelectItem>
                    <SelectItem value="ministere">Ministère</SelectItem>
                    <SelectItem value="banque">Banque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Plan souhaité</Label>
              <div className="grid grid-cols-3 gap-2">
                {plans.map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => setSignup({ ...signup, planCode: p.code })}
                    className={`text-left rounded-lg border p-2.5 transition-all ${
                      signup.planCode === p.code
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="text-xs font-semibold text-foreground">{p.name}</div>
                    <div className="text-[11px] text-primary font-bold mt-0.5">
                      {p.priceMonthlyFcfa === 0 ? "Gratuit" : formatFcfa(p.priceMonthlyFcfa) + "/m"}
                    </div>
                    <div className="text-[10px] text-foreground/50 mt-0.5">{p.storageGb} Go</div>
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90" onClick={submitSignup} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Créer mon compte
            </Button>
            <p className="text-[11px] text-center text-foreground/50">
              En créant un compte, vous acceptez nos conditions et notre politique de confidentialité (RGPD, UEMOA).
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
