# Programme 22.3 — Advanced Layout Generation & Professional Page Composition

Branche `feat/programme-22-3-advanced-layouts` (issue de `origin/main` 3abf0fd1).

## 1. Audit (avant développement)
| Système | Constat réel | Décision |
|---|---|---|
| Page Builder (`marketing/pages/nodes.js`) | Arbre de nœuds : conteneur « bande », grille, pile, flex, galerie, accordéon, tarifs, témoignages, compteurs, liste d'icônes, tableau. CSS Grid complet (pistes `fr`, portées, placement par lignes/colonnes, `dense`), 3 écrans (ordinateur, tablette ≤1023 px, mobile ≤767 px) avec héritage, jetons d'espacement/rayon/taille/couleur. 400 nœuds et 8 niveaux au plus. | Base de tout le moteur : aucune nouvelle brique de rendu |
| Page Generator (21.4) | 14 types de sections simples (`hero`, `features`, `faq`…) ; ses docs déclarent grille asymétrique, galerie, bandeau scindé « non disponibles » | Inchangé. Ces capacités existent dans le Page Builder : le nouveau moteur les produit sous forme de sections `layout` |
| Design Generator (21.5) | Attributs de section (`padding`, `background`, `align`, `width`) | Non modifié ; le moteur lit la direction par texte (ton, secteur) |
| Intelligent Regeneration (21.9) | Protections, instantanés, historique, annuler | Réutilisés tels quels (`regen.protect`, `regen.snapshots`, `regen.histories`, `regen.undo`) |
| Registres « Layout Intelligence », « Composition Planner », « Component Mapper » séparés | N'existent pas en tant que modules distincts (le Component Mapper est `pageGen/mapper.js`) | Fonctions créées dans `src/layoutGen/` |
| Programme 22.1 | `KOLAKISA_WEB_QUALITY_AUDIT.md` (audit, aucun jeu de scénarios chiffré) | Lu ; pas de scénarios de référence à comparer (voir TESTS) |
| Programme 22.2 | Aucune décision trouvée dans le dépôt ni dans l'historique Git | Non consulté : à signaler |

Limites relevées : pas de composant « galerie dynamique » hors du nœud `gallery` ; pas de formulaire dans l'arbre de nœuds (le formulaire reste une section `form`) ; pas d'icônes dans les cartes de section ; défilement animé (« scroll-based ») non généré.

## 2. Livré
`src/layoutGen/` : `base.js` (échelle d'espacement, fabrique de nœuds), `builders.js` (constructeurs), `patterns.js` (registre : 55 layouts, 7 familles), `intent.js` (intention + mapping du contenu), `responsive.js`, `balance.js`, `validate.js`, `index.js` (sélection, composition, variantes), `apply.js` (proposition, application, annulation). Route `src/marketing/web/layouts.js`, vue `views/marketing/site-layouts.ejs`, `public/js/layouts.js`, `public/css/layouts.css`.

Aucun appel IA, aucun coût. Aucune migration : deux tables créées à la demande (`mk_layout_sections`, `mk_layout_proposals`).

## 3. Écran
`/marketing/site-web/sites/<id>/mises-en-page` : page, section, rôle, type de page, contenu → galerie de variantes avec filtres par famille, aperçu filaire par écran, comparaison, application au brouillon, annulation.
