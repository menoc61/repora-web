import type { OutlineJson } from '../../services/outline.service'
import { db } from '../../db'
import { sections as sectionsTable, documents } from '../../db/schema'
import { eq } from 'drizzle-orm'

const SECTIONS_BY_TYPE: Record<string, Array<{ title: string; content: string }>> = {
  default: [
    {
      title: 'Contexte du projet',
      content: `Le present document constitue le cahier des charges fonctionnel et technique du projet. Il definit les besoins, les objectifs, les fonctionnalites attendues, ainsi que les contraintes techniques et organisationnelles.

Ce document sert de reference commune entre le maitre d'ouvrage et l'equipe de realisation. Il precise le perimetre fonctionnel, les acteurs impliques, les regles de gestion, et les criteres d'acceptation pour chaque module.`,
    },
    {
      title: 'Objectifs generaux',
      content: `Les objectifs poursuivis par ce projet sont les suivants :

1. Automatiser les processus metier existants afin de reduire les delais de traitement et les risques d'erreur humaine.
2. Centraliser l'information au sein d'un systeme d'information unique, accessible par l'ensemble des acteurs autorises.
3. Garantir la tracabilite des operations et des decisions tout au long du cycle de vie des donnees.
4. Fournir des outils d'aide a la decision bases sur des indicateurs de performance fiables et actualises en temps reel.

Ces objectifs s'inscrivent dans une demarche d'amelioration continue et de transformation numerique de l'organisation.`,
    },
  ],
  functional: [
    {
      title: 'Gestion des utilisateurs et authentification',
      content: `Le systeme doit permettre la gestion complete du cycle de vie des utilisateurs, incluant la creation de comptes, la modification des profils, la desactivation et la suppression.

Fonctionnalites attendues :
- Inscription avec validation d'adresse email
- Authentification securisee par mot de passe (hash bcrypt, session JWT)
- Gestion des profils avec informations personnelles et preferences
- Roles et permissions : chaque utilisateur se voit attribuer un role (redacteur, validateur, administrateur) determinant ses droits d'acces
- Journalisation des connexions et des actions sensibles`,
    },
    {
      title: 'Module de gestion documentaire',
      content: `Le module documentaire constitue le coeur du systeme. Il permet la creation, la modification, la validation et l'archivage de documents techniques.

Fonctionnalites principales :
- Creation de documents a partir de templates predefinis ou de plans personnalises
- Edition collaborative avec historique des versions et restauration possible
- Systeme de validation : un document peut etre soumis a un validateur qui l'approuve ou le rejette avec motifs
- Export aux formats DOCX et PDF avec mise en page professionnelle
- Generation automatique de diagrammes UML a partir du contenu du document`,
    },
    {
      title: 'Generation assistee par IA',
      content: `Le systeme integre un module de generation automatique de contenu base sur l'intelligence artificielle. Ce module est pilote par un orchestrateur multi-agents nomme Hermes.

Fonctionnalites attendues :
- Planification automatique du plan du document a partir d'un brief projet
- Redaction de sections avec contenu technique professionnel en francais
- Generation de diagrammes UML (cas d'utilisation, sequence, activite, classe, deploiement)
- Generation de tableaux d'exigences fonctionnelles et non-fonctionnelles
- Passage en revue qualite avec detection de contradictions et verification de couverture`,
    },
  ],
  non_functional: [
    {
      title: 'Exigences de performance',
      content: `Le systeme doit repondre aux exigences de performance suivantes :

- Temps de reponse maximum de 2 secondes pour les operations courantes (affichage de page, recherche)
- Capacite a supporter au moins 50 utilisateurs simultanes sans degradation significative des performances
- Generation de documents completes en moins de 5 minutes
- Temps d'export PDF inferieur a 10 secondes pour un document de 50 pages
- Disponibilite de 99.5% (hors maintenance planifiee)
- Mise en cache des exports pour les documents frequemment telecharges`,
    },
    {
      title: 'Exigences de securite',
      content: `Les exigences de securite suivantes doivent etre respectees :

- Chiffrement des mots de passe avec bcrypt (facteur de cout minimum 12)
- Authentification par JWT avec expiration des tokens
- Chiffrement des cles API BYOK au repos (AES-256-GCM)
- Controle d'acces base sur les roles (RBAC) pour toutes les operations sensibles
- Journalisation de toutes les actions utilisateur dans une piste d'audit
- Protection contre les attaques CSRF et XSS
- Validation des entrees utilisateur sur toutes les API
- Rate limiting sur les endpoints d'authentification`,
    },
    {
      title: 'Contraintes techniques',
      content: `Le systeme est developpe selon les contraintes techniques suivantes :

Architecture :
- Frontend : React 18 avec TypeScript, Vite pour le build, Tailwind CSS pour le styling
- Backend : Node.js avec Express et TypeScript, Drizzle ORM pour l'acces base de donnees
- Base de donnees : PostgreSQL 17
- IA : Orchestrateur Hermes avec agents specialises, support des modeles locaux (llama.cpp) et cloud (BYOK)

Deploiement :
- Conteneurisation Docker avec docker-compose pour l'ensemble des services
- Proxy Nginx pour le routage et la terminaison TLS
- Environnement de developpement : hot-reload, proxy Vite vers backend`,
    },
  ],
}

