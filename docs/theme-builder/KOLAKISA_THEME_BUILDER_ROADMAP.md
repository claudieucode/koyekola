# Feuille de route du Theme Builder (par lots)

Chaque lot : tests exécutés → commit → push ; déploiement automatique par l'hébergeur (non vérifiable sans accès : voir le rapport). Aucune modification de l'éditeur de pages à aucun lot.

| Lot | Contenu | Livrable testable |
|---|---|---|
| 0 | Documentation Elementor, audit, parité, architecture | ce dossier |
| 1 | Noyau : registre de types, schéma de conditions, évaluation, résolution, conflits, explication | tests unitaires purs (sans serveur) |
| 2 | Migration + store isolé par site (CRUD, brouillon/publié, versions, archivage, duplication), import legacy idempotent, import/export JSON validé | tests serveur réel + isolation |
| 3 | Tableau de bord, barre latérale par type, cartes, filtres, éditeur de conditions, conflits affichés, instances, ouverture dans l'éditeur existant | tests serveur + navigateur |
| 4 | Miniatures, aperçu avec contenus réels | tests |
| 5 | Branchement du rendu public (header, footer, singles, archives, recherche, 404, produit) avec repli et cache invalidé | tests de rendu de bout en bout |
| 6 | Sidebar, pages boutique supplémentaires (selon moteur), conditions personnalisées | selon faisabilité documentée |
| 7 | Non-régression éditeur (hachage + suites existantes), performance, accessibilité, rapport final | rapport |

Risques : (a) le site principal sans ligne dédiée ; (b) volume des appelants de `renderRegion` ; (c) captures d'écran de référence non accessibles à l'outil — l'ergonomie suit la documentation écrite ; à confirmer visuellement par l'utilisateur après le lot 3.
