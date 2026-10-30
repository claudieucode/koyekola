# Programme 21.4 — tests

`tests/page-generator.test.js` : 26 tests (service sur base en mémoire avec les vraies migrations ; web sur vrai serveur). IA simulée et déterministe, aucun appel réseau.
A accueil · B contact · C services · D galerie · E e-commerce (pages absentes non générées, catalogue de formations natif) · F composant absent / alternative / règle neutralisée · G propriété invalide · H structure malformée et proposition altérée · I plusieurs pages + génération d'une seule · J responsive · K page existante (4 stratégies) · L enregistrement, réouverture, normalisation idempotente, rendu · M isolation (service et web, droits, anonyme) · N quota de l'IA centrale, module du site, texte seulement, sans clé · annulation · bornes du plan · web : proposition → aperçu → application → ouverture dans l'éditeur (200).
## Résultats
Génération + régressions (page-generator, assistant-creation-site, portee-des-routes, menu-site-inventaire, marketing-ia-redaction) : **88 tests, 88 réussis, 0 échec**. Suite complète du projet non exécutée.
## Non testé
Rendu visuel navigateur ; vraie réponse d'un fournisseur d'IA ; édition manuelle dans l'interface graphique de l'éditeur (seule l'ouverture HTTP est contrôlée).
