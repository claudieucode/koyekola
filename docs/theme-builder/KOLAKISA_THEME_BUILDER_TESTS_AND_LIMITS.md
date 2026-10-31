# Theme Builder 23.1 — tests, résultats et limites connues

## Suites ajoutées (toutes exécutées avant chaque push)
| Fichier | Portée | Tests |
|---|---|---|
| `tests/theme-builder-noyau.test.js` | validation des conditions, évaluation, priorités, exclusions, ET/OU, conflits, explication, conditions personnalisées (sans serveur) | 14 |
| `tests/theme-builder-stockage.test.js` | cycle de vie sur base migrée (création, publication, versions, archivage, duplication, suppression, révision), isolation sites/organisations, import des anciens réglages (idempotent), export/import JSON | 13 |
| `tests/theme-builder-routes.test.js` | écran et API sur serveur réel, droits, isolation, filtres, simulation | 10 |
| `tests/theme-builder-rendu.test.js` | rendu public de bout en bout : en-tête global, en-tête propre à une page (priorité), exclusion, pied de page, accueil, republication, archivage, repli historique, isolation, aperçu, canevas inchangé, modèles produit | 8 |
| `tests/theme-builder-navigateur.test.js` | interface dans Chrome réel : création, éditeur de conditions, publication, filtres, clavier, simulation, téléphone 390 px (cibles ≥ 44 px, pas de défilement horizontal), aucune erreur JavaScript | 3 |
Total : **48 tests**. Tests existants mis à jour (changement légitime, numéro de migration 124) : `palier12-migration-composants-revision`, `site-espace`, `site-menu-p1a`.

## Non-régression
* Fichiers de l'éditeur de pages (`public/js/page-builder*.js`, `views/marketing/page-builder.ejs`, `nodes.js`, `sections.js`) : **non modifiés par ce chantier** (vérifié sur les fichiers de chaque commit Theme Builder).
* Seules modifications hors modules neufs : `pages.withSiteParts` (option opt-in `themeBuilder`, sans effet par défaut), `landingPublic.js` (active l'option), `landing.js` (aperçu de page seulement, **pas** le canevas), `themeRender.renderRegion` (consulte le Theme Builder avant l'ancien système), `siteSpace.js` (raccourci), `index.js` (route).
* Régression ciblée (25 fichiers : parties de site, boutique 20.5, composants, aperçus, modèles de thème, anciennes suites Theme Builder) : 0 échec. Menu / navigation (10 fichiers) : 0 échec après retrait de l'entrée de registre (voir ci-dessous).
* Suite complète : non exécutée.

## Limites connues (honnêtes)
1. **Le site principal n'est pas couvert** : sans ligne de site dédiée, il reste servi par l'ancien système (blog, 404, pages À propos…). Décision produit : créer sa ligne dédiée (migration R9-3).
2. **Aucun rendu public pour page individuelle, article, archives, recherche, 404 des sites du gestionnaire** : ces sites n'ont ni blog ni élément « contenu de la page ». Le moteur et l'éditeur de conditions gèrent ces types ; seuls en-tête, pied de page et produit/archives produits sont consommés par le rendu public.
3. **Pas de barre latérale, panier, paiement, compte** (aucun emplacement/écran de modèle dans le moteur de rendu).
4. **Entrée de menu Apparence absente** : cinq suites figent le registre du menu. Accès : raccourci du tableau de bord du site et adresse directe.
5. **Miniatures filaires**, pas de captures d'écran réelles (pas de navigateur côté serveur de production).
6. Pas de raccourci clavier global (Ctrl+Maj+E) ; pas d'entrée depuis l'éditeur (interdit : modifierait l'éditeur) ; import `.zip` non pris en charge.
7. Conditions d'un modèle **publié** : effet immédiat (pas de brouillon de conditions) ; restaurer une version ne les modifie pas.
8. Le ciblage par « public » (audience) de l'ancien système n'est pas repris : ces modèles restent dans l'ancien système (signalé à l'import).
9. Les pages-documents créées par le Theme Builder sont de vraies pages du site (elles apparaissent dans Pages) ; supprimer un modèle ne supprime pas son document.
10. Déploiement : non vérifiable ici (pas d'accès à l'hébergeur, CI bloquée par la facturation).
