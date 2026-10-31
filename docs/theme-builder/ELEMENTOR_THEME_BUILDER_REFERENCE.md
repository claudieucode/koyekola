# Elementor Theme Builder — référence fonctionnelle

*Sources consultées le 31/10/2026 : elementor.com/help/the-elementor-theme-builder/, elementor.com/help/conditions/, developers.elementor.com/docs/themes/ et /docs/theme-conditions/. Les captures d'écran mentionnées par la demande n'ont pas été transmises à l'outil : l'interface est décrite d'après la documentation écrite. Ce qui n'est PAS établi par ces sources est marqué « non documenté » et n'est pas inventé.*

## Définition
Le Theme Builder crée des **parties de site** (« site parts ») : des modèles qui s'ajoutent à la hiérarchie des modèles du thème, ou la remplacent, ainsi que ses réglages de mise en page et son CSS, sans coder. Parties : En-têtes, Pieds de page, Pages et Articles globaux (« single »), Archives globales, Produits et Archives de produits (WooCommerce). L'écran principal montre toutes les parties du site et indique s'il manque des modèles nécessaires.

## Accès
Menu Elementor › Theme Builder ; logo de l'éditeur › Theme Builder ; raccourci Cmd/Ctrl + Maj + E depuis tout écran.

## Tableau de bord
* Miniatures générées automatiquement ; une image mise en avant remplace la miniature.
* Sans modèle : miniatures par défaut pour chaque type disponible.
* Indicateur de conditions dans la barre latérale : **point vert = « live », avec conditions** ; **point gris = brouillon, sans conditions**.
* Ajout : « Add New » (haut droite), « + » au survol d'une étiquette latérale, « + » sur une miniature. Import : icône Import, fichier `.json` ou `.zip` (téléversements non filtrés requis).
* Édition : clic sur l'étiquette → tableau de détail de la partie → « Edit » (ouvre l'éditeur) ; « Edit Conditions » en bas à gauche ; étiquette « Instances » = où le modèle est utilisé.
* Menu « ⋯ » d'une partie : Export (`.json`), Trash (avec confirmation), Rename.

## Contraintes et limites documentées
* Un Theme Builder **ne s'exporte pas comme thème WordPress autonome** ; on migre via les outils d'import/export (réglages ou contenu complet).
* Dépend de l'API REST ; REST désactivée → « Error: you are not allowed to do that ».
* Intégration thème : un thème est compatible s'il déclare des **emplacements** (header, footer, single, archive, personnalisés) qu'Elementor remplace par ses modèles.

## Non documenté par les sources lues
Règles exactes de priorité entre conditions concurrentes ; résultat quand une page correspond à la fois à une inclusion et à une exclusion ; suppression de conditions ; mécanisme de cache. Voir `ELEMENTOR_DISPLAY_CONDITIONS.md` : le comportement retenu pour Kolakisa y est défini explicitement comme **choix de conception**, pas comme fait Elementor.
