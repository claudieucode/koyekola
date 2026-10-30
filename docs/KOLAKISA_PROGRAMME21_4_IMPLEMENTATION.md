# Programme 21.4 — Page Generator & Component Mapper : implémentation

## Audit initial (état réel)
- `origin/main` au commit `2ec4611c`. Les documents des programmes 21.1 à 21.3 **n'existent pas** dans le dépôt, et **aucun Site Planner** n'est présent. Il n'y a pas non plus de « Provider Manager », de « Model Registry » ni de gestion de coûts distincts.
- Existent et sont réutilisés : l'IA centrale (`services/aiCore` + `marketing/ai` : `ai.call` = module IA par site, plafond quotidien par organisation, journal sans texte, connecteur), le format natif des pages (tableau `sections` de `mk_landing_pages`, validé par `pages/sections.js`), `pages.createPage / saveDraft / requirePage / archivePage / discardDraft`, le moteur de rendu (`sectionPreview.renderSections`), l'inventaire des types de pages (`pageTypes`, avec les fonctionnalités manquantes), l'assistant de création du programme 20.6.
- Adaptation : le contrat de Site Plan (v1) est défini ici (`src/pageGen/plan.js`) ; le futur Site Planner devra le produire.

## Livré
`src/pageGen/{registry,plan,mapper,index}.js`, routes `src/marketing/web/pageGenerator.js`, vue `views/marketing/site-generator.ejs`, tests `tests/page-generator.test.js`. Écran : `/marketing/site-web/sites/:id/generateur` (lien depuis l'étape Pages de l'assistant).

## Principe
Plan validé → Component Mapper (besoin → composant **réel**) → sections natives → validation par les normaliseurs du moteur → **proposition** enregistrée (rien d'écrit dans les pages) → aperçu par le moteur de rendu → application en **brouillon** → annulation possible. Jamais de publication.

## Base de données
Table `mk_pagegen_runs` créée à la demande (migrations figées par test, aucune ajoutée). Aucune donnée existante touchée.
