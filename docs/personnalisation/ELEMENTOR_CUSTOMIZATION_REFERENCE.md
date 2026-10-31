# Référence Elementor — personnalisation du header, du footer et des styles

*Recherche documentaire du 31/10/2026. **Aucune installation d'Elementor n'a été testée** ; les sources sont l'aide officielle quand elle est remontée, sinon des guides tiers (signalés). Les fonctionnalités récentes (Variables, classes globales, boucle) n'ont pas pu être confirmées par une source officielle lors de cette recherche.*

| Domaine | Ce que les sources établissent | Source |
|---|---|---|
| Theme Builder | Modèles de header, footer, page unique, archive, etc. ; **conditions d'affichage** obligatoires : sans condition le modèle n'est rendu nulle part (« Entire Site » pour un header global) | [aide Elementor](https://elementor.com/help/how-to-fix-a-missing-header-or-footer-in-elementor/) |
| Priorité de mise en page | La disposition « Canvas » d'une page masque volontairement header et footer globaux | idem |
| Réglages du site (Site Settings) | **Design System** : couleurs globales (Primary, Secondary, Text, Accent + personnalisées) et typographies globales ; **Theme Style** : valeurs par défaut des éléments (arrière-plans, titres, boutons, images, champs de formulaire) | [aide Elementor](https://elementor.com/help/site-settings) |
| Header | Conteneur(s) avec logo + widget de menu de navigation ; sticky natif (Pro) : conteneur → Avancé → Effets de mouvement → Sticky « Haut » ; effets plus riches (transparence puis couleur au défilement, masquage) via code ou module complémentaire | guide tiers ([The Plus](https://theplusaddons.com/blog/sticky-header-in-elementor/)) |
| Conteneurs | Flexbox et Grid (à activer dans les réglages) | [aide Elementor](https://elementor.com/help/?p=43051) |
| Portée d'un style | Le réglage d'un **widget** est local à ce widget ; les **couleurs/typographies globales** sont référencées (un changement se propage) ; le Theme Style fixe des valeurs par défaut par type d'élément | [Déduit] des sources ci-dessus |
| Variables, classes globales | Annoncées dans la page de l'extension (« Variables and Classes ») ; **comportement exact non établi ici** | [page de l'extension](https://wordpress.org/plugins/elementor/) |
| Aperçu / publication | Éditeur en direct, brouillon, publication ; **non détaillé dans les sources lues** | — |

## Ce que cette référence apporte à Kolakisa
1. Séparation nette **style global référencé** (Design System) / **valeur par défaut par type** (Theme Style) / **réglage local d'un widget**.
2. Les modèles de header/footer ont des **conditions d'affichage** explicites, avec un moyen de comprendre pourquoi un modèle ne s'affiche pas.
3. Le sticky est un réglage du conteneur du header, pas un réglage global du thème.
