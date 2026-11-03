# Theme Builder + éditeur : état réel de la parité avec Elementor (audit du 2026-11-02)

Ce document **remplace, pour l'état actuel**, les tableaux de lot de `ELEMENTOR_THEME_BUILDER_PARITY.md` (lots 1-5, en partie périmés) et la ligne EL-TB017/018/019/021 de `docs/ELEMENTOR_PARITY_MATRIX.md`. Il ne réécrit pas les sources Elementor : elles restent dans
`docs/theme-builder/ELEMENTOR_THEME_BUILDER_REFERENCE.md` (consultées le 2026-10-31 : elementor.com/help/the-elementor-theme-builder/, elementor.com/help/conditions/, developers.elementor.com/docs/themes/ et /docs/theme-conditions/) et `docs/elementor-reference/16-official-sources.md` (consultation du 2026-10-10).
Limite de la documentation : les captures d'écran et le comportement de l'éditeur Elementor n'ont pas été observés dans un navigateur ; les fonctions décrites viennent des pages d'aide écrites. Version d'Elementor étudiée : non précisée par les pages d'aide.

## 1. Chaîne fonctionnelle auditée (code de `origin/main` au 2026-11-02)
| Maillon | Fichier | Constat |
|---|---|---|
| Identité d'un modèle | `src/themeBuilder/store.js` (`mk_theme_templates`, par `organization_id` + `site_id`) | Un modèle = une ligne stable (id) + un document source (page ou composant). Aucune copie divergente. |
| Ouverture dans l'éditeur | `themeBuilder.js` `editUrl` + `landing.js` `tbIdentity` | L'URL porte `?modele=<id>` ; si l'id ne désigne pas ce document, l'éditeur **refuse** (jamais un autre document ouvert en silence). |
| Contexte de l'éditeur | `landing.js` `openEditor` → `boot.themeTemplate` (via `store.byDocument`) | L'éditeur reçoit type, statut, révision, site. |
| Sauvegarde | `landing.js` (brouillon, publication) → `store.publish` / `byDocument` | La publication d'un document de modèle passe par le même `store` ; `revision` périmée → 409. |
| Résolution | `resolve.js` + `match.js` + `conditions.js` | Pur et déterministe ; brouillon/archivé jamais appliqués ; exclusion > inclusion ; le plus précis gagne, puis le plus récemment publié, puis l'id. |
| Rendu public | `render.js`, `themeRender.js`, `middlewares/themeLayout.js` | Un seul service de résolution pour tous les types ; repli historique si aucun modèle ; erreur jamais bloquante. |
| Aperçu | routes `/pages/:id/apercu`, `/composants/:id/apercu` | Même moteur de rendu que le public. **Nouveau :** `?contenu=<id article>` (voir §3). |
| Isolation | `store.*` filtre toujours `organization_id` + `site_id` ; cache par site invalidé par `stampOf` | Vérifié par `theme-builder-stockage`, `-routes`, `-couverture-rendu`. |

## 2. Matrice de parité (état au 2026-11-02, chaque ligne « Fonctionnel » a un test exécuté)
| Mécanisme Elementor | État | Preuve (test) | Écart restant |
|---|---|---|---|
| En-tête / pied de page globaux, publication, remplacement | Fonctionnel | `theme-builder-rendu`, `-couverture-rendu` | Largeur : colonne du site, pas bande automatique |
| En-tête propre à une page (priorité) | Fonctionnel | `theme-builder-rendu` 4-5 | — |
| Conditions Inclure / Exclure, ET/OU, conflits, doublons refusés | Fonctionnel | `theme-builder-noyau`, `-regles` | — |
| Conditions : page précise (`page.ids`), enfants (direct / tous), auteur, catégorie (+ enfants), étiquette, 404, recherche, accueil | Fonctionnel (**la matrice EL-TB017 « page précise absente » est périmée**) | `theme-builder-noyau`, `-contexte-rendu` | Médias, landing pages : non applicable (pas ces contenus) |
| Conditions : produit (catégorie, **étiquette**, auteur, id), archives produits (boutique, catégorie, étiquette) | Fonctionnel (**EL-TB019 « étiquette absente » périmée**) | `theme-builder-noyau`, `programme20-5-boutique-builder` | — |
| Article individuel | Fonctionnel | `theme-builder-contexte-rendu` | — |
| Archives (blog, catégorie, étiquette, auteur) | Fonctionnel | `theme-builder-contexte-rendu` | **Archive par date** : condition acceptée, mais le blog n'a pas d'adresses de date → sans effet (NON PRIS EN CHARGE) |
| Résultats de recherche | Fonctionnel | `theme-builder-contexte-rendu` | Recherche d'un site = `/blog?q=` (pas de moteur global) |
| Page 404 | Fonctionnel | `theme-builder-contexte-rendu`, `-couverture-rendu` | — |
| Produit / archives produits | Fonctionnel | `programme20-5-boutique-builder` | Panier, paiement, compte : **absents** |
| Page individuelle (`single_page`) | **Partiel** | `theme-builder-contexte-rendu` | S'applique à la page statique « À propos » ; les pages du Page Builder gardent leur propre mise en page (pas d'élément « contenu de la page ») — limite L4, **non corrigée** |
| Barre latérale, modèle personnalisé | **Partiel** (types réservés) | `theme-builder-noyau` | Aucune zone du site public ne les affiche — **non corrigé** |
| Aperçu avec un contenu réel (Preview Dynamic Content As) | **Partiel → ajouté (article)** | `theme-builder-apercu-contenu` | Articles seulement ; pas encore de sélecteur dans l'interface de l'éditeur ; produits / archives : non faits |
| Versions, restauration, archivage, duplication, import/export JSON | Fonctionnel | `theme-builder-stockage`, `-routes` | Import `.zip` : non pris en charge |
| Bibliothèque de modèles (900) | Fonctionnel | `theme-builder-bibliotheque-*`, `-catalogue-*` | — |
| Raccourci Ctrl+Maj+E, entrée depuis le logo de l'éditeur | Absent / non pris en charge | — | Choix produit |
| Site principal (sans ligne de site) | Non applicable (décision R9-4) | — | Garde l'habillage Apparence |

## 3. Causes racines corrigées dans ce chantier
1. **Aperçu d'un modèle d'article sans vraies données** : `themeRender.previewScope` ne reconnaissait que les anciens modèles (`themeTemplates.typesOfPage`). Un modèle d'article/archive/recherche créé par le Theme Builder n'était donc jamais rempli avec un vrai contenu. Correction : `previewScope` interroge aussi `themeBuilder.store.byDocument` (`single_post`, `archive`, `search_results`).
2. **Pas de choix du contenu d'aperçu** : ajout de `?contenu=<id>` (article **publié** uniquement ; brouillon ou id invalide → repli sur le plus récent, sans erreur) sur les routes d'aperçu, et de `GET /site-web/sites/:id/constructeur-de-theme/api/contenus-apercu?type=single_post` (droit `forms.read`, aucune écriture).

## 4. Ce qui reste (à ne pas annoncer comme fait)
* Sélecteur « Aperçu avec » dans l'interface de l'éditeur (le backend est prêt).
* Aperçu avec un produit / une archive choisis.
* `single_page` pour les pages du Page Builder ; zone de barre latérale ; modèles panier / paiement / compte ; archives par date.
* Parité visuelle exacte de l'éditeur Elementor : non vérifiable ici.
