# KOLAKISA — Chapitres (programme d'une formation)

Branche `chapitres-refonte-01`. Périmètre : l'espace formateur, écran « Chapitres » (`/formateur/chapitres`, liste des formations) et surtout le constructeur de programme `/formateur/cours/:id/curriculum`.
Tables : `sections` (chapitres), `lessons` (sous-chapitres), `quizzes`, `lesson_attachments`. Un « sous-chapitre » est une leçon ; les états « brouillon / publié » n'existent qu'au niveau de la formation.

## 1. Audit (état avant la mission)
| Constat | Détail |
|---|---|
| Renommer un chapitre | **Impossible** : aucune route, aucun écran. |
| Réordonner | Glisser-déposer HTML5 uniquement : inutilisable au clavier, au lecteur d'écran et au doigt. La page se rechargeait **même si l'enregistrement avait échoué** (l'ordre ancien revenait sans message). |
| Routes d'ordre | Pas de transaction ; liste partielle ou doublons acceptés ; un chapitre déplacé n'était pas renuméroté. |
| Titres | Longueur limitée seulement par le navigateur (`maxlength`), pas par le serveur. |
| HTML | Un formulaire de suppression était imbriqué dans un autre (réglages du quiz) : HTML invalide. |
| Suppressions | `confirm()` natif, sans indiquer ce qui disparaît. |
| Hiérarchie | Pas de numéro, pas de total, pas de repli ; état « vidéo présente » signalé par l'opacité d'une icône seulement. |
| Isolation | Déjà correcte : chaque route vérifie `courses.instructor_id` par jointure (conservée). |

## 2. Ce qui a été fait
- **Renommer** un chapitre sur place (`POST /formateur/sections/:id/renommer`) : Entrée enregistre, Échap annule, titre vide refusé.
- **Monter / descendre** (`…/deplacer`, chapitres et sous-chapitres) : boutons réels (formulaires), donc clavier, lecteur d'écran, tactile, et fonctionnement sans JavaScript. Un sous-chapitre en bout de chapitre passe au chapitre voisin.
- **Changer le chapitre** d'un sous-chapitre depuis son éditeur (liste « Chapitre »).
- **Ordre fiable** : liste exacte exigée pour les chapitres (manquant, en trop, doublon ou étranger = 400, rien ne change) ; sous-chapitres : identifiants de la formation seulement ; écriture en transaction (`BEGIN IMMEDIATE`), positions renumérotées dans le chapitre d'origine et après suppression.
- **Titres** normalisés (espaces, caractères de contrôle) et bornés à 120 caractères côté serveur ; texte HTML toujours échappé à l'affichage.
- **Écran** (`views/instructor/curriculum.ejs`, `public/js/curriculum.js`, `public/css/style.css`) : chapitres repliables (état annoncé `aria-expanded`, mémorisé par formation ; le chapitre du sous-chapitre ouvert reste déplié ; « Tout replier »), numéro, nombre réel de sous-chapitres et durée totale, résumé du programme, icône + texte caché pour « vidéo ajoutée / pas encore de vidéo », badges Quiz et Aperçu, colonne de plan élargie à 400 px dès 1200 px de large, actions sous le titre quand la place manque.
- **Enregistrement** : plus de rechargement ; message « Ordre enregistré » / erreur dans une zone `role="status"` ; **en cas d'échec l'écran revient à l'ordre enregistré** et le dit. Les écritures passent par une file (une requête à la fois, dans l'ordre des gestes) : un ordre ancien ne peut pas écraser un ordre récent.
- **Suppressions** : boîte `<dialog>` native indiquant le nombre exact de sous-chapitres concernés ; Annuler ne supprime rien.
- Glisser-déposer à la souris conservé et amélioré (sans rechargement, défilement automatique aux bords du plan).
- Formulaire imbriqué du quiz corrigé ; styles en ligne du bloc quiz remplacés par des classes.
- Tactile (`pointer: coarse`) : 44 px ; mouvement réduit respecté.

## 3. Tests
`tests/chapitres-refonte.test.js` (30 tests) : structure et accessibilité du HTML, renommage, création, ordre (cas refusés), déplacements, isolation entre formateurs, session absente, Chrome à 320 / 360 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920 px (aucun débordement, titres longs contenus), cibles tactiles, repli mémorisé, renommage au clavier, déplacements au clavier enregistrés en base et après rechargement, échec d'enregistrement simulé, dialogue de suppression, glisser-déposer, mouvement réduit.
Tests existants relancés : `etape1-lecons`, `etape3-plan`, `espace-formateur`, `quiz-tentatives`, `etape0-design`, `navigation-espace` : 111 tests.

## 4. Limites
- Le glisser-déposer à la souris sur un très long programme dépend du défilement du navigateur ; les boutons monter / descendre sont la voie fiable.
- Pas d'état « brouillon » par sous-chapitre (il n'existe pas dans le produit) : non inventé.
- L'écran liste `/formateur/chapitres` (tableau des formations) n'a pas été refondu.
- L'éditeur du contenu d'un sous-chapitre (texte, vidéo, ressources, quiz) n'a pas été reconstruit ; seuls ses points d'intégration ont été améliorés.
- Pas de sauvegarde automatique du contenu d'un sous-chapitre (elle n'existe pas) ; non ajoutée.
- Un seul formateur par formation : pas de modification simultanée à arbitrer.
