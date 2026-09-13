// DARAJA — Landing marketing
'use client';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield, FolderSearch, Brain, Smartphone, MessageCircle,
  FileSignature, Cloud, Lock, Zap, Check, Building2,
  ChevronRight, Star, Globe,
} from "lucide-react";
import { DarajaLogo } from "./logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/lib/client";

const PLANS = [
  {
    code: "gratuit",
    name: "Démarre",
    price: 0,
    target: "TPE, Indépendants",
    storage: "5 Go",
    users: "1 utilisateur",
    uploads: "100 docs/mois",
    features: ["Scan, Dossiers, Recherche", "App Mobile + Web", "Support chatbot"],
    cta: "Démarrer gratuitement",
    accent: false,
  },
  {
    code: "entreprise",
    name: "Entreprise",
    price: 19900,
    target: "PME, ONG, Cabinets",
    storage: "200 Go",
    users: "10 utilisateurs",
    uploads: "Illimité",
    features: [
      "Tout du plan Gratuit +",
      "IA DARAJA Brain (OCR multilingue)",
      "Workflow & signature électronique",
      "Alertes WhatsApp",
      "Support prioritaire 24h",
    ],
    cta: "Choisir Entreprise",
    accent: true,
  },
  {
    code: "etat",
    name: "Administration État",
    price: 99900,
    target: "Mairies, Ministères, Banques",
    storage: "2 To + Extensible",
    users: "Illimité",
    uploads: "Illimité",
    features: [
      "Tout du plan Entreprise +",
      "API & Serveur dédié",
      "Audit & ISO 27001",
      "Formation sur site",
      "Manager dédié",
    ],
    cta: "Demander une démo",
    accent: false,
  },
];

const FEATURES = [
  {
    icon: Smartphone,
    title: "Archivage Téléphone → Cloud en 10s",
    desc: "App Android/iOS/Web. Scan, photo, PDF, audio. Upload même en 3G. Optimisé pour les conditions réseau africaines.",
  },
  {
    icon: Brain,
    title: "IA DARAJA Brain",
    desc: "OCR multilingue FR, EN, Bambara, Wolof. L'IA lit, nomme et classe seule : « Compta > Factures > CIE > Oct 2026 ».",
  },
  {
    icon: FolderSearch,
    title: "Recherche ultra-rapide",
    desc: "Tapez « Contrat Marché Public 2024 » → Résultat instantané. Recherche dans le texte des PDF et photos.",
  },
  {
    icon: Shield,
    title: "Sécurité niveau Banque",
    desc: "Chiffrement AES-256. Droits d'accès par rôle. Historique complet. Hébergement Hostinger/LWS avec sauvegarde redondante."
  },
  {
    icon: FileSignature,
    title: "Workflow & Signature",
    desc: "Circuit de validation : Agent → Chef → SG. Signature électronique. Partage par lien sécurisé.",
  },
  {
    icon: MessageCircle,
    title: "Connect WhatsApp",
    desc: "« Nouveau document à signer ». Recevez vos docs importants directement sur WhatsApp, sans quitter l'app.",
  },
];

const STATS = [
  { value: "10s", label: "Pour archiver un doc" },
  { value: "4", label: "Langues IA (FR, EN, Bambara, Wolof)" },
  { value: "AES-256", label: "Niveau de chiffrement" },
  { value: "100%", label: "Conforme UEMOA & RGPD" },
];