function buildSectionContent(
  projectBrief: string,
  funcReqs: string[],
  nonFuncReqs: string[],
): Array<{ title: string; content: string }> {
  const sections: Array<{ title: string; content: string }> = []
  sections.push(...SECTIONS_BY_TYPE.default)

  if (funcReqs.length > 0) {
    sections.push({
      title: 'Exigences fonctionnelles detaillees',
      content: `Sur la base de l'analyse du besoin et des exigences exprimees, les fonctionnalites suivantes ont ete identifiees :\n\n${funcReqs.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
    })
  }
  sections.push(...SECTIONS_BY_TYPE.functional)

  if (nonFuncReqs.length > 0) {
    sections.push({
      title: 'Exigences non-fonctionnelles',
      content: `Les exigences non-fonctionnelles suivantes encadrent la realisation du projet :\n\n${nonFuncReqs.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
    })
  }
  sections.push(...SECTIONS_BY_TYPE.non_functional)

  sections.push({
    title: 'Architecture technique proposee',
    content: `L'architecture proposee pour ce projet repose sur les principes suivants :

Architecture en trois tiers :
- Couche presentation : interface utilisateur web progressive (PWA) developpee en React avec un editeur bloc collaboratif BlockNote. L'interface est responsive et accessible depuis tout navigateur moderne.
- Couche application : API REST developpee en Node.js avec Express. Orchestrateur Hermes pour la generation de contenu assistee par IA. Services specialises pour l'export, la validation et la collaboration.
- Couche donnees : Base de donnees PostgreSQL hebergeant l'ensemble des donnees applicatives (utilisateurs, projets, documents, sections, diagrammes, validations).

Le systeme est conteneurise via Docker pour faciliter le deploiement et la maintenance.`,
  })

  sections.push({
    title: 'Diagrammes UML',
    content: `Cette section presente les diagrammes UML permettant de visualiser l'architecture et le comportement du systeme.

Diagramme de cas d'utilisation : presente les acteurs du systeme et leurs interactions avec les fonctionnalites principales.
Diagramme de sequence : detaille les echanges entre les composants pour les scenarios critiques.
Diagramme d'activite : decrit les flux de travail et les processus metier.
Diagramme de classes : presente le modele de donnees et les relations entre entites.`,
  })

  sections.push({
    title: 'Plan de validation et recette',
    content: `La phase de validation comprend les etapes suivantes :

1. Tests unitaires : chaque module est teste individuellement avec couverture de code minimale de 80%.
2. Tests d'integration : verification des interactions entre les modules.
3. Recette fonctionnelle : le maitre d'ouvrage valide chaque fonctionnalite selon les criteres d'acceptation definis.
4. Tests de performance : verification du respect des exigences de temps de reponse et de charge.
5. Validation securite : audit de securite avant mise en production.

Chaque anomalie detectee fait l'objet d'un ticket avec priorite, description et corrections attendues.`,
  })

  return sections
}

export async function generateFallbackContent(
  projectId: string,
  documentId: string,
  prompt: string,
) {
  // Fetch requirements
  const { requirements } = await import('../../db/schema')
  const reqs = await db
    .select({ type: requirements.type, text: requirements.text })
    .from(requirements)
    .where(eq(requirements.projectId, projectId))

  const funcReqs = reqs.filter(r => r.type === 'functional').map(r => r.text)
  const nonFuncReqs = reqs.filter(r => r.type === 'non_functional').map(r => r.text)

  const sections = buildSectionContent(prompt, funcReqs, nonFuncReqs)

  // Persist sections to DB
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i]
    const [existing] = await db
      .select({ id: sectionsTable.id })
      .from(sectionsTable)
      .where(eq(sectionsTable.documentId, documentId))
      .orderBy(sectionsTable.order)
      .limit(1)
      .offset(i)

    if (existing) {
      await db
        .update(sectionsTable)
        .set({
          title: s.title,
          content: s.content,
          status: 'draft',
          updatedAt: new Date(),
        })
        .where(eq(sectionsTable.id, existing.id))
    } else {
      await db
        .insert(sectionsTable)
        .values({
          documentId,
          title: s.title,
          content: s.content,
          order: i + 1,
          status: 'draft',
        })
    }
  }

  // Update document status
  await db
    .update(documents)
    .set({ status: 'draft', updatedAt: new Date() })
    .where(eq(documents.id, documentId))

  return sections.length
}
