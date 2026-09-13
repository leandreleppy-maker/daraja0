# 🚀 Déploiement DARAJA sur Vercel

Guide étape par étape pour déployer DARAJA sur Vercel via GitHub.

## ✅ Prérequis

1. Un compte [GitHub](https://github.com)
2. Un compte [Vercel](https://vercel.com) (gratuit)
3. Une base de données PostgreSQL externe (voir ci-dessous)

## 📦 Étape 1 — Base de données PostgreSQL

Vercel n'est pas compatible avec SQLite (pas de système de fichiers persistant). Vous devez utiliser une base PostgreSQL externe.

### Option recommandée : Supabase (gratuit, 500 Mo)

1. Allez sur [supabase.com](https://supabase.com) et créez un compte
2. Créez un nouveau projet
3. Dans **Project Settings > Database > Connection string**, copiez l'URL :
   ```
   postgresql://postgres:[VOTRE_MOT_DE_PASSE]@db.xxxxx.supabase.co:5432/postgres
   ```
4. Gardez cette URL, vous en aurez besoin à l'étape 4

### Autres options :
- **Vercel Postgres** (intégré à Vercel)
- **Neon** (neon.tech — gratuit, 3 Go)
- **Railway** (railway.app — 5$/mois)

## 📁 Étape 2 — Mettre le code sur GitHub

1. Créez un nouveau repository sur GitHub (ex: `daraja-saas`)
2. Importez le code source :

```bash
# Cloner le repo vide
git clone https://github.com/VOTRE-USER/daraja-saas.git
cd daraja-saas

# Copier tous les fichiers du zip darajadossier.zip dans ce dossier
# (décompressez le zip et copiez les fichiers en respectant la structure)

# Commit et push
git add .
git commit -m "DARAJA — SaaS d'archivage pour l'Afrique"
git push origin main
```

## 🔧 Étape 3 — Connecter GitHub à Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Cliquez sur **Add New > Project**
3. Importez votre repository `daraja-saas`
4. Vercel détecte automatiquement Next.js — **ne changez pas les paramètres de build**

## ⚙️ Étape 4 — Configurer les variables d'environnement

Dans Vercel > Project > Settings > Environment Variables, ajoutez :

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `DATABASE_URL` | `postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres` | Production + Preview |
| `NEXT_PUBLIC_APP_URL` | `https://daraja-saas.vercel.app` (votre URL Vercel) | Production |
| `ADMIN_SECRET_CODE` | `847825` | Production |

> ⚠️ Pour `DATABASE_URL`, remplacez le mot de passe par le vôtre.
> Si votre mot de passe contient des caractères spéciaux (@, #, etc.), encodez-les en URL (ex: @ → %40).

## 🚀 Étape 5 — Déployer

1. Cliquez sur **Deploy**
2. Attendez le build (2-5 minutes)
3. Vercel affiche l'URL : `https://daraja-saas-xxx.vercel.app`

## 🗃️ Étape 6 — Initialiser la base de données

Après le premier déploiement, vous devez créer les tables et charger les données de démo.

### Méthode 1 : En local (recommandée)

```bash
# Cloner le projet en local
git clone https://github.com/VOTRE-USER/daraja-saas.git
cd daraja-saas

# Installer
npm install

# Créer .env avec DATABASE_URL = votre URL Supabase
echo 'DATABASE_URL="postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres"' > .env

# Créer les tables
npx prisma db push

# Charger les données de démo
npx prisma db seed   # ou: npm run seed
```

### Méthode 2 : Via Supabase SQL Editor

1. Allez sur Supabase > SQL Editor
2. Copiez le contenu de `prisma/schema.prisma`
3. Ou utilisez `npx prisma migrate deploy` en local

## ✅ Étape 7 — Vérifier

Ouvrez votre URL Vercel :
1. La page d'accueil DARAJA s'affiche ✅
2. Connectez-vous avec `admin@daraja.demo` / `daraja123` ✅
3. Le dashboard s'affiche avec les données ✅

## 🔧 Dépannage

### Erreur : "PrismaClientInitializationError"
- Vérifiez que `DATABASE_URL` est bien configuré dans Vercel
- Vérifiez que l'URL commence par `postgresql://` (pas `postgres://`)

### Erreur : "Can't reach database server"
- Vérifiez que votre base Supabase/Neon est en pause (les bases gratuites se mettent en pause)
- Redémarrez la base

### Erreur : "prisma generate" pendant le build
- Le script `postinstall` dans `package.json` s'en charge automatiquement
- Si ça échoue, ajoutez `prisma generate` dans Vercel > Settings > Build Command

### Erreur de build TypeScript
- Le `tsconfig.json` a `ignoreBuildErrors: true` dans `next.config.ts`
- Le build ne doit pas échouer sur des erreurs de types

## 📝 Notes importantes

- **Stockage de fichiers** : En production sur Vercel, les fichiers uploadés sont stockés temporairement dans `/tmp`. Pour un stockage persistant, utilisez Vercel Blob, AWS S3, ou Hostinger Object Storage.
- **Code secret super-admin** : `847825` (modifiable dans `src/lib/admin-secret.ts`)
- **Comptes de démo** : `admin@daraja.demo` / `daraja123`

## 🆘 Support

- Email : support@daraja.africa
- Direction : Bamako, Mali
