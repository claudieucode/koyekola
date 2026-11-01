# Widgets Elementor — audit de l'éditeur Kolakisa et causes (2026-11-01)

## Question posée
« Mon éditeur ne contient toujours pas tous les widgets Elementor annoncés. » Méthode : relevé de la liste officielle actuelle des widgets Elementor, puis vérification **dans l'éditeur réel** (Chrome), widget par widget, de ce qu'un utilisateur peut trouver et ajouter.

## Ce qui a été mesuré
1. **Liste officielle** : navigation du centre d'aide Elementor (https://elementor.com/help/elementor-pro-vs-free/, consultée le 2026-11-01) → 92 widgets/éléments (`src/marketing/pages/elementorWidgets.json`).
2. **Registre réel** : 99 types enregistrés (`nodes.editorSpec().types`) + 44 raccourcis de bibliothèque au départ ; 102 types après l'intervention.
3. **Parcours utilisateur testé** (`tests/elementor-widgets-decouverte-navigateur.test.js`) : ouvrir l'éditeur, taper le **nom Elementor** dans la recherche de la bibliothèque, vérifier que l'entrée Kolakisa apparaît et est active, cliquer, vérifier qu'un élément du bon type est ajouté au canevas.

## Cause principale (prouvée)
Avant correction, **la recherche de la bibliothèque ne connaissait que les libellés et mots-clés français**. Sur les 86 widgets qui existaient déjà, la recherche par le nom Elementor (« Flip Box », « Price Table », « Heading », « Image Box », « Counter », « Icon Box »…) ne renvoyait **rien** : le widget existait, mais restait invisible pour quiconque le cherchait comme dans Elementor. C'est ce qui donne l'impression que « les widgets ne sont pas là ». Les anciens inventaires du dépôt disaient « Complet » parce qu'ils vérifiaient le registre, pas ce que l'interface permet de trouver.

## Correctif
- Une seule table (`elementorWidgets.json`) lie chaque nom officiel à l'entrée de bibliothèque Kolakisa.
- `src/marketing/pages/elementorNames.js` ajoute ces noms aux mots-clés de recherche (types **et** raccourcis) dans `editorSpec()` : recherche, doc et tests lisent la même table (pas de liste dupliquée).

## Widgets réellement absents (et traités)
| Widget | Décision |
|---|---|
| Stripe Button | **Ajouté** (`stripebutton`) — lien de paiement hébergé Stripe, domaines en liste blanche, aucune clé ni script |
| PayPal Button | **Ajouté** (`paypalbutton`) — PayPal.me / don / bouton hébergé, domaines et chemins en liste blanche |
| Sidebar | **Ajouté** (`sidebar`) — affiche la zone « Colonne latérale principale » d'Apparence → Widgets |
| Facebook Comments | **Bloqué par une dépendance** : identifiant d'application Facebook + script externe |
| Shortcode | **Non implémenté** : sécurité (exécution de code côté serveur) ; remplacé par étiquettes dynamiques et HTML sécurisé |
| Template | Équivalent existant sous **Blocs → Composants** (pas une entrée de « Éléments ») |

## Limites de cet audit
- Les **contrôles détaillés** de chaque widget Elementor (contenu, style, avancé, responsive) n'ont pas été relus un par un dans cette intervention ; la parité détaillée antérieure (`docs/ELEMENTOR_PARITY_MATRIX.md`, `docs/elementor-reference/`) n'a pas été re-dérivée.
- La disponibilité Free/Pro par widget n'est pas donnée par la source consultée ; seules les mentions du billet https://elementor.com/blog/?p=151985 sont reprises.
- Tableau de vérification complet : `ELEMENTOR_WIDGETS_2026-11.md` (généré).
