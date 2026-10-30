# Programme 21.5 — tests

`tests/design-generator.test.js` : 25 tests (pur, service en mémoire avec IA simulée, vrai serveur). Aucun appel réseau.
A corporate · exemple immobilier de la mission · B boutique · C portfolio · D éducatif · E palettes (9 ambiances × 12 teintes, contrastes de référence, rejet d'un design dégradé) · F typographie (polices du moteur, hiérarchie) · G jetons (normaliseurs stricts, chemins connus) · H composants (états des boutons, champs ≥ 3:1) · I responsive · J cohérence (même ensemble de réglages pour les variantes, composition transmise au Page Generator) · K protection (réglage publié et réglage en attente conservés, remplacement sur demande) · L IA hors liste / design invalide · M isolation et droits · N quota, régression (rien de publié, pages générées toujours ouvertes dans l'éditeur) · annulation (acceptée / refusée si le brouillon a changé).
## Résultats
Design + page generator + assistant + routes + menu + 3 fichiers du personnalisateur : **146 tests, 146 réussis, 0 échec**. Suite complète non exécutée.
## Non testé
Rendu visuel navigateur ; réponse d'un vrai fournisseur d'IA ; aucun build séparé n'existe (Node, sans étape de compilation).
