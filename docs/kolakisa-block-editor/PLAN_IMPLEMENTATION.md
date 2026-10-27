# Plan d'implémentation

Principe : fondations d'abord, chaque lot = test qui échoue → correctif → test vert → non-régression de la suite éditeur → mise à jour de la matrice et du journal. Ordre issu de l'audit (défauts mesurés avant fonctionnalités).

## P0 — Fiabilité et intégrité
| Lot | Contenu | État |
|---|---|---|
| P0-1 | Tests périmés (suppression d'article → corbeille puis définitive) | **fait** |
| P0-2 | D2 : autosave trop grosse refusée (413), plus de JSON tronqué | **fait, testé** |
| P0-3 | D4 : brouillon automatique et création depuis un site rattachés au site (serveur + client) | **fait, testé** (client : test sur la source ; test navigateur à écrire) |
| P0-4 | D1 : frappes pendant l'envoi jamais déclarées enregistrées | **fait**, test sur la source seulement ; **test navigateur à écrire** |
| P0-5 | D5 : course autosave/`ensurePost` vs `save()` → articles en double (verrou partagé) | à faire |
| P0-6 | D3 : conflit obligatoire pour l'éditeur (jeton de révision entier, pas la seconde) ; autosave avec contrôle d'auteur | à faire |
| P0-7 | D10 : restauration de révision re-sanitisée ; droits `revisions.*` alignés avec la doc | à faire |
| P0-8 | D6/D7 : réutilisables rattachés à un site, validation de `data-ref` par site, historique des modifications globales, suppression sans réécriture muette | à faire (migration → plan de récupération requis) |
| P0-9 | D8/D9 : médiathèque du blog filtrée par site ; `loadPost` avec défense en profondeur | à faire |
| P0-10 | D11 : bloc de repli pour les blocs inconnus ; rapport « éléments non pris en charge » avant perte | à faire |
| P0-11 | D12 : promotion des articles programmés avec révision, recontrôle et droits | à faire |

## P1 — Édition fondamentale
Grouper/Dégrouper ; transformations inter-blocs ; copier/coller de styles ; ancre HTML et classes CSS supplémentaires (liste blanche sûre) ; blocs manquants à valeur réelle (Fichier, Couverture, Média et texte, Préformaté, Verset, Lire la suite, Bouton « Lire la suite », Table avec légende) ; sélection multiple ; raccourcis Gutenberg manquants ; commandes de bloc dans la palette ; état désactivé annuler/rétablir ; plein écran en mode Blocs ; glisser depuis l'inserteur ; verrouillage des blocs imbriqués.

## P2 — Organisation
Patterns non synchronisés + catégories ; vue en liste avec glisser-déposer ; styles de bloc et variations ; réglages de design génériques (couleur, espacement, bordure) via jetons du site.

## P3 — Document
Aperçu appareil sur le canevas ; état disabled/erreur/conflit unifiés ; commentaires par article (migration).

## P4 — Extensibilité
Registre central de blocs (DT-4) ; API d'enregistrement ; migrations/dépréciations versionnées ; diagnostic.

## P5 — Finitions
Accessibilité (clavier + lecteur d'écran), performances sur grands documents, comparaison finale.

## Blocages à décider par le propriétaire du produit
1. **Éditeur de blocs pour les pages** : modèle de contenu commun pages/articles (DT-1).
2. **Bloc HTML personnalisé** : le réserver aux administrateurs, ou non.
3. **Brouillon automatique pour les accès limités** (DT-6).
4. **Rôle « formateur » sans limite de site** (D8) : comportement voulu pour le créateur, ou à restreindre ?

## Validation, Git, déploiement
- Suite éditeur (16 fichiers) avant/après chaque lot. Aucune suppression de test.
- Branche `feat/editeur-blocs-parite-gutenberg` ; commits locaux uniquement tant que la cible de déploiement n'est pas confirmée. Aucune migration ni déploiement en production sans sauvegarde de déploiement (script R9 existant) et accord explicite.