export function DarajaLanding({
  onLogin,
  onSignup,
}: {
  onLogin: () => void;
  onSignup: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background daraja-bridge-bg">
      {/* Header */}
      <header
        className={`sticky top-0 z-40 transition-all ${
          scrolled ? "bg-white/95 backdrop-blur shadow-sm border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <DarajaLogo size={36} />
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a href="#features" className="text-foreground/70 hover:text-primary transition-colors">Fonctionnalités</a>
            <a href="#plans" className="text-foreground/70 hover:text-primary transition-colors">Tarifs</a>
            <a href="#security" className="text-foreground/70 hover:text-primary transition-colors">Sécurité</a>
            <a href="#africa" className="text-foreground/70 hover:text-primary transition-colors">Afrique</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onLogin} className="text-primary">
              Connexion
            </Button>
            <Button onClick={onSignup} className="bg-primary hover:bg-primary/90">
              Essai gratuit
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-5 bg-gold/15 text-accent-foreground border-gold/30 hover:bg-gold/20">
                <Star className="w-3 h-3 mr-1 fill-gold text-gold" />
                SaaS d'archivage n°1 pour l'Afrique
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-primary">
                Le pont vers vos archives.
              </h1>
              <p className="mt-5 text-lg text-foreground/70 max-w-xl">
                <strong className="text-foreground">Zéro papier. Zéro perte.</strong> Accédez à n'importe quel document en 1 seconde, depuis votre téléphone. DARAJA — conçu pour les entreprises et administrations africaines.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button size="lg" onClick={onSignup} className="bg-primary hover:bg-primary/90">
                  Démarrer gratuitement
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button size="lg" variant="outline" onClick={onLogin}>
                  Voir la démo
                </Button>
              </div>
              <div className="mt-6 flex items-center gap-4 text-xs text-foreground/60">
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-success" /> Sans carte bancaire</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-success" /> 5 Go offerts</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-success" /> Hébergé Hostinger / LWS</span>
              </div>
            </motion.div>

            {/* Pont animé */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative h-[360px] sm:h-[440px] flex items-center justify-center"
            >
              <BridgeIllustration />
            </motion.div>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <Card key={i} className="daraja-card border-border/70 bg-card">
                <CardContent className="p-5 text-center">
                  <div className="text-3xl font-bold text-primary font-[family-name:var(--font-poppins)]">{s.value}</div>
                  <div className="text-xs text-foreground/60 mt-1">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 lg:py-24 bg-card/60 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Système moderne</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-primary">Tout ce qu'il faut pour ne plus rien perdre</h2>
            <p className="mt-3 text-foreground/60">Six modules cœur, pensés pour le terrain africain.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="daraja-card h-full border-border/70">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <f.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base text-foreground">{f.title}</h3>
                    <p className="text-sm text-foreground/60 mt-2 leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-3 bg-success/10 text-success border-success/20">
                <Lock className="w-3 h-3 mr-1" /> Sécurité niveau Banque
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-primary">
                On garde vos documents comme à la Banque Centrale.
              </h2>
              <p className="mt-4 text-foreground/60 leading-relaxed">
                Chaque document est chiffré en AES-256 au repos et en transit. Les droits d'accès sont définis par rôle : Admin, Manager, Employé. Un historique complet d'audit est conservé pour chaque action, conforme aux exigences réglementaires UEMOA et ISO 27001.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  { icon: Lock, text: "Chiffrement AES-256 bout-en-bout" },
                  { icon: Shield, text: "Droits d'accès par rôle et par dossier" },
                  { icon: Cloud, text: "Hébergement Hostinger / LWS (cloud performant)" },
                  { icon: Globe, text: "Conforme RGPD, Loi UEMOA, ISO 27001 (plan État)" },
                ].map((it, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-md bg-success/10 flex items-center justify-center mt-0.5">
                      <it.icon className="w-3.5 h-3.5 text-success" />
                    </div>
                    <span className="text-sm text-foreground/80">{it.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="bg-primary text-primary-foreground border-0 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Coffre-fort numérique</div>
                    <div className="text-xs text-white/70">Cloud Hostinger / LWS · Direction Mali (+223)</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Chiffrement AES-256", val: "ACTIF" },
                    { label: "2FA Admin", val: "ACTIF" },
                    { label: "Audit logs", val: "30 JOURS" },
                    { label: "Backups auto", val: "QUOTIDIEN" },
                    { label: "Conformité UEMOA", val: "OK" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b border-white/10 pb-2">
                      <span className="text-white/80">{r.label}</span>
                      <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded text-gold">{r.val}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Africa */}
      <section id="africa" className="py-16 lg:py-20 bg-accent/40 border-y border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <Building2 className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl lg:text-4xl font-bold text-primary">Conçu pour l'Afrique</h2>
          <p className="mt-4 text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            DARAJA parle français, anglais, bambara, wolof. Fonctionne en 3G, même là où le réseau est lent. Paiements via CinetPay, FedaPay, Orange Money, Wave, virement. Pensé pour les mairies, ministères, PME, ONG et cabinets de Bamako, Abidjan, Dakar, Lomé, Cotonou. Direction basée au Mali (+223).
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {["Mali", "Côte d'Ivoire", "Sénégal", "Burkina Faso", "Togo", "Bénin", "Guinée", "Cameroun"].map((c) => (
              <Badge key={c} variant="outline" className="px-3 py-1.5 bg-card border-border text-foreground/70">
                <Globe className="w-3 h-3 mr-1 text-primary" /> {c}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge className="mb-3 bg-gold/15 text-accent-foreground border-gold/30">Tarifs</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-primary">Trois plans, un pont adapté à votre structure</h2>
            <p className="mt-3 text-foreground/60">Du TPE au ministère — payez en Mobile Money, Wave ou virement.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((p) => (
              <Card
                key={p.code}
                className={`daraja-card relative ${
                  p.accent
                    ? "border-primary border-2 shadow-lg shadow-primary/10"
                    : "border-border"
                }`}
              >
                {p.accent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">Le plus choisi</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="text-xs uppercase tracking-wide text-foreground/50 font-medium">{p.target}</div>
                  <div className="mt-1 font-semibold text-xl text-foreground">{p.name}</div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-primary font-[family-name:var(--font-poppins)]">
                      {p.price === 0 ? "0 F" : formatFcfa(p.price)}
                    </span>
                    <span className="text-foreground/50 text-sm">/ mois</span>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-sm">
                    <li className="flex items-center gap-2 text-foreground/80">
                      <Check className="w-4 h-4 text-success" /> {p.storage}
                    </li>
                    <li className="flex items-center gap-2 text-foreground/80">
                      <Check className="w-4 h-4 text-success" /> {p.users}
                    </li>
                    <li className="flex items-center gap-2 text-foreground/80">
                      <Check className="w-4 h-4 text-success" /> {p.uploads}
                    </li>
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-foreground/70">
                        <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full mt-6 ${
                      p.accent
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                    onClick={onSignup}
                  >
                    {p.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 lg:py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold">Prêt à franchir le pont ?</h2>
          <p className="mt-3 text-white/80 max-w-xl mx-auto">
            Rejoignez les organisations qui ont déjà archivé plus de 2 millions de documents avec DARAJA. Direction basée à Bamako, Mali — contactez-nous à support@daraja.africa.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={onSignup} className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Zap className="w-4 h-4 mr-1" /> Démarrer maintenant
            </Button>
            <Button size="lg" variant="outline" onClick={onLogin} className="border-white/30 text-white hover:bg-white/10 hover:text-white">
              J'ai déjà un compte
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-background border-t border-border py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <DarajaLogo size={32} />
              <p className="mt-3 text-sm text-foreground/60 max-w-xs">
                Le pont entre votre papier et le cloud. SaaS d'archivage pour l'Afrique.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground mb-3">Produit</div>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#features" className="hover:text-primary">Fonctionnalités</a></li>
                <li><a href="#plans" className="hover:text-primary">Tarifs</a></li>
                <li><a href="#security" className="hover:text-primary">Sécurité</a></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground mb-3">Entreprise</div>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#africa" className="hover:text-primary">Afrique</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
                <li><a href="#" className="hover:text-primary">Démo</a></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground mb-3">Contact — Direction Mali</div>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li>✉ support@daraja.africa</li>
                <li>📍 Bamako, Mali</li>
                <li>🌐 Hébergement Hostinger / LWS</li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground mb-3">Légal</div>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#" className="hover:text-primary">RGPD</a></li>
                <li><a href="#" className="hover:text-primary">Conformité UEMOA</a></li>
                <li><a href="#" className="hover:text-primary">ISO 27001</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-xs text-foreground/50 flex flex-wrap justify-between gap-3">
            <span>© {new Date().getFullYear()} DARAJA. Tous droits réservés. Hébergement Hostinger / LWS · Direction Mali (+223).</span>
            <span>Fait avec ❤️ pour l'Afrique</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────
// Illustration du pont animé
// ─────────────────────────────────────────────
function BridgeIllustration() {
  return (
    <div className="relative w-full max-w-md aspect-square">
      {/* Cercle de fond */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/5 via-gold/5 to-success/5" />

      {/* Dossier papier (en bas à gauche) */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute bottom-10 left-8 w-20 h-16 rounded-md bg-white border border-border shadow-md flex items-center justify-center"
      >
        <div className="text-[10px] font-mono text-primary/70">PAPIER</div>
      </motion.div>

      {/* Cloud (en haut à droite) */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute top-10 right-8"
      >
        <div className="w-24 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
          <Cloud className="w-7 h-7" />
        </div>
        <div className="text-center text-[10px] font-mono text-primary/70 mt-1">CLOUD</div>
      </motion.div>

      {/* Pont */}
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full"
        fill="none"
      >
        {/* Piliers */}
        <motion.rect
          x="120" y="200" width="14" height="120" rx="3" fill="#003366"
          initial={{ height: 0, y: 320 }}
          animate={{ height: 120, y: 200 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        />
        <motion.rect
          x="266" y="200" width="14" height="120" rx="3" fill="#003366"
          initial={{ height: 0, y: 320 }}
          animate={{ height: 120, y: 200 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        />
        {/* Arche */}
        <motion.path
          d="M134 220 Q200 100 266 220"
          stroke="#D4AF37"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        />
        {/* Tablier */}
        <motion.line
          x1="120" y1="220" x2="280" y2="220"
          stroke="#003366"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        />
      </svg>

      {/* Documents qui transitent */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-sm bg-success"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [-60, -30, 30, 60],
            y: [40, 0, 0, -40],
          }}
          transition={{
            duration: 2.4,
            delay: 1 + i * 0.8,
            repeat: Infinity,
            repeatDelay: 0.6,
          }}
        />
      ))}
    </div>
  );
}
