# Personnaliser — étape 1 : la coque de l'interface

Reconstruction du module sur une base propre (l'ancien module a été retiré : voir `docs/maintenance/PERSONNALISER_MODULE_REMOVAL_REPORT.md`). Cette étape ne contient **aucun réglage** : seulement la structure.

## Accès
`/marketing/site-web/personnaliser` (site principal) ou `?site=<id>` (un site). Bouton « Personnaliser » dans Apparence → Styles. Droit requis : `appearance.read`. Le site est validé par le serveur (`siteTarget.js`) : un accès limité à un site ne voit que le sien (famille de routes `personnaliser-du-site` / `personnaliser-par-site`).

## Fichiers
| Rôle | Fichier |
|---|---|
| Route, formats d'appareil, configuration envoyée à l'écran | `src/marketing/web/personnaliser.js` |
| Les dix catégories, dans l'ordre (source unique) | `src/marketing/web/personnaliserCategories.js` |
| Vue (panneau + aperçu, icônes) | `views/marketing/personnaliser.ejs` |
| Variables de design `--pz-*` et styles | `public/css/personnaliser.css` |
| Noyau : configuration, bus d'événements, état, « modifications non publiées » | `public/js/personnaliser/core.js` |
| Liste des catégories, vue détail, retour | `public/js/personnaliser/categories.js` |
| Aperçu : chargement, erreur, actualisation, appareil, canal sécurisé | `public/js/personnaliser/preview.js` |
| Appareils, masquage, Fermer, Guide de style, Publier, messages | `public/js/personnaliser/shell.js` |
| Test dans un vrai Chrome (9 parcours) | `tests/personnaliser-coque-navigateur.test.js` |

## Comment les futures catégories s'y branchent
- **Panneau** : `KWPZ.registerPanel("entete", { render(conteneur) { … } })`. Sans panneau, la catégorie affiche seulement « Les réglages de cette catégorie ne sont pas encore disponibles » (aucun faux réglage).
- **État** : `KWPZ.setDirty(true)` quand une catégorie a des modifications non publiées → le bouton Publier s'active, l'avertissement de fermeture apparaît. `KWPZ.set("publishing", true)` affiche l'état de chargement.
- **Événements** : `KWPZ.on("publish", …)`, `"styleguide"`, `"change:device"`, `"preview:loaded"`, `"preview:message"`.
- **Aperçu** : `KWPZ.preview.send(type, données)` envoie un message au site affiché (origine fixée, jamais `*`) ; seuls les messages venant de ce cadre, de cette origine, préfixés `kwpz` sont acceptés. `KWPZ.preview.reload()` recharge.
- **Variables** : toutes les couleurs, hauteurs, espacements, rayons, ombres, transitions et états sont dans `:root` (`--pz-*`). Les futurs modules réutilisent ces variables.
- **Formats d'appareil** : tableau `DEVICES` dans `personnaliser.js` (largeur du viewport simulé ; ajouter un format = ajouter une ligne, plus l'icône `pz-i-<id>`).

## Comportements
- Panneau fixe à gauche (largeur `clamp(272px, 20vw, 340px)`, ≈ 273 px à 1366 px), défilement propre ; barre du haut (Fermer, Guide de style, Publier) et barre du bas (Masquer les contrôles, Ordinateur / Tablette / Mobile) toujours visibles.
- Aperçu : vrai rendu HTML du site dans un cadre de même origine ; la largeur du cadre suit l'appareil (100 %, 768 px, 375 px) donc le site applique ses vraies règles responsives. Masquer le panneau ne recharge pas l'aperçu.
- Sous 900 px de large, le panneau recouvre l'aperçu (tiroir) au lieu de le comprimer.
- Publier est inactif tant qu'aucune catégorie n'a de modification ; le moteur de publication viendra avec les catégories. Guide de style : emplacement et événement prêts, contenu à venir.
