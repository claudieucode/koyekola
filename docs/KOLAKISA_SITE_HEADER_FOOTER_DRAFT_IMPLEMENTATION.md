# Mission 9.1 — implémentation

Branche locale `theme-builder-brouillon-parties` (départ `a0598f3`). Aucun push, aucune fusion, aucun déploiement. **Aucune migration** (colonnes `draft`, `version`, `revision` déjà présentes).

## Propriété obtenue
Enregistrer ne change jamais ce que voient les visiteurs. Seul « Mettre à jour » (`POST /site-web/composants/:id/mettre-a-jour`, avec la révision confirmée) copie le brouillon dans la version diffusée.

## Architecture
- **Brouillon** : `mk_web_components.draft` ; **version diffusée** : `section` ; **révision** : `revision` (+1 à chaque écriture, y compris abandon et mise à jour) ; **version publiée** : `version` (+1 par mise à jour réelle).
- **Public** : `partOf` ne lit que `section` (sauf si un `draftId` explicite est fourni, ce que seul l'aperçu privé fait).
- **Aperçu** : `GET /marketing/site-web/composants/:id/apercu?rev=&page=` — rend une vraie page du site (même moteur que le public et que l'aperçu de page) avec la copie de travail à la place du composant. Page choisie : celle demandée si elle appartient au même site, sinon une page qui utilise réellement ce composant (en-tête : hors exception ; variante : une page qui l'utilise). Bandeau : « Aperçu du brouillon (révision N)… pas encore visible par les visiteurs » ; si `rev` ≠ révision courante, avertissement explicite. `Cache-Control: no-store`.

## Fichiers de production modifiés
| Fichier | Changement |
|---|---|
| `src/marketing/pages/index.js` | `partOf`/`siteParts`/`withSiteParts` : paramètre `draftId` ; `componentRole` (en-tête / pied / variante / composant) exporté ; `headerOverview` expose `hasDraft` (en-tête) et le pied de page. |
| `src/marketing/web/landing.js` | `PUT …/brouillon` : toujours `saveComponentDraft` (plus d'écriture directe) ; route d'aperçu ; `shown`/`renderPreview` acceptent `draftId` ; rôle via `componentRole`. |
| `src/marketing/web/siteWeb.js` | `POST /site-web/composants/:id` refuse `section` pour en-tête / pied / variante (422) ; renommer reste possible. |
| `public/js/page-builder.js` | Statut par rôle (« En-tête : brouillon non publié » / « publié, à jour »), bouton « Mettre à jour » et aperçu actifs, messages de réussite, aperçu avec la révision en cours, menu « Abandonner les modifications non publiées ». |
| `views/marketing/site.ejs` | « Publié · brouillon non publié », texte d'aide corrigé, lien « Modifier le pied de page ». |

## Réutilisé tel quel
Sauvegarde différée 1 s, une sauvegarde à la fois, récupération locale, messages réseau / session expirée / 409, `publishComponent` (révision, version identique sans nouvelle version), `abandonner`, permissions `forms.read` / `forms.write`.

## Tests adaptés
`tests/site-web-entete.test.js` : 3 tests qui exigeaient la diffusion immédiate vérifient maintenant « brouillon invisible en public, puis « Mettre à jour » diffuse » ; toutes leurs autres assertions (exceptions, variantes, protections, droits) sont inchangées.

## Comportement conservé
Composants globaux ordinaires : cycle inchangé (dialogue de confirmation avec les pages touchées). Modèles de thème, 404, archives, pages ordinaires : non modifiés.
