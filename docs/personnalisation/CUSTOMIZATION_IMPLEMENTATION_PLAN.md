# Plan d'implémentation — personnalisation ciblée (31/10/2026)

## Principe
Ne pas reconstruire : le Personnaliser (global, par site) et le Page Builder (local, par nœud) existent. Le défaut est **l'absence de lien et de portée entre les deux**.

## Lot 1 — livré (22.11)
1. Portée annoncée à la sélection (nom + nombre réel d'éléments dans l'aperçu) et à la publication.
2. Voie locale : lien « Modifier seulement cet élément » → éditeur de pages, élément sélectionné (`#element=<id>`).
3. Tests : navigateur (sélection, portée, lien, arrivée, identifiant inconnu, fenêtre de publication) ; HTTP (règle locale limitée à son élément, autre site inchangé, retour à l'état initial).

## Lots proposés (non faits)
| Lot | Contenu | Critères de validation |
|---|---|---|
| 2 | Identité des sections de modèles (`kw-s-<id>` stable) pour étendre la voie locale aux héros, listes, formulaires | clic sur un héros → lien local ; test de non-fuite |
| 3 | Réglages d'en-tête dans le Personnaliser : collant, ombre, hauteur, fond (écrits comme styles du conteneur d'en-tête) | rendu public vérifié, aperçu, version |
| 4 | Barre d'annonce globale (composant global + condition « tout le site ») | publication, désactivation par page |
| 5 | Unifier les circuits de publication (brouillon de page vs brouillon du Personnaliser) ou les relier visuellement | un seul récapitulatif des changements en attente |
| 6 | Rejouer les parcours header/menu/footer en navigateur (les 8+ tests de menu préexistants échouent déjà) | tests verts sur `main` |

## Risques
Les tests navigateur du menu d'un site échouent déjà sur `main` : toute régression visuelle du menu serait difficile à distinguer sans les réparer d'abord.
