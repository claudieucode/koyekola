# Page Generator — architecture

1. `plan.validate` nettoie le plan (borné : 12 pages, 14 sections par page, 12 éléments ; propriétés inconnues écartées et signalées ; genres inconnus refusés).
2. `generate(ctx, siteId, plan, {useAi, only, call})` : site vérifié (organisation + portée), types de pages indisponibles écartés (`pageTypes.NEEDS`), formations inconnues filtrées, mapping, construction, **validation** → ligne `mk_pagegen_runs` (`proposed`).
3. **IA optionnelle** : `ai.call(ctx, "pagegen", …)` (module IA du site, plafond, journal). L'IA ne renvoie que des **chaînes** (titre, texte, éléments) placées uniquement là où le plan est vide, avec les bornes du plan. Types de composants, propriétés et clés inconnues de sa réponse sont ignorés. Le plan envoyé est présenté comme données, pas comme instructions.
4. `apply(ctx, siteId, runId, decisions, {confirmReplace})` : une transaction ; stratégie **obligatoire** pour une page qui existe déjà (`create` nouvelle page au premier nom libre · `version` nouveau brouillon de la page du même site · `replace` avec confirmation · `skip`) ; page d'un autre site : seule la création est permise ; chaque page est **revalidée** juste avant l'écriture ; écriture par `createPage` + `saveDraft` (révision vérifiée, historique commun).
5. `undo` : une page créée part à la corbeille si elle n'a ni changé ni été publiée depuis ; une page versionnée retrouve son contenu précédent ; le reste est laissé intact et signalé.
6. Identifiants de section déterministes : `g` + 11 premiers caractères du SHA-1 de `page:section:rang`.
7. Cohérence du site : style de section commun (`mapper.styleFor`), espacements et fonds issus des attributs natifs ; en-tête, pied de page, navigation et jetons restent ceux du Theme Builder (non régénérés par page).
8. Performance : tout est local et synchrone (aucun appel hors IA optionnelle) ; une proposition est limitée à 600 ko.
