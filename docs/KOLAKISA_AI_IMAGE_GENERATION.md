# Génération d'images par IA — consignes

## Réutilisé
Fournisseurs `demo` (local, gratuit, visuels d'attente) et `openai` (**adaptateur jamais appelé en réel, tarif non vérifié**) ; 3 autorisations avant toute dépense (IA activée pour le site dans l'AI Core + clé du site + autorisation de dépense de l'organisation). Rien n'a été modifié dans ces garde-fous ; l'intelligence visuelle ne crée **aucune tâche** (testé : 0 ligne dans `mk_aimedia_tasks`).

## Amélioré
- Consigne du bandeau : « Sujet placé à droite, grand espace libre à gauche pour accueillir du texte » (avant : « un côté »). Les illustrations suivantes alternent gauche/droite.
- `brief.proposals(entrée, n≤4)` : jusqu'à 4 propositions qui changent le **sujet**, l'**angle** (ensemble, détail, ambiance, plongée) et le **côté** du sujet, avec la même palette et la même ambiance. Test : similarité de mots < 0,7 entre deux propositions.
- Rôles préparés : bandeau, bannière, service, fond, éditorial, produit, illustration, blog. **Témoignage : refusé** (aucun portrait généré : droit à l'image et fausse preuve sociale).
- Aucune instruction de texte, logo ou marque dans l'image : un fournisseur ne garantit pas leur exactitude.

## Limites réelles
Formats générables = ceux des fournisseurs : 1:1, 3:2, 2:3 (pas de 16:9 natif ; un bandeau 16:9 est un cadrage de 3:2, voir `IMAGE_COMPOSITION_AND_CROP`). Les propositions ne sont pas branchées sur l'écran « Médias IA » (API `recommandations.json` seulement). La différence réelle entre propositions n'a pas pu être jugée visuellement : aucune image d'IA n'a été générée.
