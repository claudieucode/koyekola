# Bibliothèque de blocs de l'éditeur d'e-mails

## Audit de départ

* Moteur : `src/marketing/templates/blocks.js` — 16 types de blocs (titre, texte, image, bouton, séparateur, espace, colonnes, citation, liste, réseaux sociaux,
  vidéo, formation, lien, coupon, articles, sondage), HTML d'e-mail sûr (tableaux, styles en ligne, 600 px), variables et conditions du moteur fermé
  (`engine.js`), validation bloquante à l'enregistrement (adresse https obligatoire, texte alternatif des images, variable inconnue, champ obligatoire).
* Palette : 5 groupes écrits en dur dans `web/templates.js` (`BLOCKS`, `PRESETS`, `PALETTE`), 16 blocs + 3 ensembles (GIF, Appel à l'action, Offre) = **19 entrées**.
* Décision conservée : **pas de bloc « HTML libre »** (contenu non maîtrisé dans un e-mail, voir le commentaire de `web/templates.js`).

## Architecture ajoutée

| Élément | Fichier |
|---|---|
| Registre (id stables `email.button`, nom, catégorie, icône, description, mots-clés, indicateurs essentiel / e-commerce / dynamique / avancé / transactionnel / adaptatif) | `src/marketing/templates/catalog.js` |
| Ensembles prêts à l'emploi (définitions uniques, lues par le serveur et par le navigateur) | `catalog.js#PRESETS` → `data.presets` |
| Palette générée depuis le registre, 18 catégories (les vides sont masquées) | `web/templates.js#buildPalette`, `views/marketing/template-editor.ejs` |
| Recherche (accents, plusieurs mots, nom > catégorie > mots-clés), filtres, accordéons, récents (8, mémorisés dans le navigateur) | `public/js/marketing-editor.js` (section « Palette ») |
| Blocs enregistrés « Mes blocs » (table `mk_saved_blocks`, migration 060, routes JSON, services) | `src/marketing/templates/saved.js`, `migrations/060_blocs_enregistres.sql`, `web/templates.js` |

Aucun bloc existant n'est supprimé ni remplacé : les 16 types et les 3 ensembles d'origine sont conservés (test dédié).

## Inventaire

| | Avant | Après |
|---|---|---|
| Types de blocs (moteur) | 16 | 16 (inchangés) |
| Ensembles prêts à l'emploi | 3 | 15 (+12) |
| Entrées du registre | 19 | 31 |
| Catégories | 5 | 18 prévues, 13 remplies |

Catégories remplies : Texte, Médias, Actions, Mise en page, Social, E-commerce, Marketing, Contenu, Formulaires, Avis & preuve sociale, Dynamique & personnalisation,
Événements, Transactionnel — plus « Récemment utilisés » et « Mes blocs » (alimentées par l'utilisation).

Nouveaux ensembles (tous faits de VRAIS blocs, ensuite modifiables séparément) : Bandeau d'accueil, Promotion limitée, Date limite, Avantages, Étapes, Témoignage,
Note et avis, Message personnalisé (prénom + valeur de secours), Contenu selon le pays (condition d'affichage), Invitation à un événement, Confirmation de commande
et Accès à la formation (variables `event.*`).

## Ce qui n'existe pas, et pourquoi (honnêteté)

* **Navigation** (menu), **Formulaires** actifs, **AVANCÉ / HTML libre**, **Blocs système** : aucun bloc n'est ajouté tant que le moteur ne sait pas les rendre dans
  un e-mail (un formulaire ne fonctionne pas dans les messageries ; le HTML libre est exclu volontairement). Les catégories restent vides et masquées.
* **Compte à rebours en direct** : impossible sans image générée par un serveur à chaque ouverture. « Date limite » est un rappel **écrit**.
* **Produits** : « Formation » s'appuie sur le catalogue réel de formations ; il n'y a pas de catalogue de produits physiques.
* **Étoiles de notes** : caractères ★ en texte ; les avis sont à recopier par l'auteur (aucun avis inventé n'est envoyé : le texte d'exemple est à remplacer).
* **Rendu réel dans Gmail / Outlook / Apple Mail** : non testable ici. Le HTML suit les règles de compatibilité (tableaux, styles en ligne, pas de script ni
  de formulaire) et est vérifié par analyse, pas par capture dans chaque messagerie.
* **Blocs enregistrés** : un bloc (ou plusieurs) enregistré se réinsère comme une copie indépendante ; il n'est pas « lié » (modifier la copie ne change pas l'original).
  Pas de sections/modèles enregistrés à part : les modèles d'e-mails existent déjà (page Modèles).

## Vérifications avant envoi (déjà en place, testées)

Image sans texte alternatif, bouton / lien sans adresse, adresse non https, variable inconnue, bloc vide : refusés avec un message clair. Alertes de qualité
(`lint.js`) : objet, préheader, variables sans valeur de secours, adresse de l'expéditeur, contraste des boutons, images manquantes…

## Tests

* `tests/marketing-bibliotheque-blocs.test.js` — registre (ids, catégories, icônes, aucun bloc perdu), recherche, compilation de chaque ensemble par le moteur,
  palette rendue, blocs enregistrés (création, doublon, type inconnu, suppression), vérifications avant envoi.
* `tests/marketing-bibliotheque-blocs-navigateur.test.js` (vrai Chrome) — grille 2 colonnes alignée, recherche (photo, achat, vente, social), filtres, accordéons,
  ajout par clic et par glisser-déposer, annuler / rétablir, duplication, enregistrement puis réouverture identique, récents après rechargement, tous les ensembles,
  « Mes blocs » (enregistrer, retrouver dans un autre modèle, insérer, supprimer).
