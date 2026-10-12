# Mission 9 — Theme Builder : audit préalable

> **Mise à jour (mission 9.1, commit `4189ed9`)** : l'en-tête, le pied de page et les variantes d'un site ne s'appliquent plus à chaque enregistrement. Ils ont maintenant un brouillon, un aperçu privé et un bouton « Mettre à jour » (voir `KOLAKISA_SITE_HEADER_FOOTER_DRAFT_*.md`). Les passages ci-dessous qui parlent d'application directe décrivent l'état *avant* 9.1.

*Faits relevés dans le code réel le 2026-10-12, avant toute modification.*

## 1. État Git de départ
- Dépôt de travail : `/Users/imac/ClaudeProjects/KOYEKOLA-noyau`, branche `widgets-catalogue`, arbre propre, aucun fichier non suivi.
- Commit `19f0bcf` (palier 8) présent, **absent de `origin/main`** (qui est à `738322d`, palier 7). Il contient bien les 5 corrections annoncées (vérifié dans `public/js/page-builder.js` : `freeAnchor`, `pairSet`, `noLast`, `stale.onload = null`, validation « Lignes surlignées »).
- Branche de travail créée depuis `19f0bcf` : **`theme-builder`** (création locale, rien supprimé, rien réinitialisé). `main`, `widgets-catalogue` et les autres worktrees n'ont pas été touchés.
- Une autre session lançait des tests dans `KOYEKOLA-studio` ; aucun fichier commun.

## 2. Ce qui existe déjà (rien n'a été reconstruit)

Il n'y a **pas un seul Theme Builder**, mais quatre mécanismes déjà reliés au vrai rendu :

| Mécanisme | Où | Ce qu'il fait |
|---|---|---|
| **Modèles de thème** | `src/marketing/pages/themeTemplates.js`, `web/themeRender.js`, réglage `theme.templates` | Une page du Page Builder devient le modèle d'une famille de pages du site public (9 familles), avec conditions (catégorie, étiquette, article, public) et priorité déterministe. |
| **Composants** (dont globaux) | `pages/index.js` (`mk_web_components`), migration 067 | Section réutilisable ; « global » = instances liées qui reçoivent les mises à jour ; copie de travail + « Mettre à jour ». |
| **Parties globales d'un site** | `pages/index.js` (`siteParts`, `withSiteParts`), `mk_sites.header_component_id / footer_component_id`, migration 044 | En-tête et pied de page des pages d'un site du Page Builder, exceptions par page (aucun / variante). |
| **Apparence du site public** | `src/services/appearance.js`, `web/appearanceEditor.js` | Jetons (couleurs, polices), en-tête et pied de page *structurés* du blog/site public, brouillon → aperçu → publication, historique (30), droits `appearance.*`. |

Rendu public : `landingPublic.js` (`/p/<slug>`) applique `withSiteParts` ; le blog, la page À propos, la fiche formation et le 404 appellent `renderRegion` (`blog.js:178` et `:340`, `pages.js:40`, `courses.js:248`, `server.js:186`).
Sauvegarde / publication d'une page : `saveDraft` (révision), `publish`, `restoreVersion`, 100 versions (palier 7) — **réutilisés tels quels** pour les pages modèles.

## 3. Écarts constatés (prouvés par un test avant correction)

Fichier de test : `tests/theme-builder-serveur.test.js` ; 6 échecs avant correction, 5 réussites sur ce qui était déjà correct.

| # | Priorité | Écart | Preuve |
|---|---|---|---|
| T1 | **P1** | Éditeur d'un composant : **aucune révision**. La route d'enregistrement répondait `revision: 0` en dur et ignorait celle envoyée : deux onglets (ou deux personnes) s'écrasaient en silence, y compris sur l'en-tête et le pied de page du site, qui s'appliquent immédiatement. | test « deux onglets » : 200 au lieu de 409 |
| T2 | **P1** | « Mettre à jour » diffusait le brouillon du serveur sans vérifier que c'était celui que la personne avait vu confirmé. | test « révision périmée » : 200 au lieu de 409 |
| T3 | **P1** (éditeur) | Dans l'éditeur d'un composant, après une modification enregistrée, l'état restait « À jour » et le bouton **« Mettre à jour » restait caché** jusqu'au rechargement : on ne pouvait pas diffuser la modification sans recharger. | trace navigateur : statut « À jour » avec `rev: 1` et brouillon présent |
| T8 | **P1** (éditeur) | Dans l'éditeur d'un composant, « Mettre à jour » ne **attendait pas** l'enregistrement en cours : cliquée pendant qu'une saisie était en vol, elle diffusait la version précédente (même défaut que celui corrigé pour les pages au palier 7, resté présent pour les composants). | test navigateur (réseau ralenti) : « Premier jet » diffusé au lieu de « Dernière saisie » |
| T4 | P2 | **Copier un site** perdait son en-tête, son pied de page, ses variantes d'en-tête et l'exception « aucun en-tête » des pages. | test : `header_component_id` nul sur la copie |
| T5 | P2 | **Déplacer une page** vers un autre site gardait une *variante d'en-tête du site d'origine* : la page publiée du nouveau site affichait l'en-tête d'un autre site. | test : `header_mode = variant` après déplacement |
| T6 | P2 | Mettre à la corbeille une page qui **sert de modèle de thème** était silencieux : le modèle restait affecté à une page archivée (référence orpheline, retour discret à l'affichage d'origine). | test : la page était archivée sans message |
| T7 | P2 | Aucun moyen de savoir **pourquoi** un modèle est (ou n'est pas) appliqué à une page. | test : route absente (404) |

Hors écarts : d'autres points étaient **déjà corrects** et sont maintenant gardés par des tests (voir la matrice) : un seul `<html>/<head>/<body>` avec un modèle, 404 conservé en HTTP 404, droits côté serveur, entrées hostiles refusées, étape de tunnel refusée comme modèle.

## 4. Décisions d'architecture prises
1. **Pas de second système** : révision de composant = même principe que celle des pages (colonne additive, migration 071). Pas de nouvelle publication, pas de nouvel historique.
2. **L'en-tête/pied de page du site restent à application directe** (comportement décidé et documenté par la mission « En-tête du site » : « appliqué à toutes les pages »). Les protéger par révision était indispensable ; les faire passer en brouillon + publication changerait un comportement existant et ses tests : **non fait, soumis à décision** (voir LIMITATIONS, L1).
3. **Onglets / accordéons** : le contenu est du texte (`items[].text` / `.a`), pas des widgets imbriqués (`nodes.js`, `tabs` / `accordion`). Les rendre imbriquables demande un nouveau type de conteneur ; hors périmètre sûr (L3).
4. **Boutons texte + adresse** : le constat du palier 8 (« diaporama, appel à l'action… sans message ») était **inexact** : le serveur refuse explicitement (diaporama : « un bouton demande une adresse » / « une adresse de bouton demande son texte » ; bandeau et appel à l'action : « un bouton a besoin d'un texte ET d'une adresse »), et l'éditeur affiche ce motif dans la barre d'enregistrement (test navigateur). Contrat gardé (des tests existants l'exigent). Reste une incohérence P3 avec la fenêtre / boîte retournable / offre, plus tolérantes (L2).
