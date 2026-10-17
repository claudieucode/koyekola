# Rapport de tests du noyau

## Tests ajoutés (échouaient avant les corrections)
- `noyau-integrite` (5) : normalisation idempotente et sans perte pour tous les types instanciables ; aller-retour d'enregistrement ; interaction vers un élément absent (échoue sans la correction) ; identifiants en double refusés ; propriété inconnue écartée.
- `noyau-integrite-navigateur` (4, Chrome réel) : duplication avec redirection des interactions (échoue sans la correction) ; suppression / annulation / rétablissement ; modification sans perte de sélection ni d'identifiant et brouillon inchangé à la réouverture ; duplication refusée au-delà de 400 éléments.
- `noyau-resilience` (3) : page publiée avec élément corrompu (500 avant), numéros de liens conservés, aperçu sans modification des données.
- `editeur-v3` : fixture corrigée (la cible d'une interaction doit exister dans la page).

## Suite complète (`node --test --test-concurrency=2 "tests/*.test.js"`, 11 octobre 2026)
4 744 tests lancés, 4 734 réussis, **2 échecs + 5 annulés** avant rejeu :
- `editeur-v3` « élément : classes, attributs, interactions… » : **causé par ma correction D2** (fixture sans cible) → corrigé, rejoué : 7/7.
- `cms-navigation-navigateur` (5 tests) : **réussit seul** (34/34 avec le fichier voisin) → échec sous charge de la machine.
- `marketing-import` « 5 000 lignes importées en quelques secondes » : seuil de 8 s dépassé (9–10 s). **Échoue à l'identique sur la branche précédente non modifiée** (`elementor-parity-3`) : lenteur de la machine, sans lien avec le noyau. Non corrigé (le seuil appartient à un autre module).

Après correction de la fixture, les fichiers touchés repassent ; une nouvelle suite complète n'a pas été relancée après cette dernière correction d'un seul test (honnêteté : le total « tout vert » n'est pas démontré pour ce dernier état).

## Performance avant / après (banc identique, mêmes pages)
| Mesure | Avant 25 / 100 | Après 25 / 100 |
|---|---|---|
| Sélection synchrone, médiane | 8,5 / 8,9 ms | 9,8 / 8,6 ms |
| Sélection → image, médiane | 49 / 37 ms | 33 / 33 ms |
| Modification de style → canevas | 19–35 / 23–35 ms | 6–25 / 21–26 ms |
| Rafale de 40 frappes | 663 / 816 ms | 652 / 733 ms |
| Annuler (synchrone) | 34–58 / 33–41 ms | 29–40 / 47–274 ms (un pic) |
| Erreurs de script | 0 / 0 | 0 / 0 |
**Conclusion : aucune différence au-delà du bruit de mesure** (le pic d'annulation à 100 éléments n'est pas reproduit systématiquement). Aucune amélioration de performance n'est revendiquée.

## Ce que les tests ne prouvent pas
Chrome seulement ; machine ancienne ; pas de test de fuite sur de longues sessions ; le rendu d'un élément corrompu dans le canevas de l'éditeur est vérifié via l'aperçu (le canevas ne peut pas recevoir de données corrompues, le serveur les renormalise).
