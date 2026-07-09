// ── seed.ts — Semer la base de données Repora avec des données de démo en français ──
// Compatible avec tsx (dev) ET Docker (JS compilé) grâce aux imports ESM dynamiques.
// Les UUIDs sont en minuscules hexadécimales (a-f, 0-9) — pas de lettres au-delà de 'f'.
// Utilise db.insert().onConflictDoNothing() pour permettre une ré-exécution sans erreur.

import { config } from '../config.js'
const queryClient = (await import('postgres')).default(config.databaseUrl)
const { drizzle } = await import('drizzle-orm/postgres-js')
const schema = await import('./schema.js')
const db = drizzle(queryClient, { schema })

const bcrypt = await import('bcryptjs')
const crypto = await import('crypto')

// ── Tables de schéma ──
const {
  users,
  projects,
  requirements,
  documents,
  sections,
  diagrams,
  comments,
  validations,
  templates,
  agentConfigs,
  apiKeys,
  auditLogs,
} = schema

const hash = (pw: string) => bcrypt.default.hashSync(pw, 12)

async function seed() {
  console.log('🌱 Semis de la base de données Repora...')

  // ═══════════════════════════════════════════════════════════════
  //  1. UTILISATEURS (6)
  // ═══════════════════════════════════════════════════════════════
  await db
    .insert(users)
    .values([
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        name: 'Admin Repora',
        email: 'admin@repora.dev',
        passwordHash: hash('admin123'),
        role: 'super_admin',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000002',
        name: 'Jean Dupont',
        email: 'jean@exemple.com',
        passwordHash: hash('test123'),
        role: 'redacteur',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000003',
        name: 'Marie Lambert',
        email: 'marie@exemple.com',
        passwordHash: hash('test123'),
        role: 'redacteur',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000004',
        name: 'Client SARL',
        email: 'client@exemple.com',
        passwordHash: hash('client123'),
        role: 'validateur',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000005',
        name: 'Elena Rodriguez',
        email: 'elena@repora.dev',
        passwordHash: hash('test123'),
        role: 'validateur',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000006',
        name: 'Sarah Kone',
        email: 'sarah@repora.dev',
        passwordHash: hash('test123'),
        role: 'admin',
      },
    ])
    .onConflictDoNothing()
  console.log('  ✅ 6 utilisateurs')

  // ═══════════════════════════════════════════════════════════════
  //  2. PROJETS (5) — Briefs réalistes en français
  // ═══════════════════════════════════════════════════════════════
  await db
    .insert(projects)
    .values([
      {
        id: 'b0000000-0000-0000-0000-000000000001',
        ownerId: 'a0000000-0000-0000-0000-000000000002', // Jean
        name: 'Cadre juridique IA — Conformité EU AI Act',
        brief:
          "Le présent projet vise à établir le cadre juridique complet pour la conformité des systèmes d'intelligence artificielle déployés par l'organisation au regard du règlement européen sur l'IA (AI Act). Il couvre la classification des risques, la documentation technique, la transparence algorithmique et les obligations de surveillance humaine pour les systèmes à haut risque.",
        status: 'draft',
      },
      {
        id: 'b0000000-0000-0000-0000-000000000002',
        ownerId: 'a0000000-0000-0000-0000-000000000002', // Jean
        name: 'Refonte architecture — Scalabilité 10x',
        brief:
          "Refonte complète de l'architecture backend monolithique actuelle vers une architecture microservices capable de supporter une charge 10x supérieure. L'objectif est de maintenir une latence inférieure à 50ms au 99e percentile tout en assurant une disponibilité de 99,95 %. Le projet couvre l'API Gateway, le message broker, le cache distribué et la base de données shardée.",
        status: 'draft',
      },
      {
        id: 'b0000000-0000-0000-0000-000000000003',
        ownerId: 'a0000000-0000-0000-0000-000000000003', // Marie
        name: 'Politique de gouvernance des systèmes IA',
        brief:
          "Élaboration d'une politique de gouvernance institutionnelle pour tous les systèmes d'IA développés ou exploités par l'organisation. Elle définit les rôles (Chief Data Officer, Comité d'éthique IA, Data Stewards, Model Owners), les processus de validation avant mise en production, et les mécanismes de surveillance continue des biais et de la dérive des modèles.",
        status: 'draft',
      },
      {
        id: 'b0000000-0000-0000-0000-000000000004',
        ownerId: 'a0000000-0000-0000-0000-000000000006', // Sarah
        name: 'Étude de marché — Solutions SaaS Juridiques',
        brief:
          "Analyse stratégique trimestrielle du marché des solutions SaaS B2B dans le secteur juridique. Le document couvre la taille du marché adressable (TAM/SAM/SOM), l'analyse concurrentielle de 12 acteurs, les tendances réglementaires et les opportunités de croissance sur le segment PME et le marché DACH.",
        status: 'draft',
      },
      {
        id: 'b0000000-0000-0000-0000-000000000005',
        ownerId: 'a0000000-0000-0000-0000-000000000002', // Jean
        name: 'Contrat de services — ProClean SA',
        brief:
          "Contrat cadre de prestation de services de nettoyage industriel pour le compte de ProClean SA. Le contrat couvre les zones d'intervention (salles blanches ISO 7 incluses), les fréquences de passage, les KPI qualité, les engagements de niveau de service (SLA), les pénalités progressives et les clauses financières avec révision annuelle.",
        status: 'draft',
      },
    ])
    .onConflictDoNothing()
  console.log('  ✅ 5 projets')

  // ═══════════════════════════════════════════════════════════════
  //  3. DOCUMENTS (7)
  // ═══════════════════════════════════════════════════════════════
  await db
    .insert(documents)
    .values([
      {
        id: 'c0000000-0000-0000-0000-000000000001',
        projectId: 'b0000000-0000-0000-0000-000000000001',
        status: 'draft',
        outline: {
          chapters: [
            'Contexte et objectifs',
            'Définitions et terminologie',
            'Exigences de conformité',
            'Gouvernance des données',
            "Plan d'audit et de contrôle",
          ],
        },
      },
      {
        id: 'c0000000-0000-0000-0000-000000000002',
        projectId: 'b0000000-0000-0000-0000-000000000002',
        status: 'draft',
        outline: {
          chapters: [
            'Introduction',
            'Architecture actuelle',
            'Architecture cible',
            'Plan de migration',
          ],
        },
      },
      {
        id: 'c0000000-0000-0000-0000-000000000003',
        projectId: 'b0000000-0000-0000-0000-000000000003',
        status: 'draft',
        outline: {
          chapters: [
            'Périmètre de la gouvernance IA',
            'Rôles et responsabilités',
            'Évaluation des risques',
            'Politique de transparence',
          ],
        },
      },
      {
        id: 'c0000000-0000-0000-0000-000000000004',
        projectId: 'b0000000-0000-0000-0000-000000000004',
        status: 'draft',
        outline: {
          chapters: [
            'Résumé exécutif',
            'Analyse concurrentielle',
            'Opportunités de croissance',
          ],
        },
      },
      {
        id: 'c0000000-0000-0000-0000-000000000005',
        projectId: 'b0000000-0000-0000-0000-000000000005',
        status: 'draft',
        outline: {
          chapters: [
            'Définitions et interprétation',
            'Services et livrables',
            'SLA et pénalités',
            'Clauses financières',
          ],
        },
      },
      {
        id: 'c0000000-0000-0000-0000-000000000006',
        projectId: 'b0000000-0000-0000-0000-000000000001',
        status: 'draft',
        outline: { chapters: ['Annexe technique — Conformité RGPD'] },
      },
      {
        id: 'c0000000-0000-0000-0000-000000000007',
        projectId: 'b0000000-0000-0000-0000-000000000003',
        status: 'draft',
        outline: {
          chapters: ['Benchmark des frameworks de gouvernance IA'],
        },
      },
    ])
    .onConflictDoNothing()
  console.log('  ✅ 7 documents')

  // ═══════════════════════════════════════════════════════════════
  //  4. SECTIONS (22) — Contenu réaliste en français, agents/modèles variés
  // ═══════════════════════════════════════════════════════════════
  await db
    .insert(sections)
    .values([
      // Document 1 — Cadre juridique IA
      {
        id: 'd0000000-0000-0000-0000-000000000001',
        documentId: 'c0000000-0000-0000-0000-000000000001',
        order: 1,
        title: 'Contexte et objectifs',
        content:
          "Le présent document définit le cadre juridique applicable aux systèmes d'intelligence artificielle déployés par l'organisation, conformément au règlement européen sur l'IA (AI Act). Il couvre les aspects de conformité, de gestion des risques et de transparence algorithmique. L'objectif est d'assurer que tous les systèmes d'IA mis en production respectent les exigences légales en vigueur et anticipent les évolutions réglementaires à horizon 2027.",
        status: 'done',
        generatedByAgent: 'Writer',
        modelUsed: 'llama3.1:8b',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000002',
        documentId: 'c0000000-0000-0000-0000-000000000001',
        order: 2,
        title: 'Définitions et terminologie',
        content:
          "Cette section établit les définitions clés utilisées dans le document : système d'IA, données d'entraînement, biais algorithmique, explicabilité, auditabilité et supervision humaine. Chaque terme est aligné avec les standards ISO/IEC 42001, le glossaire de l'AI Act et les recommandations du NIST AI RMF. Une attention particulière est portée à la distinction entre systèmes à haut risque et systèmes à risque limité.",
        status: 'done',
        generatedByAgent: 'Writer',
        modelUsed: 'llama3.1:8b',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000003',
        documentId: 'c0000000-0000-0000-0000-000000000001',
        order: 3,
        title: 'Exigences de conformité',
        content:
          "Les exigences de conformité couvrent cinq axes : (1) classification des risques selon la grille de l'AI Act, (2) documentation technique exhaustive pour les systèmes à haut risque, (3) enregistrement des systèmes dans la base de données européenne, (4) mécanismes de surveillance humaine avec droit d'override, (5) transparence et obligation d'information des utilisateurs finaux. Chaque exigence est déclinée en critères mesurables avec échéancier de mise en conformité.",
        status: 'active',
        generatedByAgent: 'Writer',
        modelUsed: 'llama3.1:8b',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000004',
        documentId: 'c0000000-0000-0000-0000-000000000001',
        order: 4,
        title: 'Gouvernance des données',
        content:
          "Ce chapitre détaille les politiques de collecte, stockage, traitement et rétention des données utilisées pour l'entraînement et l'exploitation des modèles d'IA. Les principes de minimisation, de limitation des finalités et de transparence issus du RGPD sont appliqués. Le document spécifie également les mesures techniques et organisationnelles pour garantir l'intégrité et la confidentialité des jeux de données.",
        status: 'draft',
        generatedByAgent: 'Planner',
        modelUsed: 'llama3.1:8b',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000005',
        documentId: 'c0000000-0000-0000-0000-000000000001',
        order: 5,
        title: "Plan d'audit et de contrôle",
        content:
          "Définition du calendrier d'audit périodique, des métriques de performance, des seuils d'alerte, et des procédures de remédiation en cas de non-conformité détectée. Le plan prévoit un audit interne semestriel et un audit externe annuel par un organisme tiers indépendant. Les résultats sont consignés dans un registre accessible au régulateur sur demande.",
        status: 'draft',
        generatedByAgent: 'Planner',
        modelUsed: 'llama3.1:8b',
      },
      // Document 2 — Architecture
      {
        id: 'd0000000-0000-0000-0000-000000000006',
        documentId: 'c0000000-0000-0000-0000-000000000002',
        order: 1,
        title: 'Introduction',
        content:
          "Le protocole de scalabilité infrastructure v2 vise à faire évoluer l'architecture actuelle pour supporter une charge 10x supérieure tout en maintenant une latence inférieure à 50ms au 99e percentile. Le document présente un diagnostic de l'existant, une architecture cible basée sur les microservices, et un plan de migration progressif en trois phases pour minimiser les interruptions de service.",
        status: 'done',
        generatedByAgent: 'Writer',
        modelUsed: 'llama3.1:8b',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000007',
        documentId: 'c0000000-0000-0000-0000-000000000002',
        order: 2,
        title: 'Architecture actuelle',
        content:
          "Analyse de l'architecture monolithique existante : nginx en frontal, une application Node.js monolithique, PostgreSQL comme base unique. Les goulots d'étranglement identifiés incluent la saturation des connexions DB à 200 req/s, une latence moyenne de 120ms, l'absence de cache distribué et un couplage fort entre les modules d'authentification, de génération de documents et d'export.",
        status: 'done',
        generatedByAgent: 'Writer',
        modelUsed: 'llama3.1:8b',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000008',
        documentId: 'c0000000-0000-0000-0000-000000000002',
        order: 3,
        title: 'Architecture cible',
        content:
          "Migration vers une architecture microservices avec API Gateway (Kong), file de messages (RabbitMQ), cache distribué (Redis Cluster) et base de données shardée (PostgreSQL avec Citus). Ajout de workers asynchrones pour les tâches de génération IA. L'architecture cible permet un scaling horizontal indépendant par service et une tolérance aux pannes avec basculement automatique.",
        status: 'active',
        generatedByAgent: 'Writer',
        modelUsed: 'llama3.1:8b',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000009',
        documentId: 'c0000000-0000-0000-0000-000000000002',
        order: 4,
        title: 'Plan de migration',
        content:
          "Migration en trois phases sur six mois : Phase 1 (mois 1-2) — extraction du module d'authentification en service indépendant avec JWT. Phase 2 (mois 3-4) — découpage des services document et génération AI avec mise en place de RabbitMQ. Phase 3 (mois 5-6) — mise à l'échelle horizontale avec Kubernetes, sharding PostgreSQL et basculement définitif. Chaque phase inclut des tests de non-régression et un plan de rollback.",
        status: 'draft',
        generatedByAgent: 'Planner',
        modelUsed: 'llama3.1:8b',
      },
      // Document 3 — Gouvernance IA
      {
        id: 'd0000000-0000-0000-0000-000000000010',
        documentId: 'c0000000-0000-0000-0000-000000000003',
        order: 1,
        title: 'Périmètre de la gouvernance IA',
        content:
          "Ce document définit le cadre de gouvernance pour tous les systèmes d'IA développés ou déployés par l'organisation, incluant les chatbots internes, les outils d'analyse prédictive, les systèmes de recommandation et les modèles de classification automatique de documents. Le périmètre couvre l'ensemble du cycle de vie : conception, développement, validation, déploiement, supervision et mise hors service.",
        status: 'done',
        generatedByAgent: 'Writer',
        modelUsed: 'claude-3-5-sonnet-20241022',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000011',
        documentId: 'c0000000-0000-0000-0000-000000000003',
        order: 2,
        title: 'Rôles et responsabilités',
        content:
          "Définition claire des rôles de gouvernance : le Chief Data Officer (CDO) est responsable de la stratégie globale et de la conformité réglementaire. Le Comité d'Éthique IA, composé de représentants métiers, juridiques et techniques, valide chaque nouveau cas d'usage avant développement. Les Data Stewards garantissent la qualité et la provenance des données d'entraînement. Les Model Owners assurent le suivi des performances en production et la gestion des dérives.",
        status: 'done',
        generatedByAgent: 'Writer',
        modelUsed: 'claude-3-5-sonnet-20241022',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000012',
        documentId: 'c0000000-0000-0000-0000-000000000003',
        order: 3,
        title: 'Évaluation des risques',
        content:
          "Matrice de risques identifiant les scénarios de défaillance : biais discriminatoire dans les algorithmes de scoring, dérive de modèle (model drift), attaques adverses (data poisoning, evasion attacks), fuite de données sensibles et utilisation détournée des sorties de modèles. Chaque risque est évalué selon sa probabilité d'occurrence (faible/moyenne/élevée) et son impact potentiel, avec des mesures de mitigation spécifiques.",
        status: 'active',
        generatedByAgent: 'Tables',
        modelUsed: 'claude-3-5-sonnet-20241022',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000013',
        documentId: 'c0000000-0000-0000-0000-000000000003',
        order: 4,
        title: 'Politique de transparence',
        content:
          "Engagements de transparence envers les parties prenantes : publication semestrielle d'un registre des modèles actifs, documentation exhaustive des jeux de données d'entraînement, rapports trimestriels de performance et d'équité algorithmique, et droit d'explication pour les décisions automatisées impactant les utilisateurs. Le registre est public et accessible sur le portail de gouvernance de l'organisation.",
        status: 'draft',
        generatedByAgent: 'Planner',
        modelUsed: 'claude-3-5-sonnet-20241022',
      },
      // Document 4 — Étude de marché
      {
        id: 'd0000000-0000-0000-0000-000000000014',
        documentId: 'c0000000-0000-0000-0000-000000000004',
        order: 1,
        title: 'Résumé exécutif',
        content:
          "Analyse trimestrielle du marché des solutions SaaS B2B dans le secteur juridique couvrant le troisième trimestre 2024. Croissance de 12 % du TAM (Total Addressable Market) estimé à 4,8 milliards EUR. Intensification concurrentielle marquée par l'entrée de trois nouveaux acteurs sur le segment conformité. Opportunité stratégique identifiée sur le segment PME, sous-équipé en solutions de gestion documentaire juridique.",
        status: 'done',
        generatedByAgent: 'Writer',
        modelUsed: 'llama3.1:8b',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000015',
        documentId: 'c0000000-0000-0000-0000-000000000004',
        order: 2,
        title: 'Analyse concurrentielle',
        content:
          "Cartographie détaillée de 12 concurrents directs et indirects répartis en trois catégories : pure players SaaS juridiques, suites ERP avec module legal, et cabinets de conseil digitalisés. Analyse SWOT comparative : forces (UX, intégration API), faiblesses (support client lent, personnalisation limitée), opportunités (marché DACH, LegalTech PME), menaces (consolidation du marché, régulation croissante).",
        status: 'done',
        generatedByAgent: 'Writer',
        modelUsed: 'llama3.1:8b',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000016',
        documentId: 'c0000000-0000-0000-0000-000000000004',
        order: 3,
        title: 'Opportunités de croissance',
        content:
          "Trois axes stratégiques de croissance identifiés pour les 12 à 18 prochains mois : (1) expansion sur le marché DACH (Allemagne, Autriche, Suisse) via un partenariat avec un distributeur local, (2) développement d'un package LegalTech dédié aux cabinets d'avocats de 5 à 50 collaborateurs, (3) partenariat technologique avec les éditeurs de logiciels juridiques existants pour intégrer notre moteur IA en marque blanche.",
        status: 'draft',
        generatedByAgent: 'Planner',
        modelUsed: 'llama3.1:8b',
      },
      // Document 5 — Contrat ProClean
      {
        id: 'd0000000-0000-0000-0000-000000000017',
        documentId: 'c0000000-0000-0000-0000-000000000005',
        order: 1,
        title: 'Définitions et interprétation',
        content:
          "Définitions des termes clés du contrat : Services (prestations de nettoyage industriel), Livrables (rapports d'audit, certificats de conformité), Propriété Intellectuelle (méthodologies et protocoles), Données Confidentielles (plans des sites, fiches de sécurité), SLA (Service Level Agreement), Périmètre (zones géographiques et types d'intervention). Le contrat inclut une clause de hiérarchie des documents contractuels en cas de contradiction.",
        status: 'done',
        generatedByAgent: 'Writer',
        modelUsed: 'gpt-4o',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000018',
        documentId: 'c0000000-0000-0000-0000-000000000005',
        order: 2,
        title: 'Services et livrables',
        content:
          "Description détaillée des services : nettoyage quotidien des zones de production (12 000 m²), entretien hebdomadaire des salles blanches ISO 7 (3 500 m²), désinfection mensuelle des surfaces de contact, gestion des déchets industriels. Équipements fournis par le prestataire : autolaveuses, aspirateurs industriels HEPA, produits de nettoyage certifiés ECOCERT. KPI qualité : audits visuels hebdomadaires et prélèvements microbiologiques mensuels.",
        status: 'active',
        generatedByAgent: 'Writer',
        modelUsed: 'gpt-4o',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000019',
        documentId: 'c0000000-0000-0000-0000-000000000005',
        order: 3,
        title: 'SLA et pénalités',
        content:
          "Engagements de niveau de service : disponibilité opérationnelle 99,5 %, temps de réponse inférieur à 4 heures pour les incidents critiques, temps de résolution inférieur à 24 heures ouvrées. En cas de non-respect, application de pénalités progressives : 5 % de la facturation mensuelle pour un premier manquement, 10 % pour le deuxième, 20 % pour le troisième. Trois manquements consécutifs autorisent la résiliation unilatérale sans indemnité.",
        status: 'draft',
        generatedByAgent: 'Writer',
        modelUsed: 'gpt-4o',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000020',
        documentId: 'c0000000-0000-0000-0000-000000000005',
        order: 4,
        title: 'Clauses financières',
        content:
          "Structure tarifaire : forfait mensuel de 45 000 EUR HT pour le périmètre standard. Révision annuelle automatique indexée sur l'indice SYNTEC + 2 %. Facturation trimestrielle à échoir, délai de paiement de 30 jours nets à compter de la date d'émission. Pénalités de retard de paiement au taux BCE + 10 points. Dépôt de garantie de 30 000 EUR à la signature, restituable au terme du contrat.",
        status: 'draft',
        generatedByAgent: 'Planner',
        modelUsed: 'gpt-4o',
      },
      // Document 6 — Annexe RGPD
      {
        id: 'd0000000-0000-0000-0000-000000000021',
        documentId: 'c0000000-0000-0000-0000-000000000006',
        order: 1,
        title: 'Annexe technique — Conformité RGPD',
        content:
          "Annexe détaillée sur la conformité RGPD du traitement des données personnelles dans le cadre du projet IA. La base légale du traitement est l'intérêt légitime (article 6.1.f). Catégories de données traitées : données d'identification, données professionnelles, métadonnées de connexion. Durées de conservation : 3 ans pour les données actives, archivage intermédiaire de 5 ans, destruction sécurisée au terme. Mesures techniques : chiffrement AES-256 au repos, TLS 1.3 en transit, pseudonymisation des données d'entraînement.",
        status: 'done',
        generatedByAgent: 'Writer',
        modelUsed: 'llama3.1:8b',
      },
      // Document 7 — Benchmark gouvernance
      {
        id: 'd0000000-0000-0000-0000-000000000022',
        documentId: 'c0000000-0000-0000-0000-000000000007',
        order: 1,
        title: 'Benchmark des frameworks de gouvernance IA',
        content:
          "Analyse comparative des trois principaux frameworks de gouvernance de l'IA : NIST AI RMF 1.0, ISO/IEC 42001:2023, et le cadre de conformité de l'EU AI Act. Comparaison sur 12 critères incluant la couverture du cycle de vie, la gestion des biais, les exigences de documentation, la supervision humaine, et l'interopérabilité avec les normes de sécurité existantes (ISO 27001). Recommandation d'adopter NIST AI RMF comme base avec alignement complémentaire sur ISO/IEC 42001 pour la certification.",
        status: 'done',
        generatedByAgent: 'Writer',
        modelUsed: 'claude-3-5-sonnet-20241022',
      },
    ])
    .onConflictDoNothing()
  console.log('  ✅ 22 sections')

  // ═══════════════════════════════════════════════════════════════
  //  5. DIAGRAMMES (4) — PlantUML source
  // ═══════════════════════════════════════════════════════════════
  await db
    .insert(diagrams)
    .values([
      {
        id: 'e0000000-0000-0000-0000-000000000001',
        projectId: 'b0000000-0000-0000-0000-000000000002',
        type: 'sequence',
        plantumlSource:
          "@startuml\nactor Utilisateur\nparticipant API\nparticipant Worker\nparticipant Cache\ndatabase DB\nUtilisateur -> API: Requête\nAPI -> Cache: Vérifier cache\nCache --> API: Hit/Miss\nAPI -> Worker: Enqueue job\nWorker -> DB: Traitement\nWorker --> API: Résultat\nAPI --> Utilisateur: Réponse\n@enduml",
        renderedUrl: '/rendered/diag-001.svg',
      },
      {
        id: 'e0000000-0000-0000-0000-000000000002',
        projectId: 'b0000000-0000-0000-0000-000000000002',
        type: 'deployment',
        plantumlSource:
          "@startuml\nnode \"Frontend (nginx)\" as FE\nnode \"API Gateway\" as GW\nnode \"Service Auth\" as Auth\nnode \"Service Docs\" as Docs\nnode \"Worker IA\" as AI\ndatabase \"PostgreSQL\" as DB\ndatabase \"Redis\" as Cache\nFE --> GW\nGW --> Auth\nGW --> Docs\nDocs --> AI\nAI --> DB\nDocs --> Cache\n@enduml",
        renderedUrl: '/rendered/diag-002.svg',
      },
      {
        id: 'e0000000-0000-0000-0000-000000000003',
        projectId: 'b0000000-0000-0000-0000-000000000003',
        type: 'activity',
        plantumlSource:
          '@startuml\nstart\n:Proposer un nouveau modèle IA;\n:Évaluation initiale des risques;\nif (Niveau de risque?) then (Haut)\n  :Soumettre au Comité Éthique;\n  :Audit externe obligatoire;\nelse (Moyen)\n  :Revue par le CDO;\n  :Documentation technique;\nelse (Faible)\n  :Auto-approbation;\n  :Enregistrement simple;\nendif\n:Déploiement en production;\n:Surveillance continue;\nstop\n@enduml',
        renderedUrl: '/rendered/diag-003.svg',
      },
      {
        id: 'e0000000-0000-0000-0000-000000000004',
        projectId: 'b0000000-0000-0000-0000-000000000004',
        type: 'class',
        plantumlSource:
          "@startuml\nclass Marche {\n  +nom: string\n  +taille: number\n  +croissance: number\n  +acteurs: int\n}\nclass Segment {\n  +nom: string\n  +tam: number\n  +sam: number\n  +som: number\n}\nclass Concurrent {\n  +nom: string\n  +partMarche: number\n  +forces: string[]\n  +faiblesses: string[]\n}\nMarche \"1\" --> \"*\" Segment\nMarche \"1\" --> \"*\" Concurrent\n@enduml",
        renderedUrl: '/rendered/diag-004.svg',
      },
    ])
    .onConflictDoNothing()
  console.log('  ✅ 4 diagrammes')

  // ═══════════════════════════════════════════════════════════════
  //  6. COMMENTAIRES (6) — Résolus et non résolus
  // ═══════════════════════════════════════════════════════════════
  await db
    .insert(comments)
    .values([
      {
        id: 'f0000000-0000-0000-0000-000000000001',
        sectionId: 'd0000000-0000-0000-0000-000000000003',
        authorId: 'a0000000-0000-0000-0000-000000000006', // Sarah
        text: "Vérifier les seuils de classification des risques avec la version finale de l'EU AI Act publiée en juillet 2024.",
        resolved: false,
      },
      {
        id: 'f0000000-0000-0000-0000-000000000002',
        sectionId: 'd0000000-0000-0000-0000-000000000003',
        authorId: 'a0000000-0000-0000-0000-000000000002', // Jean
        text: "J'ai vérifié les seuils et ajouté les références au JOUE du 12 juillet 2024. Conforme pour validation.",
        resolved: true,
      },
      {
        id: 'f0000000-0000-0000-0000-000000000003',
        sectionId: 'd0000000-0000-0000-0000-000000000008',
        authorId: 'a0000000-0000-0000-0000-000000000003', // Marie
        text: "RabbitMQ est-il vraiment nécessaire ? Redis Streams pourrait suffire pour notre volume de messages actuel (< 5000/sec).",
        resolved: false,
      },
      {
        id: 'f0000000-0000-0000-0000-000000000004',
        sectionId: 'd0000000-0000-0000-0000-000000000012',
        authorId: 'a0000000-0000-0000-0000-000000000006', // Sarah
        text: 'Ajouter une colonne pour le coût estimé de mitigation de chaque risque dans la matrice.',
        resolved: false,
      },
      {
        id: 'f0000000-0000-0000-0000-000000000005',
        sectionId: 'd0000000-0000-0000-0000-000000000018',
        authorId: 'a0000000-0000-0000-0000-000000000002', // Jean
        text: "Les KPI qualité doivent être mesurables et vérifiables. Ajouter des seuils chiffrés pour chaque zone d'intervention.",
        resolved: false,
      },
      {
        id: 'f0000000-0000-0000-0000-000000000006',
        sectionId: 'd0000000-0000-0000-0000-000000000001',
        authorId: 'a0000000-0000-0000-0000-000000000001', // Admin
        text: 'Section complète et documentée. Conforme au plan type validé par le comité de pilotage.',
        resolved: true,
      },
    ])
    .onConflictDoNothing()
  console.log('  ✅ 6 commentaires')

  // ═══════════════════════════════════════════════════════════════
  //  7. EXIGENCES (9) — Fonctionnelles et non fonctionnelles
  // ═══════════════════════════════════════════════════════════════
  await db
    .insert(requirements)
    .values([
      {
        id: 'c0000000-0000-0000-0000-000000000001',
        projectId: 'b0000000-0000-0000-0000-000000000001',
        type: 'functional',
        text: "Le système doit classifier automatiquement les modèles IA selon les quatre catégories de risque de l'EU AI Act.",
        sourceActor: 'Compliance Officer',
      },
      {
        id: 'c0000000-0000-0000-0000-000000000002',
        projectId: 'b0000000-0000-0000-0000-000000000001',
        type: 'non_functional',
        text: 'Le registre des modèles doit être consultable avec une latence inférieure à 200ms pour un volume de 10 000 entrées.',
        sourceActor: 'IT Architect',
      },
      {
        id: 'c0000000-0000-0000-0000-000000000003',
        projectId: 'b0000000-0000-0000-0000-000000000002',
        type: 'functional',
        text: "L'API Gateway doit supporter un débit de 10 000 requêtes par seconde avec un taux d'erreur inférieur à 0,1 %.",
        sourceActor: 'Lead Developer',
      },
      {
        id: 'c0000000-0000-0000-0000-000000000004',
        projectId: 'b0000000-0000-0000-0000-000000000002',
        type: 'non_functional',
        text: 'Temps de réponse au 99e percentile inférieur à 50ms pour les endpoints de lecture simples.',
        sourceActor: 'SRE Team',
      },
      {
        id: 'c0000000-0000-0000-0000-000000000005',
        projectId: 'b0000000-0000-0000-0000-000000000003',
        type: 'functional',
        text: "Le Comité d'Éthique IA doit pouvoir auditer tout nouveau modèle avant sa mise en production.",
        sourceActor: 'CDO',
      },
      {
        id: 'c0000000-0000-0000-0000-000000000006',
        projectId: 'b0000000-0000-0000-0000-000000000003',
        type: 'functional',
        text: 'Un tableau de bord de monitoring des biais algorithmiques doit être accessible en temps réel.',
        sourceActor: 'Data Scientist',
      },
      {
        id: 'c0000000-0000-0000-0000-000000000007',
        projectId: 'b0000000-0000-0000-0000-000000000004',
        type: 'functional',
        text: "Le rapport trimestriel doit inclure une analyse SWOT comparative couvrant au minimum 12 concurrents.",
        sourceActor: 'Marketing Director',
      },
      {
        id: 'c0000000-0000-0000-0000-000000000008',
        projectId: 'b0000000-0000-0000-0000-000000000005',
        type: 'functional',
        text: 'Le contrat doit inclure des clauses de pénalités progressives en cas de non-respect des SLA.',
        sourceActor: 'Legal Counsel',
      },
      {
        id: 'c0000000-0000-0000-0000-000000000009',
        projectId: 'b0000000-0000-0000-0000-000000000005',
        type: 'non_functional',
        text: 'Le contrat doit être exportable au format PDF/A pour archivage légal à long terme.',
        sourceActor: 'Legal Counsel',
      },
    ])
    .onConflictDoNothing()
  console.log('  ✅ 9 exigences')

  // ═══════════════════════════════════════════════════════════════
  //  8. VALIDATIONS (3) — En attente, Approuvée, Rejetée
  // ═══════════════════════════════════════════════════════════════
  await db
    .insert(validations)
    .values([
      {
        id: 'd0000000-0000-0000-0000-000000000001',
        documentId: 'c0000000-0000-0000-0000-000000000001',
        validatorToken: crypto.default.randomBytes(16).toString('hex'),
        decision: null,
        sectionReasons: null,
        decidedAt: null,
      },
      {
        id: 'd0000000-0000-0000-0000-000000000002',
        documentId: 'c0000000-0000-0000-0000-000000000004',
        validatorToken: crypto.default.randomBytes(16).toString('hex'),
        decision: 'approved',
        sectionReasons: {
          '1': 'Résumé exécutif clair, chiffres bien sourcés et cohérents avec les données de marché.',
          '2': "Analyse concurrentielle exhaustive, le SWOT est particulièrement bien documenté.",
          '3': "Les trois axes de croissance sont pertinents et alignés avec la stratégie d'entreprise.",
        },
        decidedAt: new Date('2024-10-20'),
      },
      {
        id: 'd0000000-0000-0000-0000-000000000003',
        documentId: 'c0000000-0000-0000-0000-000000000005',
        validatorToken: crypto.default.randomBytes(16).toString('hex'),
        decision: 'rejected',
        sectionReasons: {
          '1': 'Ajouter une définition précise des Données Confidentielles couvrant les informations de sécurité des sites.',
          '2': 'Les protocoles pour salles blanches ISO 7 doivent être validés par notre responsable HSE avant acceptation.',
          '4': "La clause de révision annuelle (inflation + 2 %) est trop élevée. Nous proposons inflation + 1 % avec un plafond à 5 %.",
        },
        decidedAt: new Date('2024-10-27'),
      },
    ])
    .onConflictDoNothing()
  console.log('  ✅ 3 validations')

  // ═══════════════════════════════════════════════════════════════
  //  9. TEMPLATES (7) — Catégories : Juridique, Ingénierie, Finance, Sécurité, Marketing
  // ═══════════════════════════════════════════════════════════════
  await db
    .insert(templates)
    .values([
      {
        id: 'e0000000-0000-0000-0000-000000000001',
        name: 'Cahier des Charges Standard',
        category: 'Juridique',
        description: 'Cahier des charges complet avec sections standard pour projets informatiques',
        sections: ['Contexte', 'Exigences fonctionnelles', 'Exigences techniques', 'Architecture', 'Planning', 'Budget'],
      },
      {
        id: 'e0000000-0000-0000-0000-000000000002',
        name: 'Spécification Technique Détaillée',
        category: 'Ingénierie',
        description: 'Spécification technique détaillée pour projets logiciels complexes',
        sections: ["Vue d'ensemble", 'Architecture système', 'API et interfaces', 'Modèle de données', 'Sécurité', 'Déploiement et exploitation'],
      },
      {
        id: 'e0000000-0000-0000-0000-000000000003',
        name: 'Rapport Financier Trimestriel',
        category: 'Finance',
        description: 'Rapport financier structuré avec analyses et projections',
        sections: ['Résumé exécutif', 'Analyse des résultats', 'Trésorerie', 'Projections', 'Risques financiers', 'Recommandations'],
      },
      {
        id: 'e0000000-0000-0000-0000-000000000004',
        name: "Rapport d'Audit de Sécurité",
        category: 'Sécurité',
        description: "Rapport d'audit de sécurité complet selon référentiel ISO 27001",
        sections: ["Périmètre de l'audit", 'Vulnérabilités détectées', 'Analyse des risques', 'Plan de remédiation', 'Recommandations stratégiques'],
      },
      {
        id: 'e0000000-0000-0000-0000-000000000005',
        name: 'Analyse de Marché',
        category: 'Marketing',
        description: 'Étude de marché structurée avec analyse concurrentielle approfondie',
        sections: ['Contexte et périmètre', 'Analyse du marché', 'Analyse concurrentielle', 'Segmentation client', 'Opportunités', 'Stratégie recommandée'],
      },
      {
        id: 'e0000000-0000-0000-0000-000000000006',
        name: 'Master Service Agreement',
        category: 'Juridique',
        description: 'Contrat cadre de services avec SLA, pénalités et clauses financières standard',
        sections: ['Définitions', 'Objet et périmètre', 'Services et livrables', 'SLA et engagements', 'Clauses financières', 'Durée et résiliation', 'Litiges et juridiction'],
      },
      {
        id: 'e0000000-0000-0000-0000-000000000007',
        name: 'PRD Technique',
        category: 'Ingénierie',
        description: 'Product Requirement Document pour le lancement structuré de nouveaux produits',
        sections: ['Vision produit', 'Personas et cas d\'usage', 'User Stories', 'Spécifications techniques', 'Roadmap et jalons', 'Critères de succès'],
      },
    ])
    .onConflictDoNothing()
  console.log('  ✅ 7 templates')

  // ═══════════════════════════════════════════════════════════════
  // 10. CONFIGURATIONS D'AGENTS (6) — Hermes, Planner, Writer, UML, Tables, Reviewer
  // ═══════════════════════════════════════════════════════════════
  await db
    .insert(agentConfigs)
    .values([
      {
        id: 'f0000000-0000-0000-0000-000000000001',
        agentName: 'Hermes',
        provider: 'ollama',
        modelId: 'llama3.1:8b',
        temperature: 0.5,
        topP: 0.95,
        maxTokens: 8192,
        enabled: true,
        metadata: {
          description: "Orchestrateur principal — analyse l'intention, planifie le graphe de tâches, dispatche aux sous-agents",
          role: 'orchestrator',
        },
        updatedAt: new Date('2024-10-01'),
      },
      {
        id: 'f0000000-0000-0000-0000-000000000002',
        agentName: 'Planner',
        provider: 'ollama',
        modelId: 'llama3.1:8b',
        temperature: 0.3,
        topP: 0.9,
        maxTokens: 4096,
        enabled: true,
        metadata: {
          description: "Agent de planification — transforme un brief brut en plan de document structuré (chapitres/sections)",
          role: 'planning',
        },
        updatedAt: new Date('2024-10-01'),
      },
      {
        id: 'f0000000-0000-0000-0000-000000000003',
        agentName: 'Writer',
        provider: 'ollama',
        modelId: 'llama3.1:8b',
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 8192,
        enabled: true,
        metadata: {
          description: "Agent de rédaction — produit le contenu détaillé des sections en respectant le ton et le registre demandés",
          role: 'writing',
        },
        updatedAt: new Date('2024-10-01'),
      },
      {
        id: 'f0000000-0000-0000-0000-000000000004',
        agentName: 'UML',
        provider: 'ollama',
        modelId: 'llama3.1:8b',
        temperature: 0.2,
        topP: 0.9,
        maxTokens: 4096,
        enabled: true,
        metadata: {
          description: 'Agent de modélisation — génère des diagrammes UML (séquence, déploiement, activité, classe) en PlantUML',
          role: 'diagramming',
        },
        updatedAt: new Date('2024-10-01'),
      },
      {
        id: 'f0000000-0000-0000-0000-000000000005',
        agentName: 'Tables',
        provider: 'ollama',
        modelId: 'llama3.1:8b',
        temperature: 0.2,
        topP: 0.9,
        maxTokens: 4096,
        enabled: true,
        metadata: {
          description: "Agent de structuration — produit des tableaux exigences, matrices de risques, estimations de coûts",
          role: 'tabular',
        },
        updatedAt: new Date('2024-10-01'),
      },
      {
        id: 'f0000000-0000-0000-0000-000000000006',
        agentName: 'Reviewer',
        provider: 'ollama',
        modelId: 'llama3.1:8b',
        temperature: 0.3,
        topP: 0.9,
        maxTokens: 8192,
        enabled: true,
        metadata: {
          description: "Agent de relecture — contrôle qualité : cohérence inter-sections, détection de contradictions, alignement terminologique",
          role: 'review',
        },
        updatedAt: new Date('2024-10-01'),
      },
    ])
    .onConflictDoNothing()
  console.log('  ✅ 6 configurations d\'agents')

  // ═══════════════════════════════════════════════════════════════
  // 11. CLÉS API (2) — Pour l'utilisateur admin
  // ═══════════════════════════════════════════════════════════════
  await db
    .insert(apiKeys)
    .values([
      {
        id: 'a0000000-0000-0000-0000-000000000007',
        userId: 'a0000000-0000-0000-0000-000000000001',
        provider: 'openai',
        encryptedKey: 'encrypted:sk-demo-openai-key-xxxxxxxxxxxxxxxxxxxx',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000008',
        userId: 'a0000000-0000-0000-0000-000000000001',
        provider: 'anthropic',
        encryptedKey: 'encrypted:sk-ant-demo-key-xxxxxxxxxxxxxxxxxxxx',
      },
    ])
    .onConflictDoNothing()
  console.log('  ✅ 2 clés API')

  // ═══════════════════════════════════════════════════════════════
  // 12. JOURNAL D'AUDIT (30) — Traçabilité des actions
  // ═══════════════════════════════════════════════════════════════
  await db
    .insert(auditLogs)
    .values([
      // ── Projet 1 : Cadre juridique IA —─────
      {
        userId: 'a0000000-0000-0000-0000-000000000002',
        action: 'document.created',
        target: 'c0000000-0000-0000-0000-000000000001',
        timestamp: new Date('2024-09-20'),
        metadata: { title: 'Cadre juridique IA — Conformité EU AI Act' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000002',
        action: 'section.completed',
        target: 'd0000000-0000-0000-0000-000000000001',
        timestamp: new Date('2024-09-25'),
        metadata: { sectionTitle: 'Contexte et objectifs', agent: 'Writer' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000002',
        action: 'section.completed',
        target: 'd0000000-0000-0000-0000-000000000002',
        timestamp: new Date('2024-09-28'),
        metadata: { sectionTitle: 'Définitions et terminologie', agent: 'Writer' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000002',
        action: 'section.completed',
        target: 'd0000000-0000-0000-0000-000000000003',
        timestamp: new Date('2024-10-20'),
        metadata: { sectionTitle: 'Exigences de conformité', agent: 'Writer' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000002',
        action: 'collaborator_added',
        target: 'c0000000-0000-0000-0000-000000000001',
        timestamp: new Date('2024-10-15'),
        metadata: { email: 'sarah@repora.dev', role: 'admin' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000001',
        action: 'comment.added',
        target: 'f0000000-0000-0000-0000-000000000006',
        timestamp: new Date('2024-10-14'),
        metadata: { sectionTitle: 'Contexte et objectifs' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000006',
        action: 'comment.added',
        target: 'f0000000-0000-0000-0000-000000000001',
        timestamp: new Date('2024-10-15'),
        metadata: { sectionTitle: 'Exigences de conformité' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000002',
        action: 'validation.token_created',
        target: 'd0000000-0000-0000-0000-000000000001',
        timestamp: new Date('2024-10-22'),
        metadata: { documentId: 'c0000000-0000-0000-0000-000000000001' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000002',
        action: 'document.created',
        target: 'c0000000-0000-0000-0000-000000000006',
        timestamp: new Date('2024-10-01'),
        metadata: { title: 'Annexe technique — Conformité RGPD' },
      },
      // ── Projet 2 : Scalabilité —─────
      {
        userId: 'a0000000-0000-0000-0000-000000000002',
        action: 'document.created',
        target: 'c0000000-0000-0000-0000-000000000002',
        timestamp: new Date('2024-08-15'),
        metadata: { title: 'Refonte architecture — Scalabilité 10x' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000003',
        action: 'section.completed',
        target: 'd0000000-0000-0000-0000-000000000006',
        timestamp: new Date('2024-08-20'),
        metadata: { sectionTitle: 'Introduction', agent: 'Writer' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000003',
        action: 'section.completed',
        target: 'd0000000-0000-0000-0000-000000000007',
        timestamp: new Date('2024-08-28'),
        metadata: { sectionTitle: 'Architecture actuelle', agent: 'Writer' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000003',
        action: 'section.completed',
        target: 'd0000000-0000-0000-0000-000000000008',
        timestamp: new Date('2024-10-19'),
        metadata: { sectionTitle: 'Architecture cible', agent: 'Writer' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000006',
        action: 'diagram.created',
        target: 'e0000000-0000-0000-0000-000000000001',
        timestamp: new Date('2024-09-01'),
        metadata: { type: 'sequence' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000006',
        action: 'diagram.created',
        target: 'e0000000-0000-0000-0000-000000000002',
        timestamp: new Date('2024-09-05'),
        metadata: { type: 'deployment' },
      },
      // ── Projet 3 : Gouvernance IA —─────
      {
        userId: 'a0000000-0000-0000-0000-000000000003',
        action: 'document.created',
        target: 'c0000000-0000-0000-0000-000000000003',
        timestamp: new Date('2024-10-05'),
        metadata: { title: 'Politique de gouvernance des systèmes IA' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000006',
        action: 'section.completed',
        target: 'd0000000-0000-0000-0000-000000000010',
        timestamp: new Date('2024-10-10'),
        metadata: { sectionTitle: 'Périmètre de la gouvernance IA', agent: 'Writer', model: 'claude-3-5-sonnet' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000006',
        action: 'section.completed',
        target: 'd0000000-0000-0000-0000-000000000011',
        timestamp: new Date('2024-10-14'),
        metadata: { sectionTitle: 'Rôles et responsabilités', agent: 'Writer', model: 'claude-3-5-sonnet' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000003',
        action: 'diagram.created',
        target: 'e0000000-0000-0000-0000-000000000003',
        timestamp: new Date('2024-10-10'),
        metadata: { type: 'activity' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000003',
        action: 'collaborator_added',
        target: 'c0000000-0000-0000-0000-000000000003',
        timestamp: new Date('2024-10-22'),
        metadata: { email: 'elena@repora.dev', role: 'validateur' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000003',
        action: 'document.created',
        target: 'c0000000-0000-0000-0000-000000000007',
        timestamp: new Date('2024-10-15'),
        metadata: { title: 'Benchmark des frameworks de gouvernance IA' },
      },
      // ── Projet 4 : Étude de marché —─────
      {
        userId: 'a0000000-0000-0000-0000-000000000006',
        action: 'document.created',
        target: 'c0000000-0000-0000-0000-000000000004',
        timestamp: new Date('2024-07-15'),
        metadata: { title: 'Étude de marché — Solutions SaaS Juridiques' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000006',
        action: 'section.completed',
        target: 'd0000000-0000-0000-0000-000000000014',
        timestamp: new Date('2024-08-01'),
        metadata: { sectionTitle: 'Résumé exécutif', agent: 'Writer' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000006',
        action: 'section.completed',
        target: 'd0000000-0000-0000-0000-000000000015',
        timestamp: new Date('2024-08-15'),
        metadata: { sectionTitle: 'Analyse concurrentielle', agent: 'Writer' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000006',
        action: 'diagram.created',
        target: 'e0000000-0000-0000-0000-000000000004',
        timestamp: new Date('2024-08-20'),
        metadata: { type: 'class' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000005',
        action: 'validation.decided',
        target: 'd0000000-0000-0000-0000-000000000002',
        timestamp: new Date('2024-10-20'),
        metadata: { decision: 'approved', documentId: 'c0000000-0000-0000-0000-000000000004' },
      },
      // ── Projet 5 : Contrat ProClean —─────
      {
        userId: 'a0000000-0000-0000-0000-000000000002',
        action: 'document.created',
        target: 'c0000000-0000-0000-0000-000000000005',
        timestamp: new Date('2024-10-12'),
        metadata: { title: 'Contrat de services — ProClean SA' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000002',
        action: 'section.completed',
        target: 'd0000000-0000-0000-0000-000000000017',
        timestamp: new Date('2024-10-18'),
        metadata: { sectionTitle: 'Définitions et interprétation', agent: 'Writer', model: 'gpt-4o' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000006',
        action: 'comment.added',
        target: 'f0000000-0000-0000-0000-000000000004',
        timestamp: new Date('2024-10-22'),
        metadata: { sectionTitle: 'Évaluation des risques' },
      },
      {
        userId: 'a0000000-0000-0000-0000-000000000005',
        action: 'validation.decided',
        target: 'd0000000-0000-0000-0000-000000000003',
        timestamp: new Date('2024-10-27'),
        metadata: { decision: 'rejected', documentId: 'c0000000-0000-0000-0000-000000000005' },
      },
    ])
    .onConflictDoNothing()
  console.log('  ✅ 30 entrées de journal d\'audit')

  console.log('🌱 Semis terminé avec succès !')
}

seed()
  .then(() => {
    queryClient.end()
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Échec du semis :', err)
    queryClient.end()
    process.exit(1)
  })
