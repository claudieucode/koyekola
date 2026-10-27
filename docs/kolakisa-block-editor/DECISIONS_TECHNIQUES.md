# Décisions techniques

## DT-1 — Périmètre : l'éditeur d'articles Tiptap, pas le Page Builder
L'éditeur « de type Gutenberg » est l'éditeur d'articles (`src/editor/blog-editor.js`). Les pages (Page Builder, sections JSON) restent hors périmètre : `KOLAKISA_CMS_PAGES_NOUVELLE.md` §4 les déclare volontairement sans éditeur de blocs HTML, faute de modèle de contenu commun. Statut : **BLOQUÉ** (décision de produit requise, voir PLAN §Blocages).

## DT-2 — Format de stockage : on garde le HTML structuré (`kb-*` + `data-*`)
Le rapport de référence (`PERSISTANCE_ET_COMPATIBILITE.md` §9) compare quatre options et recommande à titre provisoire un JSON canonique versionné. **Nous ne le retenons pas maintenant**, pour ces raisons :
- Le HTML structuré est le format en production pour tous les articles existants ; une migration vers du JSON toucherait tout le contenu enregistré, ce que la mission interdit sans plan de récupération testé sur données réelles (règle 7).
- Le rendu public, le SEO (sommaire, FAQ, Schema), le RSS, la recherche, les révisions et l'import WordPress reposent sur ce HTML.
- Les avantages cités pour le JSON (migrations de schéma, blocs inconnus, diff par bloc) sont atteignables en gardant le HTML : identifiants de blocs stables déjà présents (`data-block-id`), futur registre central, bloc de repli pour les inconnus (P0/P4).
À rouvrir seulement si un besoin concret (collaboration temps réel, API publique de blocs) l'exige ; une migration serait alors versionnée, réversible, et précédée d'une sauvegarde.

## DT-3 — Pas de dépendance aux paquets `@wordpress/*`
Architecture native sur Tiptap/ProseMirror, déjà en place. Gutenberg sert de référence fonctionnelle, pas de dépendance.

## DT-4 — Une seule source de vérité des blocs (registre) — à construire
Aujourd'hui un bloc existe en deux endroits non reliés : le nœud Tiptap (`nodes.js`) et la liste blanche de sanitisation (`blogHtml.js`). Tout nouveau bloc doit ajouter les deux. Cible : un registre central décrivant attributs, rendu, sanitisation et transformations, dont les deux consommateurs sont dérivés. Étape P4, après stabilisation P0/P1.

## DT-5 — Sécurité : refus plutôt que troncature
Une sauvegarde automatique trop grosse est refusée (HTTP 413, message) au lieu d'être tronquée en JSON invalide (D2). Même principe pour toute future limite : jamais de perte silencieuse.

## DT-6 — Accès limité et brouillon automatique
Un administrateur de site à accès limité ne peut pas appeler `/api/brouillon` (refus voulu, `LIMITED_API`). Son éditeur ne crée donc le brouillon qu'au premier enregistrement manuel. Limite connue, pas corrigée : à rediscuter avec le propriétaire du produit.

## DT-7 — Outillage
Le worktree utilise un lien symbolique `node_modules` vers `KOYEKOLA-deploy` (non versionné). Ce dossier n'a pas CodeMirror : `npm run build:editor` échoue sur `theme-code-editor` avant d'écrire quoi que ce soit. Le bundle `blog-editor.js` a été reconstruit avec exactement les mêmes options esbuild que `scripts/build-editor.js`, pour ce seul point d'entrée. À refaire proprement avec un `npm ci` avant tout déploiement.
