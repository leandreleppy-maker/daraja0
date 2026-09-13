// DARAJA — Seed de démonstration
// Crée : 3 plans, 1 organisation, 1 admin, 1 manager, 1 employé,
// une arborescence de dossiers, et ~12 documents classifiés par l'IA.

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";
import { classifyDocument } from "../src/lib/daraja-brain";

const db = new PrismaClient();

const PLANS = [
  {
    code: "gratuit",
    name: "Démarre",
    priceMonthlyFcfa: 0,
    storageGb: 5,
    maxUsers: 1,
    maxUploadsMonth: 100,
    features: JSON.stringify(["scan", "dossiers", "recherche"]),
  },
  {
    code: "entreprise",
    name: "Entreprise",
    priceMonthlyFcfa: 19900,
    storageGb: 200,
    maxUsers: 10,
    maxUploadsMonth: -1,
    features: JSON.stringify([
      "scan", "dossiers", "recherche", "ia", "workflow",
      "whatsapp", "signature", "prioritaire",
    ]),
  },
  {
    code: "etat",
    name: "Administration État",
    priceMonthlyFcfa: 99900,
    storageGb: 2000,
    maxUsers: -1,
    maxUploadsMonth: -1,
    features: JSON.stringify([
      "scan", "dossiers", "recherche", "ia", "workflow",
      "whatsapp", "signature", "api", "serveur_dedie",
      "audit", "formation", "iso_27001",
    ]),
  },
];

const DEMO_DOCS = [
  { filename: "Facture_CIE_Octobre_2026.pdf",     mime: "application/pdf", size: 248_000 },
  { filename: "Facture_SODECI_Septembre_2026.pdf", mime: "application/pdf", size: 196_500 },
  { filename: "Contrat_Prestation_SOTACI_2024.pdf",mime: "application/pdf", size: 542_000 },
  { filename: "Marche_Public_MP-2024-117.pdf",     mime: "application/pdf", size: 1_240_000 },
  { filename: "Bulletin_Paie_Septembre_2026.pdf",  mime: "application/pdf", size: 88_000 },
  { filename: "CV_Candidat_Kouame.pdf",            mime: "application/pdf", size: 142_000 },
  { filename: "Releve_Banque_Atlantique.pdf",      mime: "application/pdf", size: 312_000 },
  { filename: "Bon_Commande_BC-0892.pdf",          mime: "application/pdf", size: 74_000 },
  { filename: "Arrete_2026-145_MEM.pdf",           mime: "application/pdf", size: 224_000 },
  { filename: "Facture_Fournisseur_ABC_2026.pdf",  mime: "application/pdf", size: 168_000 },
  { filename: "Convocation_Reunion_2026.pdf",      mime: "application/pdf", size: 52_000 },
  { filename: "Scan_CNI_Directeur.jpg",            mime: "image/jpeg",      size: 92_000 },
];

const FOLDERS = [
  { name: "Comptabilité", color: "#003366", icon: "Calculator" },
  { name: "Ressources Humaines", color: "#00A651", icon: "Users" },
  { name: "Juridique", color: "#D4AF37", icon: "Scale" },
  { name: "Marchés Publics", color: "#7c3aed", icon: "Landmark" },
  { name: "Administration", color: "#003366", icon: "Building2" },
];

