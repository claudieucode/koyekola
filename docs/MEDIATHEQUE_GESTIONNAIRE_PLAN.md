# Médiathèque → gestionnaire de fichiers (audit et plan)

Document de travail du chantier « médiathèque = gestionnaire de fichiers professionnel ». Mis à jour au fil des lots ; l'état réel est dans la dernière section.

## 1. Audit de l'existant (les 15 points demandés)

| Sujet | Constat | Fichier |
|---|---|---|
| Architecture | Service unique `src/marketing/media` (table `mk_media`), routes `src/marketing/web/mediaLibrary.js`, vue EJS rendue par le serveur + `public/js/media-library.js` (détails, sélection groupée, dossiers). Une médiathèque PAR SITE (`reach` / `site_id`, contexte `requestContext.js`). | `src/marketing/media/*` |
| Navigation | Arbre de dossiers minimal (liens), fil d'Ariane, filtres par type/date/tri en formulaire GET, 3 vues (grille, liste, compacte). | `views/marketing/media-library.ejs` |
| Importation | File d'attente avec progression par fichier, annulation, nouvel essai, erreurs par fichier, détection de doublons à l'envoi ; un fichier par requête (`/televerser`), limites par type, signature réelle du fichier (jamais le nom). Pas de dossiers entiers, pas de reprise. | `public/js/media-upload.js`, `kwmedia.js` |
| Stockage | Disque (`UPLOADS_DIR`, noms aléatoires), adresse publique permanente ; dossiers LOGIQUES (déplacer ne change jamais l'adresse). | `media/index.js` |
| Dossiers/fichiers | `mk_media_folders` (8 niveaux, anti-cycle, unicité de nom), `mk_media.folder_id`. Créer, renommer, déplacer, supprimer (les fichiers remontent). | `media/folders.js` |
| Métadonnées | nom, titre, légende, description, texte alternatif, dimensions (en-tête), mime, taille, SHA-256. Pas d'EXIF, pas de tags, pas de favoris. | migrations 024, 048, 112 |
| Miniatures | Variantes `sharp` à la demande (`thumbnail` 150 px, `medium`, `large`) mises en cache ; la grille charge pourtant l'original (`<img src=m.path>`). | `media/variants.js` |
| Suppression | Corbeille (suppression douce), restauration, suppression définitive refusée si le fichier est utilisé ; pas de dossier en corbeille, pas de politique de conservation. | `media/index.js` |
| Recherche | `LIKE` sur nom/titre/alt/légende/description ; pas de tags, pas de nom de dossier, pas de suggestions. | `listMedia` |
| Permissions | `media.read/upload/write/delete` vérifiées côté serveur ; accès limité à un site imposé par le serveur (`siteScope`). | `organizations.js` |
| Relations contenu | `mediaUsage` : modèles d'e-mail, pages, composants, modèles de page, réglages de site, articles (confirmé/probable) ; cours, produits, formulaires NON analysés (dit à l'écran). | `media/index.js` |
| Intégration éditeurs | Sélecteur partagé `media-picker.js` (même API) utilisé par les éditeurs ; `forSite` ramène chaque éditeur à la médiathèque de son site. | `public/js/media-picker.js` |
| Performances | Pagination serveur (48/page), index sur (org, dossier, corbeille), `type`, `sha256`. Doublons calculés à la demande par lots de 50. | migrations 048, 079, 112, 115 |

### Existant à réutiliser tel quel
Isolation par site, dossiers logiques et anti-cycle, SHA-256 + groupes de doublons, corbeille et refus de suppression d'un fichier utilisé, détection d'usage, file d'envoi (progression, annulation, nouvel essai), sélecteur partagé, permissions, audit des actions.

### Absent ou incomplet (à construire)
Barre latérale à groupes (récents, favoris, types, doublons, volumineux, corbeille) avec compteurs, repliable/masquable · panneau d'informations redimensionnable · menus contextuels · glisser-déposer de fichiers ET de dossiers avec indication de destination · couleurs/description/favoris de dossier · favoris, tags, collections · modes détails/grandes icônes + densité + taille des miniatures + colonnes · préférences par utilisateur et par site · prévisualisation (zoom, rotation, EXIF, vidéo, audio, PDF) · recherche étendue + suggestions · corbeille de dossiers + politique de conservation · outil de doublons (comparer, garder un exemplaire) · tableau de bord du stockage · téléchargement groupé · miniatures dans la grille · chargement progressif.

## 2. Principes de réalisation
1. Additif : migrations qui ajoutent, jamais de colonne ni de donnée existante modifiée.
2. Une seule médiathèque : l'API existante est étendue, aucun second stockage ni second sélecteur.
3. Isolation par site vérifiée côté serveur à chaque nouvelle route (mêmes contextes que l'existant).
4. Les attributs `data-ml-*` existants sont conservés (tests et sélecteur) ; les nouveaux s'ajoutent.
5. Mouvement : `docs/KOLAKISA_MOTION.md` (120/180/260 ms, jamais de propriété de mise en page animée, mouvement réduit respecté).
6. Aucun bouton sans action : une fonction non terminée n'est pas affichée.

## 3. Lots
1. **Socle serveur** : migration, favoris, tags, collections, préférences, dossiers enrichis, recherche étendue, stockage, doublons (actions), corbeille de dossiers + conservation, téléchargement groupé, miniatures. Tests unitaires.
2. **Interface** : trois zones, barre latérale, modes d'affichage, panneau d'informations, menus contextuels, glisser-déposer, sélection.
3. **Prévisualisation**.
4. **Importation** : destination, conflits de noms, dossiers entiers.
5. **Doublons, stockage, corbeille** (écrans).
6. **Intégration** (sélecteur : récents, favoris) et **tests navigateur, audit visuel, performance**.

## 4. État réel
(Rempli à la livraison de chaque lot.)
