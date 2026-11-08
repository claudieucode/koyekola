# Référence Elementor — Page 404

> Étude du 2026-11-08. Elle **complète** `docs/theme-builder/elementor-404-reference.md` (2026-11-03). Elementor Pro n'a **pas** été installé ni observé : tout ce qui suit vient de la documentation et d'articles publics. Chaque affirmation porte son niveau de confiance : **[officiel]** (aide Elementor), **[tiers]** (article ou extension tierce), **[à vérifier]** (non confirmé).

## 1. Ce qu'Elementor offre pour une page 404
| Sujet | Constat | Confiance |
|---|---|---|
| Création | Templates → Theme Builder → *Single* → *Add New* → type de contenu **404 / Error 404** → *Create Template*. | [officiel] https://elementor.com/help/error-404-site-part/ |
| Licence | Le Theme Builder (donc le modèle 404) est une fonction **Elementor Pro**. | [officiel] https://elementor.com/help/error-404-site-part/ |
| Conditions | Une règle « Include : 404 Page » est proposée à la publication ; on peut ajouter plusieurs conditions, en **inclusion** ou en **exclusion**. Accès : lien *Edit Conditions* ou flèche à côté de *Publish* → *Display Conditions*. | [officiel] https://elementor.com/help/conditions/ |
| Plusieurs modèles 404 | Un seul est actif ; selon un guide tiers, c'est « le plus récemment publié ». | [tiers] https://spexoaddons.com/documentation/build-custom-404-layout/ — **[à vérifier]** sur la version courante |
| Contenu | L'éditeur visuel et les widgets habituels s'appliquent ; modèles prédéfinis de bibliothèque ou départ vide. | [officiel/blog] https://elementor.com/blog/customized-404-page/ |
| Conseil de nommage | Ne pas nommer le modèle « 404 » (collision avec les permaliens). | [blog officiel] |
| Statut HTTP | Aucune source officielle trouvée qui **garantisse** le statut 404 ; un article indique que le statut et un `noindex` sont à vérifier avec un outil (curl). | [tiers] — **[à vérifier]** |
| Risque connu de « soft 404 » | Un filtre `pre_handle_404` ajouté pour la pagination des archives peut renvoyer **200** sur des archives inexistantes ; cela concerne les *archives*, pas le modèle 404 lui-même. | [tiers] https://gist.github.com/robwent/71b4a86b3bcc3fd7d740f486c67d915b |

## 2. Ce qu'il faut retenir pour Kolakisa
1. La parité visée est le **parcours** Elementor (créer, éditer avec les widgets, conditions inclure/exclure, prévisualiser, publier) — pas une copie visuelle.
2. Elementor laisse la page 404 être un modèle comme un autre ; **le statut HTTP reste une responsabilité du moteur**, pas du modèle. Kolakisa le garantit déjà dans son routage (voir KOLAKISA_EXISTING_ARCHITECTURE.md, §3).
3. Les bibliothèques de modèles d'Elementor et des extensions tierces ne sont **pas** des fonctions natives : elles ne sont jamais présentées comme telles ici.

## 3. Ce qui n'a pas pu être confirmé
- La liste exhaustive des conditions d'affichage de la version actuelle.
- Le contenu exact de la bibliothèque de modèles 404 prédéfinis (Elementor Pro).
- Le comportement exact en cas de plusieurs modèles 404 publiés (voir tableau).
- Les contrôles précis (animations d'entrée, mouvements, effets) de chaque widget : voir ELEMENTOR_WIDGET_INVENTORY.md.

## Sources consultées
- https://elementor.com/help/error-404-site-part/
- https://elementor.com/help/conditions/
- https://elementor.com/blog/customized-404-page/
- https://developers.elementor.com/docs/theme-conditions/
- https://spexoaddons.com/documentation/build-custom-404-layout/ (tiers)
- https://gist.github.com/robwent/71b4a86b3bcc3fd7d740f486c67d915b (tiers)
