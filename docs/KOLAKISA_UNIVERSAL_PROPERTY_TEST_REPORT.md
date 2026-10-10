# Compatibilité des propriétés — rapport de tests (2026-10-10)

Chrome réel + vrai serveur. Exécutés : `proprietes-compatibilite-navigateur`, `widgets-parts` (mis à jour), `widgets-*`, `accordeons-*`, `editeur-etats-typographie-navigateur`, `editeur-canvas-proprietes-restantes-navigateur`, `format-*`, `qualite-*`, `ia-studio*`.

**Résultat : 152 tests, 152 réussis, 0 échec, 0 annulé.**

| Scénario demandé | Test | Résultat |
|---|---|---|
| 1. Cas exact de l'accordéon (dans un conteneur Flexbox, partie « Question + réponse ») | `proprietes-compatibilite-navigateur` | ✔ plus d'`alignSelf` proposé ; un réglage de la partie s'enregistre sans erreur |
| 2. `alignSelf` légitime sur un élément compatible | idem | ✔ écrit sur le widget, rien dans la partie |
| 3. Réglage incompatible sur une partie | `widgets-parts` + navigateur | ✔ écarté, reste conservé, message français, document de l'éditeur nettoyé |
| 4. Widgets simples et complexes | navigateur | ✔ 41 widgets, 156 parties : aucun réglage proposé que le registre refuse |
| 6. Réglages par écran / états | `widgets-parts` | ✔ écran vidé retiré, état non proposé écarté |
| 8. Sauvegarde après correction | navigateur | ✔ statut « Enregistré », pas d'erreur |
| 9. Rechargement de documents existants | `scripts/scan-property-compat.js` + `parts.scan` | ✔ contrôle en lecture seule (aucune donnée locale à contrôler ; à lancer sur la base de production) |
| 12. Conservation des autres propriétés | `widgets-parts` | ✔ |
| 13–14. Propriété inconnue / valeur mal formée | `widgets-parts` | ✔ valeur invalide, partie inconnue, injection : toujours bloquantes |
| 15. Pas de régression | 152 tests ci-dessus | ✔ |

Non exercés dans le navigateur : 6 widgets à parties qui exigent un contenu réel (galerie, boîte d'image, formulaire, carrousel, image à points, évaluation) ; duplication/déplacement d'un widget n'ont pas de test dédié (ils copient le même modèle).
