# 03 — Parcours utilisateur

Parcours de bout en bout du module, avec l'écran de départ et la vérification qui les couvre. « Vérifié » = couvert par un test automatisé ; « simulé » = le fournisseur d'envoi est une simulation.

| # | Parcours | Écrans | Vérification |
|---|---|---|---|
| 1 | Créer une audience (liste) et y ajouter des contacts | Marketing → Audiences | vérifié (`marketing-audience`) |
| 2 | Importer un CSV : aperçu, correspondance des colonnes, rapport des lignes rejetées | Marketing → Contacts → Importer | vérifié (`marketing-import`, `marketing-import-csv`) |
| 3 | Vérifier statut et consentement d'un contact | fiche contact | vérifié (`marketing-conformite`) |
| 4 | Créer un segment (ET / OU / NON, imbrication, estimation) | Marketing → Segments | vérifié (`marketing-segments`) |
| 5 | Construire une campagne en 7 étapes (modèle, objet, expéditeur, cible, suivi, programmation, contrôle) | Marketing → Campagnes | vérifié (`marketing-r4-campagnes-data`) |
| 6 | Choisir un modèle de départ, personnaliser, enregistrer (versions) | Marketing → Modèles | vérifié (`marketing-r5-*`) |
| 7 | Aperçu bureau/tablette/mobile, texte brut, **vérification des liens**, e-mail de test | éditeur → Aperçu | vérifié (`marketing-apercu-v2`, `marketing-linkcheck-route`) |
| 8 | Contrôle avant envoi, confirmation, programmation | campagne → liste de contrôle | vérifié (`marketing-campaigns`) |
| 9 | Envoi (simulé), reprise après panne, pause automatique de réputation | worker | simulé (`marketing-campaigns`, `marketing-reputation`) |
| 10 | Retours du fournisseur (livré, rebond, plainte) puis statistiques | rapport de campagne | simulé (`marketing-tracking`) |
| 11 | Déclencher un scénario (inscription, commande…) et suivre chaque passage | Marketing → Automatisations | vérifié (`marketing-automations`, `cms-automation-engine`) |
| 12 | Désinscription en un clic, centre de préférences, réinscription par la personne avec confirmation | liens de l'e-mail | vérifié (`marketing-public`, `contacts-fusion-refus`) |
| 13 | Permissions et isolation entre sites et organisations | tous | vérifié (`isolation-*`, tests à deux organisations) |
| 14 | Test A/B : répartition, délai, gagnant avec valeur probante | campagne → A/B | vérifié (`marketing-tests-ab`, `marketing-ab-preuve`) |

Parcours non couverts de bout en bout par un envoi réel : voir `13_KNOWN_LIMITATIONS.md`.
