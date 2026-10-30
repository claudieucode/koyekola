# Site Planner — architecture

## Rôle
`BriefAnalysis` → `SitePlan` v1 : informations du site, pages (clé, nom, adresse, objectif, type, priorité, navigation, relations), navigation (principale, secondaire, pied de page), sections ordonnées, fonctionnalités par niveau, modules, dépendances, conversions, recommandations, alertes.

## Deux étages
1. **Proposition (IA)** : `ai.call("plan", schéma strict)`. Le prompt contient le brief **analysé** (pas le texte brut), les capacités réelles (`registry.promptSpec()`) et les règles : composants du catalogue seulement, origine « user » / « ai » distinguée, aucune donnée factuelle, pas de droit ni de paiement local présumés.
2. **Rapprochement (serveur, déterministe) — `reconcile`**, rejoué après chaque modification de la personne, sans nouvel appel :
   - clés et adresses normalisées, uniques, adresses réservées décalées, 12 pages et 30 sections/page au plus ;
   - disponibilité **recalculée** pour chaque section (type, éléments, fonctionnalités dont elle dépend), page (type de page qui exige une fonctionnalité absente) et fonctionnalité (registre + module activé pour le site) ;
   - **exigences explicites du brief réintégrées** (fonctionnalités et pages oubliées par le modèle) ; l'IA ne peut pas déclarer « required » ce que la personne n'a pas demandé ;
   - dépendances : une section qui dépend d'une fonctionnalité absente la fait ajouter (niveau « recommended », alerte info) ;
   - navigation : références valides seulement, menu principal limité à 7 entrées (le reste passe en secondaire), hiérarchie sans cycle ni parent inconnu ;
   - témoignages, chiffres, prix et photos : `requiredData` imposé (donnée réelle à fournir) ;
   - une page d'accueil est exigée (erreur sinon).

## Statuts et validation
`draft` (analyse seule) → `pending` (plan proposé) → `modified` (la personne a changé quelque chose) → `validated` · `to_fix` (erreur bloquante). Une exigence **indisponible** reste bloquante tant qu'elle n'est pas **reconnue** (« continuer sans ») ou retirée. Modifier un plan validé le repasse en `modified`. Seule `validatedPlan()` livre le plan (et ses `PagePlan`) aux paliers suivants. Le plan n'écrit jamais dans le site.

## Modifications possibles (sans IA)
Renommer le site / une page, objectifs, description, ajouter/supprimer/réorganiser des pages et la navigation, ajouter/retirer/déplacer/éditer des sections (types existants seulement), ajouter/retirer des fonctionnalités, reconnaître une fonctionnalité indisponible, accepter/refuser une recommandation. Chaque modification : contrôle de révision (409 si périmée), historique (`mk_ai_plan_events`).

## PagePlan
`pagePlans(plan)` dérive, par page : objectif, sections ordonnées avec composants (`section` + `widgets`), contenus attendus, données requises, indications responsive (grille → colonnes empilées sur mobile). C'est l'entrée prévue du Page Generator (21.4).
