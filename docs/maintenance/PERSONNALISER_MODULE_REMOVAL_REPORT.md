# Retrait du module « Personnaliser » — rapport

## Décision

Le module « Personnaliser » (Apparence → Personnaliser, route `/marketing/site-web/personnaliser`) est supprimé : écran, routes, boutons, liens, script, feuille de style, planification, liens d'aperçu partagés, essai de thème, réglages de personnalisation par thème. Aucun masquage, aucun message « bientôt disponible ».

## Ce qui a été supprimé

| Domaine | Éléments retirés |
|---|---|
| Écran | `views/marketing/customizer.ejs`, `public/js/customizer.js`, `public/css/customizer.css` |
| Routes | `src/marketing/web/customizer.js` (écran, aperçu, brouillon, publication, restauration, planification, partage) ; `/personnaliser*` répond 404 |
| Points d'entrée | entrée de menu Apparence, bouton de la barre d'administration, boutons « Personnaliser » des écrans Thèmes (carte, détail, aperçu), tableau de bord, assistant IA, Réglages généraux, Éditeur du site, raccourcis, audits |
| Moteur | panneaux identité, en-tête, pied de page, menus, CSS libre, Publication unique et choix de thème ; planification ; liens partagés ; `previewParts.js` ; crochets d'aperçu des parties (`kwPartsPreview`, `kwShared`) ; tâche planifiée de publication |
| Personnalisation par thème | dossier `src/marketing/themes/customization/`, rangement des options par thème dans `themes.js`, règles CSS `kw-pack-cz`, scripts de mesure, tests, documentation |
| Base de données | migration `132_retrait_personnaliser.sql` : tables `cms_customizer_shares` et `cms_theme_settings`, colonnes `publish_at` / `scheduled_by` / `publish_error` et leur index de `cms_customizer_drafts` |
| Documentation | `KOLAKISA_CMS_PERSONNALISER.md`, `KOLAKISA_PERSONNALISER_TITAN18.md` (les autres documents historiques gardent la trace de l'ancien module) |

## Ce qui a été conservé (partagé avec d'autres modules)

- **Moteur de styles** : l'ancien moteur était aussi celui d'Apparence → Styles, de la Direction artistique (designGen), de la régénération (regen), de la bibliothèque de modèles et de l'éditeur du site. Il est conservé, renommé `src/services/siteStyles.js` et réduit à ses panneaux de design : couleurs, typographie, mise en page, arrière-plan, images, formulaires, appareils, mode sombre, palette, boutons. L'aperçu réel de Styles passe par `src/middlewares/stylePreview.js` (`?kwcustom=1`, session `kwStyleDraft`).
- **Routes de Styles** : maintenant dans `src/marketing/web/styles.js` sous `/marketing/site-web/styles/{rendu,brouillon,annuler,publier,restaurer}`.
- **Tables** `cms_customizer_drafts` et `cms_customizer_versions` (brouillons et historique de Styles) : intactes.
- **Publication unique** : le moteur de rendu (`src/services/singlePost.js`, vues) et les réglages déjà enregistrés (`settings.singlePost`) sont intacts ; seul l'écran qui les éditait a disparu.
- Éditeur de pages, Theme Builder (en-tête, pied de page, modèles, Publication unique), CMS, isolation multisite, thèmes, médias, pages, sites : non modifiés.

## Conséquences à connaître

- Plus d'écran pour modifier le nom, le logo ou l'icône du site principal, le choix d'en-tête/pied, le CSS additionnel, ni les réglages de Publication unique (valeurs conservées et toujours appliquées au rendu).
- Un ancien brouillon contenant des réglages retirés les ignore (marqué périmé) ; les réglages de design restent valables.
- Les liens d'aperçu partagés déjà émis cessent de fonctionner (table supprimée).

## Migration

`132_retrait_personnaliser.sql` : `DROP` des deux tables propres au module et des trois colonnes de planification. Exception documentée à la règle « migrations additives » (tests mis à jour : `programme21-international-migrations`), car ces données ne servaient qu'au module (liens expirables, planification, copie d'options de thème). Le lanceur de migrations réalise une sauvegarde de la base avant toute application. Les migrations 096, 110, 129 et 130 restent dans l'historique (jamais réécrites).

## Tests

- Nouveau : `tests/retrait-personnaliser.test.js` (fichiers absents, aucune référence résiduelle, routes 404, Styles/Thèmes/Theme Builder ouverts, tables supprimées/conservées).
- Mis à jour : tests de navigation, barre d'administration, Styles, Direction artistique, régénération, migrations, inventaire des tables.
- Supprimés (module retiré) : `personnalisateur*.test.js`, `personnalisation-themes*.test.js`, `themes-personnalisation-contrat.test.js`.
- Résultats : voir la fin de ce document.

### Résultats (machine lente, serveur de test réel)

- `retrait-personnaliser` : réussi (fichiers, références, routes 404, tables).
- Réussis après adaptation : navigation (cms-interface, menu-site-inventaire, site-menu-c1, c1-unitaire, p1a-unitaire), barre d'administration, apparence-styles, apparence-parcours, apparence-finitions, single-post-serveur, design-generator, régénération IA, portée des routes, migrations (palier 12, site-espace, site-menu-p1a), thèmes (packs, extension 5, boutique, éditeur).
- Échecs **déjà présents avant ce retrait** (vérifiés sur la version d'origine `7b68de6a`, sans lien avec le module) : `apparence-themes` « supprimer depuis un autre site… » ; migration 131 (briques boutique) contre la règle « migrations additives » du programme 21 ; quatre tables de la migration 131 absentes de l'inventaire des tables. Non corrigés ici (hors périmètre).
- Le test `admin-multisite` « aucune route ni vue Marketing modifiée » compare au dernier commit : il échoue tant qu'un retrait n'est pas commité.
- Tests Chrome (`*-navigateur`) : adaptés par lecture, non lancés.
