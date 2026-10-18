# Mission 9.1 — Brouillon / aperçu / publication de l'en-tête et du pied de page : audit

## Git (vérifié)
- Départ : branche `theme-builder`, arbre propre, commit `a0598f3` présent (contient `19f0bcf`, palier 8, et le palier 9). `origin/main` = `738322d` : ni 8 ni 9 ne sont poussés.
- Travail : nouvelle branche locale **`theme-builder-brouillon-parties`** créée depuis `a0598f3`. Aucun commit déplacé, aucune branche réinitialisée.

## Comportement initial (code lu avant modification)
| Sujet | Constat |
|---|---|
| Stockage | En-tête et pied de page d'un site = deux **composants** (`mk_web_components`) désignés par `mk_sites.header_component_id` / `footer_component_id` ; variantes d'en-tête = composants `variant_of`. Colonnes : `section` (version diffusée), `draft` (copie de travail), `version`, `revision` (071, palier 9). |
| Rendu public | `withSiteParts` → `partOf` lit `getComponent(...).section` : **la version diffusée uniquement**. |
| Enregistrement depuis l'éditeur | `PUT /site-web/composants/:id/brouillon` : pour en-tête, pied de page et variantes (`direct`), appel à `updateComponent` → **écrit `section` : publié à chaque enregistrement** (1 s après la dernière frappe). Pour un composant ordinaire : `saveComponentDraft`. |
| Éditeur (client) | `staged = (role === "component")` : pour les parties de site, pas de statut « brouillon », bouton « Mettre à jour » et aperçu **masqués**. |
| Aperçu | Aucun pour un composant (le bouton d'aperçu de page était caché). |
| Révisions / 409 | Ajoutés au palier 9 pour `saveComponentDraft`, `updateComponent`, `publishComponent`, `discardComponentDraft` ; l'éditeur envoie `revision` ; 409 déjà géré par l'éditeur (bloque et explique). Réseau coupé / 401 : même fonction d'enregistrement que les pages (message + reprise). |
| Autre chemin d'écriture publique | `POST /site-web/composants/:id` acceptait aussi `section` → publication directe, sans brouillon. |
| Exceptions par page, variantes | `header_mode` (`inherit` / `none` / `variant`) + `header_component_id` sur la page ; lues par `withSiteParts`. |
| Tests qui fixaient l'ancien contrat | 3 tests de `site-web-entete.test.js` (« mise à jour immédiate »). |

## Écart par rapport à la demande
Le comportement demandé (« enregistrer ne change jamais le public ») n'était **pas** respecté pour en-tête, pied de page et variantes : chaque enregistrement les publiait. Il n'y avait pas d'aperçu privé et le bouton « Mettre à jour » n'était pas disponible pour eux.

## Décision d'architecture
Le modèle de données **suffisait** : `draft` + `section` + `revision` existent déjà. **Aucune migration.** On étend à ces trois rôles le cycle « copie de travail → aperçu → Mettre à jour » déjà en place (et testé) pour les composants ordinaires. Aucun second système de sauvegarde, de publication ou de rendu.

## Plan retenu
1. Serveur : brouillon pour tous les composants ; `partOf/siteParts/withSiteParts` acceptent un `draftId` (aperçu seulement) ; `componentRole` ; route d'aperçu privé ; fermeture du chemin direct `section`.
2. Client : statut par rôle, bouton « Mettre à jour » et aperçu visibles, messages de publication, « Abandonner les modifications non publiées ».
3. Fiche du site : état « brouillon non publié » et lien d'édition du pied de page.
4. Tests serveur + Chrome, adaptation des 3 tests de l'ancien contrat.
