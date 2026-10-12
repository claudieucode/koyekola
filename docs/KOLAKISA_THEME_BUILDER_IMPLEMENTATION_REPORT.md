# Mission 9 — Theme Builder : rapport d'implémentation

Branche locale `theme-builder` (départ `19f0bcf`). Aucun push, aucune fusion, aucun déploiement.

## Principe
Le Theme Builder existait déjà sous quatre formes reliées au rendu réel (voir AUDIT §2). Rien n'a été reconstruit ni dupliqué : l'audit a trouvé **8 écarts** (T1–T8), tous prouvés par un test qui échouait avant, tous corrigés.

## Modifications de production

| Fichier | Changement |
|---|---|
| `src/marketing/migrations/071_composants_revision.sql` | **Nouvelle migration, additive** : colonne `revision INTEGER NOT NULL DEFAULT 0` sur `mk_web_components`. Aucune donnée modifiée ; les composants existants démarrent à 0. |
| `src/marketing/pages/index.js` | `updateComponent`, `saveComponentDraft`, `publishComponent`, `discardComponentDraft` : révision vérifiée si fournie (refus « conflict »), incrémentée à chaque écriture. `movePage` : une variante d'en-tête de l'ancien site n'est plus emportée. `duplicatePage` : l'exception « aucun en-tête » (et la variante, dans le même site) est conservée. `duplicateSite` : nouvelle `duplicateSiteParts` (en-tête, pied de page, variantes copiés pour la copie, identifiants régénérés ; composants partagés laissés partagés). `archivePage` : appelle la garde ci-dessous. |
| `src/marketing/pages/themeTemplates.js` | `guardPageRemoval` (refus nommant les modèles, ou détachement explicite) ; `explain` (même score que `pick`, pour dire qui gagne et pourquoi les autres non). |
| `src/marketing/web/landing.js` | Enregistrement d'un composant : révision lue dans la requête, **vraie** révision renvoyée (au lieu de `0`). |
| `src/marketing/web/siteWeb.js` | Conflit → HTTP 409 ; la révision traverse mise à jour / abandon / modification ; route `GET /marketing/site-web/modeles-de-theme/resolution.json` ; données de l'écran « Pourquoi ce modèle ? ». |
| `views/marketing/theme-templates.ejs` | Panneau « Pourquoi ce modèle ? » (formulaire GET, lecture seule). |
| `public/js/page-builder.js` | T3 : après un enregistrement, le composant passe à « Modifications non diffusées » et le bouton « Mettre à jour » apparaît. T8 : « Mettre à jour » appelle `saveNow()` (attend l'enregistrement en cours) et envoie la révision confirmée. Message de conflit adapté (« composant modifié ailleurs » / « page modifiée ailleurs »). |

Aucune dépendance ajoutée. Aucune variable d'environnement touchée.

## Test existant adapté (et pourquoi)
`tests/site-web-entete.test.js` : l'aide `putComponent` envoyait toujours `revision: 0` ; avec une révision désormais réelle, elle lit la révision courante du composant avant d'enregistrer. Les assertions du test n'ont pas changé.

## Garanties du palier 7 : état pour les composants et modèles
| Garantie | Pages | Composants (avant) | Composants (après) |
|---|---|---|---|
| Révision / conflit entre onglets | oui | **non** | oui |
| Publier attend l'enregistrement en cours | oui | **non** | oui |
| Publier la version confirmée | oui | **non** | oui (révision) |
| Version identique = pas de nouvelle version | oui | oui | oui |
| Récupération locale, reprise réseau, session expirée | oui | oui (même code) | oui (testé) |
| Historique de versions / restauration | oui (100) | non | **non** (L6) |

## Ce qui n'a PAS été fait (volontairement)
- En-tête / pied de page du site : restent à application directe (L1) ; les rendre « brouillon puis publier » change un comportement décidé et testé auparavant.
- Onglets / accordéons imbriquant des widgets (L3), modèle de page individuelle générique (L4), éditeur visuel pour l'en-tête du site public (L5), historique de composants (L6).
