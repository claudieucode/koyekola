# Kolakisa Media Explorer — audit et état (TITAN XXXIII)

Date : 2026-10-28 · base : `main` (clone à jour). Principe : **étendre la médiathèque existante**, pas en créer une seconde.

## 1. Existant réutilisé (vérifié dans le code)
| Élément | Où | Remarque |
|---|---|---|
| Stockage | disque `UPLOADS_DIR/marketing/<org>[/site-<id>][/aaaa/mm]/<nom aléatoire>` ; adresse publique `/uploads/marketing/…` | Un seul fournisseur : disque local (pas de stockage objet ni CDN détecté). |
| Table `mk_media` | migrations 024, 048, 074, 079 | type réel lu dans la signature (`sniff`), dimensions, alt/titre/légende/description, corbeille (`deleted_at`), portée `reach`/`site_id` + déclencheurs d'isolation. |
| Service | `src/marketing/media/index.js` | envoi validé (liste blanche, SVG/HTML/exécutables refusés, limites par type), liste filtrée/paginée, usages, corbeille, suppression définitive refusée si utilisé, partage explicite entre sites. |
| Interface | `views/marketing/media-library.ejs`, `public/js/media-library.js`, `kwmedia.js`, `media-picker.js` | grille/liste, panneau de détails, file d'envoi, sélection groupée ; sélecteur utilisé par le constructeur de pages, le blog, le personnalisateur. |
| Isolation | `media/requestContext.js`, `visibleSql` | le site est revérifié côté serveur ; tests `medias-par-site*`, `media-01`. |
| Tests | 248 tests médias existants | tous verts après ce lot. |

## 2. Lacunes constatées (avant ce lot)
Pas de dossiers ; pas d'empreinte du contenu (donc pas de doublons) ; filtres limités (type, mois, texte) ; usages sans niveau de fiabilité ; pas de vue compacte.

## 3. Livré dans ce lot (migration 112 + code)
- **Dossiers logiques** (`mk_media_folders`, `mk_media.folder_id`) : créer, renommer, déplacer (jamais de cycle, profondeur max 8, nom unique par niveau sans tenir compte de la casse), supprimer (les fichiers **remontent**, aucun fichier supprimé). Déplacer un fichier ne change ni son adresse ni son emplacement disque : aucune page ne casse. Un dossier appartient à la médiathèque d'**un** site ; un fichier n'entre que dans un dossier de sa médiathèque. Pas de dossiers dans la vue d'ensemble (aucun site choisi).
- **Empreinte SHA-256** à chaque envoi + calcul par lots (flux) pour les fichiers existants (`POST …/empreintes`). **Doublons** : signalés à l'envoi (`duplicateOf`), liste `doublons.json`, filtre « Doublons ». Le doublon est **conservé** ; jamais de suppression ni de fusion automatique ; jamais de comparaison entre sites.
- **Filtres avancés** côté serveur : extension, taille min/max, largeur min/max, doublons, volumineux (≥ 5 Mo), dossier.
- **Interface** : arborescence + fil d'Ariane, déplacement par sélection groupée, vue compacte, filtres avancés, panneau de détails (dossier, empreinte, doublons, usages avec fiabilité).
- **Usages** : « confirmé » (relation exacte : image à la une, couverture, partage) ou « probable » (adresse citée dans un contenu). Le panneau liste ce qui est analysé (modèles d'e-mail, pages/tunnels, composants, modèles de page, réglages de site, articles) et **ce qui ne l'est pas** (cours LMS, produits, formulaires, e-mails envoyés) : un fichier « sans référence connue » n'est jamais présenté comme inutilisé.

## 4. Tests
`tests/explorateur-medias.test.js` : 16 tests (serveur réel) — empreintes, doublons conservés et limités au site, dossiers (nom, cycle, déplacement sans changer l'adresse, suppression sans perte), droits (lecteur refusé), isolation inter-sites (dossier, déplacement, `site` falsifié), filtres combinés. + 248 tests médias existants verts.

## 5. Non fait / limites (à traiter dans de prochains lots)
- Pas de glisser-déposer d'un fichier sur un dossier (déplacement par sélection groupée seulement).
- Pas de virtualisation de la grille (pagination serveur 40/page) ; aucune mesure sur de très grosses bibliothèques.
- Pas de colonne « dossier » dans la vue liste ; pas de navigation clavier complète de l'arbre (liens standards seulement).
- Pas d'analyse d'usages asynchrone ni de statut « analyse incomplète » persistant ; cours, produits, formulaires non analysés.
- Pas de stockage objet / URL signées (un seul fournisseur disque ; fichiers publics par conception).
- Pas de prévisualisation DOCX/XLSX/PPTX, pas de HEIC/TIFF/BMP/AVIF en import (non pris en charge aujourd'hui).
- Les écrans n'ont pas été vérifiés visuellement dans un navigateur (rendu serveur testé, CSS non contrôlé à l'écran).
- Intégration aux autres sélecteurs : le sélecteur existant (`media-picker.js`) n'a pas été modifié ; il ne propose pas encore les dossiers.