async function main() {
  console.log("🚀 DARAJA — Seed commencé");

  // 1. Plans
  for (const p of PLANS) {
    await db.plan.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
  }
  console.log("✓ 3 plans créés");

  // 2. Organisations (plusieurs pour alimenter le dashboard super-admin)
  const org = await db.organization.create({
    data: {
      name: "Mairie de Bamako District 6",
      type: "mairie",
      country: "ML",
      city: "Bamako",
      phone: "+223 76 11 11 11",
    },
  });

  // Organisations supplémentaires pour le dashboard super-admin
  const extraOrgs = [
    { name: "Ministère des Finances du Mali", type: "ministere", country: "ML", city: "Bamako", planCode: "etat", phone: "+223 76 22 22 22" },
    { name: "Cabinet KANAGA Conseil", type: "cabinet", country: "ML", city: "Sikasso", planCode: "entreprise", phone: "+223 76 33 33 33" },
    { name: "ONG SAHEL Vert", type: "ong", country: "ML", city: "Mopti", planCode: "entreprise", phone: "+223 76 44 44 44" },
    { name: "Mairie de Cocody", type: "mairie", country: "CI", city: "Abidjan", planCode: "etat", phone: "+225 27 22 44 88" },
    { name: "PME Distribution Plus", type: "pme", country: "CI", city: "Abidjan", planCode: "entreprise", phone: "+225 07 88 88 88" },
    { name: "Mairie de Dakar Plateau", type: "mairie", country: "SN", city: "Dakar", planCode: "entreprise", phone: "+221 77 555 55 55" },
    { name: "TPE Coumba Couture", type: "tpe", country: "ML", city: "Bamako", planCode: "gratuit", phone: "+223 76 66 66 66" },
    { name: "Banque Atlantique Bamako", type: "banque", country: "ML", city: "Bamako", planCode: "etat", phone: "+223 76 77 77 77" },
  ];

  for (const eo of extraOrgs) {
    const eoRec = await db.organization.create({
      data: { name: eo.name, type: eo.type, country: eo.country, city: eo.city, phone: eo.phone },
    });
    // Crée un utilisateur admin pour cette org
    const eoUser = await db.user.create({
      data: {
        email: `admin@${eo.name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12)}.demo`,
        name: `Admin ${eo.name.split(" ")[0]}`,
        passwordHash: hashPassword("daraja123"),
        phone: eo.phone,
      },
    });
    await db.member.create({
      data: { userId: eoUser.id, organizationId: eoRec.id, role: "admin" },
    });
    const plan = await db.plan.findUnique({ where: { code: eo.planCode } });
    if (plan) {
      await db.subscription.create({
        data: {
          organizationId: eoRec.id,
          planId: plan.id,
          status: "active",
          paymentProvider: "virement",
          startedAt: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 3600 * 1000)),
        },
      });
    }
    // 2-8 documents factices pour cette org
    const nDocs = 2 + Math.floor(Math.random() * 7);
    for (let i = 0; i < nDocs; i++) {
      const fakeName = DEMO_DOCS[Math.floor(Math.random() * DEMO_DOCS.length)];
      const ai = classifyDocument({ filename: fakeName.filename, mimeType: fakeName.mime, sizeBytes: fakeName.size });
      await db.document.create({
        data: {
          title: ai.suggestedTitle,
          type: fakeName.mime.includes("pdf") ? "pdf" : "image",
          mimeType: fakeName.mime,
          sizeBytes: fakeName.size,
          storagePath: `documents/seed_${fakeName.filename.replace(/[^a-z0-9]/gi, "_")}`,
          aiCategory: ai.category,
          aiTags: JSON.stringify(ai.tags),
          aiOcrText: ai.ocrText,
          aiLanguage: ai.language,
          aiConfidence: ai.confidence,
          status: ai.confidence > 0.7 ? "validated" : "uploaded",
          organizationId: eoRec.id,
          uploadedById: eoUser.id,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 3600 * 1000)),
        },
      });
    }
  }

  // 3. Utilisateurs
  const admin = await db.user.create({
    data: {
      email: "admin@daraja.demo",
      name: "Aïcha Koné",
      passwordHash: hashPassword("daraja123"),
      phone: null,
      twoFactorOn: false,
      superAdmin: true,  // Super-admin de la plateforme DARAJA
    },
  });
  const manager = await db.user.create({
    data: {
      email: "manager@daraja.demo",
      name: "Mamadou Traoré",
      passwordHash: hashPassword("daraja123"),
      phone: "+223 76 00 00 02",
    },
  });
  const employe = await db.user.create({
    data: {
      email: "employe@daraja.demo",
      name: "Fatou Diabaté",
      passwordHash: hashPassword("daraja123"),
      phone: "+223 76 00 00 03",
    },
  });

  // 4. Membres
  await db.member.createMany({
    data: [
      { userId: admin.id, organizationId: org.id, role: "admin" },
      { userId: manager.id, organizationId: org.id, role: "manager" },
      { userId: employe.id, organizationId: org.id, role: "employe" },
    ],
  });

  // 5. Souscription (plan État pour la démo)
  const planEtat = await db.plan.findUnique({ where: { code: "etat" } });
  if (planEtat) {
    await db.subscription.create({
      data: {
        organizationId: org.id,
        planId: planEtat.id,
        status: "active",
        paymentProvider: "virement",
      },
    });
  }

  // 6. Dossiers
  for (const f of FOLDERS) {
    await db.folder.create({
      data: {
        name: f.name,
        color: f.color,
        icon: f.icon,
        organizationId: org.id,
        createdBy: admin.id,
      },
    });
  }
  // Sous-dossiers
  const subFolders = [
    { name: "Factures", parent: "Comptabilité" },
    { name: "Relevés", parent: "Comptabilité" },
    { name: "Contrats", parent: "Juridique" },
    { name: "Bulletins de paie", parent: "Ressources Humaines" },
    { name: "CV", parent: "Ressources Humaines" },
  ];
  for (const sf of subFolders) {
    const parent = await db.folder.findFirst({
      where: { name: sf.parent, organizationId: org.id },
    });
    if (parent) {
      await db.folder.create({
        data: {
          name: sf.name,
          color: parent.color,
          icon: "Folder",
          parentId: parent.id,
          organizationId: org.id,
          createdBy: admin.id,
        },
      });
    }
  }

  // 7. Documents avec classification IA
  const allFolders = await db.folder.findMany({ where: { organizationId: org.id } });
  const findFolder = (name: string) =>
    allFolders.find((f) => f.name.toLowerCase().includes(name.toLowerCase()));

  for (const d of DEMO_DOCS) {
    const ai = classifyDocument({ filename: d.filename, mimeType: d.mime, sizeBytes: d.size });

    // Mapping folder heuristique
    let folderId: string | null = null;
    if (ai.category.includes("Compta")) folderId = findFolder("Factures")?.id ?? null;
    else if (ai.category.includes("RH")) folderId = findFolder("paie")?.id ?? findFolder("CV")?.id ?? null;
    else if (ai.category.includes("Juridique")) folderId = findFolder("Contrats")?.id ?? null;
    else if (ai.category.includes("Marchés")) folderId = findFolder("Marchés")?.id ?? null;
    else if (ai.category.includes("Administration")) folderId = findFolder("Administration")?.id ?? null;

    await db.document.create({
      data: {
        title: ai.suggestedTitle,
        type: d.mime.includes("pdf") ? "pdf" : "image",
        mimeType: d.mime,
        sizeBytes: d.size,
        storagePath: `documents/seed_${d.filename.replace(/[^a-z0-9]/gi, "_")}`,
        aiCategory: ai.category,
        aiTags: JSON.stringify(ai.tags),
        aiOcrText: ai.ocrText,
        aiLanguage: ai.language,
        aiConfidence: ai.confidence,
        status: ai.confidence > 0.7 ? "validated" : "uploaded",
        organizationId: org.id,
        folderId,
        uploadedById: admin.id,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 3600 * 1000)),
      },
    });
  }

  // 8. Audit logs
  await db.auditLog.createMany({
    data: [
      {
        organizationId: org.id,
        userId: admin.id,
        action: "login",
        targetType: "user",
        targetId: admin.id,
        metadata: JSON.stringify({ method: "password" }),
        ipAddress: "127.0.0.1",
      },
      {
        organizationId: org.id,
        userId: admin.id,
        action: "upload",
        targetType: "document",
        metadata: JSON.stringify({ count: DEMO_DOCS.length }),
        ipAddress: "127.0.0.1",
      },
    ],
  });

  console.log("✓ Organisation, 3 utilisateurs, 10 dossiers, 12 documents, audit logs");
  console.log("\n🔑 Comptes de démo :");
  console.log("   admin@daraja.demo    / daraja123    (rôle: admin)");
  console.log("   manager@daraja.demo  / daraja123    (rôle: manager)");
  console.log("   employe@daraja.demo  / daraja123    (rôle: employé)");
  console.log("\n✅ Seed terminé");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
