# DARAJA — Le pont vers vos archives

SaaS d'archivage de documents pour entreprises et administrations africaines.

## 🌉 Vision

**DARAJA** (du swahili « le pont ») est le pont entre le papier et le cloud. Zéro papier. Zéro perte. Accédez à n'importe quel document en 1 seconde, depuis votre téléphone.

## ✨ Fonctionnalités

### Modules cœur
- 📱 **Archivage téléphone → cloud** : Scan caméra, upload PDF/JPG/PNG, fonctionne en 3G
- 🧠 **IA DARAJA Brain** : OCR multilingue (FR, EN, Bambara, Wolof), classification automatique
- 🔍 **Recherche ultra-rapide** : Full-text dans titre, catégorie IA, tags et texte OCR
- 🔐 **Sécurité niveau banque** : Chiffrement AES-256, droits par rôle, audit complet
- ✍️ **Workflow & signature** : Circuit Agent → Chef → SG, signature électronique
- 📤 **Partage de documents** : Liens sécurisés via WhatsApp (style Google Drive)
- 💬 **Connect WhatsApp** : Alertes WhatsApp Business API

### Plans tarifaires
| Plan | Prix | Stockage | Utilisateurs |
|------|------|----------|-------------|
| Gratuit | 0 FCFA/mois | 5 Go | 1 |
| Entreprise | 19 900 FCFA/mois | 200 Go | 10 |
| État | 99 900 FCFA/mois | 2 To+ | Illimité |

## 🛠 Stack technique

- **Frontend** : Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **Backend** : Next.js API Routes + Prisma ORM
- **Base de données** : SQLite (démo) → PostgreSQL/MySQL en production
- **Auth** : Sessions cookie-based + 2FA optionnel
- **Paiement** : CinetPay, FedaPay, Wave, Orange Money (sandbox)
- **IA** : OCR heuristique + classification automatique
- **Hébergement** : Hostinger / LWS

## 📦 Installation locale

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec votre DATABASE_URL (PostgreSQL recommandé)

# 3. Initialiser la base de données
npx prisma db push

# 4. Charger les données de démonstration
npm run seed

# 5. Lancer le serveur de développement
npm run dev
```

L'application est accessible sur `http://localhost:3000`.

## 🚀 Déploiement sur Vercel

Guide complet : [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md)

**Étapes rapides :**
1. Push du code sur GitHub
2. Importer le repo sur [vercel.com](https://vercel.com)
3. Configurer les variables d'environnement :
   - `DATABASE_URL` : URL PostgreSQL (Supabase, Neon, ou Vercel Postgres)
   - `NEXT_PUBLIC_APP_URL` : URL Vercel (`https://votre-app.vercel.app`)
   - `ADMIN_SECRET_CODE` : `847825`
4. Déployer
5. Initialiser la base : `npx prisma db push` + `npm run seed`

## 🔑 Comptes de démonstration

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@daraja.demo | daraja123 | Administrateur |
| manager@daraja.demo | daraja123 | Manager |
| employe@daraja.demo | daraja123 | Employé |

## 📁 Structure du projet

```
├── prisma/
│   └── schema.prisma          # Schéma de base de données
├── public/
│   └── logo.svg               # Logo DARAJA
├── scripts/
│   ├── seed.ts                # Données de démonstration
│   └── docx-guide/            # Générateur de guide utilisateur Word
├── src/
│   ├── app/
│   │   ├── api/               # Routes API (auth, documents, folders, share, admin)
│   │   ├── share/[token]/     # Page publique de partage de documents
│   │   ├── layout.tsx         # Layout racine (Poppins + Inter)
│   │   └── page.tsx           # Page d'accueil + app shell
│   ├── components/
│   │   ├── daraja/            # Composants DARAJA (landing, dashboard, etc.)
│   │   └── ui/                # Composants shadcn/ui
│   └── lib/
│       ├── auth.ts            # Authentification (sessions, hash)
│       ├── share.ts           # Génération de tokens de partage
│       ├── storage.ts         # Stockage de fichiers
│       ├── daraja-brain.ts    # OCR + classification IA
│       └── admin-secret.ts    # Code secret super-admin
├── .env.example               # Variables d'environnement (à copier)
├── package.json
└── tailwind.config.ts
```

## 🔒 Console propriétaire (super-admin)

La console propriétaire est **invisible** dans les menus. Elle est accessible uniquement par :

1. **Raccourci clavier** : `Ctrl + Shift + Alt + D` → modale verrouillée
2. **Barre de recherche** : Tapez `admin:847825`

**Code secret** : `847825`

La console n'affiche que des statistiques agrégées (aucune donnée individuelle) pour préserver la confidentialité des comptes clients.

## 📤 Partage de documents

Chaque document dispose d'un bouton **Partager** qui permet de :
- Générer un lien sécurisé (token 32 caractères)
- Choisir les permissions (consultation / modification / privé)
- Ajouter un mot de passe et une date d'expiration
- Partager via WhatsApp, Email, QR Code
- Gérer et révoquer les liens depuis l'onglet « Liens partagés »

## 📄 Licence

© DARAJA. Tous droits réservés. Hébergement Hostinger / LWS. Direction Bamako, Mali.
