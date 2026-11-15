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

## 4. État réel (livré)

### Réutilisé tel quel
Isolation par site (contextes, routes protégées), dossiers logiques et anti-cycle, SHA-256 et groupes de doublons, corbeille et refus de supprimer un fichier utilisé, détection d'usage, file d'envoi (progression, annulation, nouvel essai), sélecteur partagé, permissions `media.*`, audit des actions.

### Nouveau
- **Serveur** (migration 154, additive ; `media/manager.js`, `media/exif.js`, `utils/zipStream.js`) : favoris par personne, tags, collections, préférences par personne et par site, dossiers (couleur, description, favoris, propriétés, chemin), corbeille de dossiers (restaurer avec le contenu, suppression définitive refusée si un fichier est utilisé), vidage et conservation automatique (0 / 7 / 30 / 90 jours, jamais pour un élément utilisé), copie physique, dernière utilisation, stockage (taille logique, octets uniques), doublons (détail avec utilisations, garder un exemplaire), suggestions, recherche étendue (tags, dossier, extension), téléchargement groupé ZIP en flux, vérification des conflits avant envoi, EXIF (position GPS jamais affichée).
- **Interface** (`media-explorer.js`, `media-sections.js`, `media-preview.js`, `media-explorer.css`) : trois zones (barre latérale à groupes et compteurs, repliable en icônes ou masquable ; zone centrale avec fil d'Ariane et commandes ; panneau d'informations redimensionnable), navigation fluide sans rechargement, 5 modes d'affichage (grille, liste, détails, grandes icônes, compact) + taille des miniatures + colonnes + densité mémorisés, sélection (clic, Maj, Cmd), barre d'actions de la sélection, menus contextuels (fichier, dossier, collection, tag, fond), glisser-déposer de fichiers et de dossiers avec indication de destination et interdictions, import depuis le bureau (fichiers et dossiers entiers), fenêtre d'importation (destination, conflits de noms), prévisualisation plein écran (zoom, déplacement, rotation, navigation, vidéo, audio, PDF, EXIF), rubriques Accueil / Doublons / Stockage / Corbeille, clavier (flèches, Espace, Entrée, F2, Suppr, Cmd+A, Cmd+I, Cmd+B), tactile (appui long, tiroir de navigation), mode sombre.
- **Sélecteur des éditeurs** : filtres « récemment ajoutés / utilisés / favoris », dossier, miniatures, enregistrement de l'usage.

### Tests
`tests/mediatheque-gestionnaire.test.js` (17 : droits, isolation entre sites, corbeille, usages, conservation, ZIP, doublons, stockage) et `tests/mediatheque-gestionnaire-navigateur.test.js` (13, vrai Chrome : navigation fluide, préférences, sélection, glisser-déposer natif, menus, favoris, tags, aperçu, recherche, corbeille, import de fichiers et de dossiers, doublons, barre latérale). Les tests existants de la médiathèque (188) passent ; deux attentes d'affichage ont été adaptées (modes d'affichage devenus boutons, première colonne « Nom »).

### Limites réelles (non faites ou partielles)
- **Archives (.zip…)** : le serveur les refuse à l'envoi (sécurité), la rubrique « Archives » n'est donc pas proposée.
- **Dossiers** : pas de « dupliquer » un dossier (copier physiquement des fichiers casserait la déduplication) ; pas de tri personnalisé des dossiers (ordre alphabétique) ; recherche d'un dossier via les suggestions de la recherche.
- **Gros fichiers** : un envoi passe en mémoire (50 Mo pour une vidéo, limites par type) ; pas d'envoi fractionné ni de reprise après coupure (un envoi interrompu n'est jamais enregistré).
- **Performance** : miniatures optimisées à la demande, chargement progressif par pages de 48 et `content-visibility` ; pas de virtualisation complète de la liste (le DOM grandit avec le défilement). Les statistiques de stockage ne mesurent pas le stockage physique du fournisseur ni les versions réduites.
- **Utilisations** : les contenus analysés pour la suppression sont ceux déjà listés à l'écran (cours, produits et formulaires ne le sont pas, et l'écran le dit).
- **Partagés** : « Partagés » n'apparaît que pour l'équipe de l'organisation (vue multisite).

## 5. Lot « barre latérale et apparence » (2026-11-15)

### Audit (constats avant correction)
- Deux boutons de repli coexistaient : l'icône « deux panneaux » à côté du titre (état `hidden` : la barre disparaissait entièrement) et une flèche en bas de la barre (état `rail`). Passer par l'icône du titre masquait la barre sans laisser de zone de réouverture dans la barre elle-même.
- La barre latérale utilisait un fond gris clair ; aucune couleur n'était réglable ; les préférences existantes (par personne et par site, table `mk_media_prefs`) ne contenaient ni thème ni couleurs.
- Le renommage d'un dossier (principal ou sous-dossier) fonctionnait déjà par le menu clic droit de l'arbre et des cartes (route `POST …/dossiers/:id`, `folders.renameFolder`) : un test Chrome le prouve désormais pour un dossier principal et un sous-dossier. Aucun dossier utilisateur n'est verrouillé.

### Corrigé
- **Un seul contrôle** : le bouton de la barre latérale (icône deux panneaux, en haut de la barre) replie en bande d'icônes et déploie. Il reste visible dans les deux états, ne bouge pas hors de l'écran, indique `aria-expanded`, un libellé, un tooltip et se retourne en miroir à l'état replié. Cmd/Ctrl + B fait la même chose.
- **Plus d'état « masqué »** : un ancien réglage `hidden` est converti en `rail` côté serveur (`sanitizePrefs`) et côté navigateur ; aucun état bloqué possible. Test : 8 replis/déploiements d'affilée, largeurs vérifiées, mémorisation après rechargement.
- **Icône du titre** : masquée sur ordinateur (classe `mx-side-mobile`) ; elle ne sert plus que de poignée d'ouverture du tiroir sur téléphone (≤ 900 px). Sur téléphone, le bouton de la barre ferme le tiroir.

### Développé
- **Thème bleu marine** de la barre latérale (variables `--mxs-*`, calées sur la barre principale) : fond, texte, icônes, séparateurs, survol, sélection, compteurs en pastilles, dossiers, étiquettes. Texte clair/sombre choisi automatiquement selon la luminosité du fond choisi.
- **Panneau Apparence** (icône palette, barre d'outils) : thèmes Clair / Sombre / Personnalisé, 12 sélecteurs de couleur libres (fond barre, fond contenu, texte principal, texte secondaire, icônes, séparateurs, sélection, survol, dossiers, accent, bordures, badges), rayon des bordures (0–20 px), espacement (80–140 %), taille des icônes (14–26 px). Aperçu en direct, enregistrement automatique par personne et par site (`mk_media_prefs.data.theme`), « Annuler les changements » (retour à l'état d'ouverture du panneau) et « Réinitialiser ». Le serveur n'accepte que des couleurs `#rrggbb` et borne les nombres.
- **Aucune migration** : les préférences sont un JSON déjà existant ; rien n'est supprimé.

### Tests
`tests/mediatheque-barre-laterale-navigateur.test.js` (9, vrai Chrome) : icône unique, 8 cycles replier/déployer, mémorisation + clavier, conversion de l'ancien état, renommage (dossier principal et sous-dossier), thème par défaut / aperçu / persistance / réinitialisation, valeurs refusées, responsive (820 px et 390 px, tiroir ouvert/fermé 3 fois), aucune erreur de script.

### Reste à faire après ce lot
Voir la section 6.

## 6. Lot 2 « organisation » (2026-11-15)

### Migration 155 (additive, aucun retour destructif nécessaire)
- `mk_media_folders.sort_order` (entier, 0 par défaut = ordre alphabétique d'avant) : ordre manuel entre frères.
- `mk_media_smart` : dossiers intelligents (`kind = 'smart'`, partagés par le site) et recherches enregistrées (`kind = 'search'`, personnelles, `owner_id`). Une vue ne contient aucun fichier : c'est un jeu de critères rejoué à chaque ouverture.
- Retour arrière (hors production, après sauvegarde) : `DROP TABLE mk_media_smart ; ALTER TABLE mk_media_folders DROP COLUMN sort_order`.

### Développé
| Fonction | Où | Règles |
|---|---|---|
| Sections de la barre latérale réordonnables et masquables | préférences `sections {order, hidden}` ; `_side.ejs` (`data-mx-sec`, ordre CSS) ; `media-explorer.js` | glisser-déposer des titres dans la barre OU flèches/cases dans Apparence → Sections ; « Organisation » ne se masque pas (seul accès à la corbeille) ; « Rétablir la disposition » ; enregistré par personne et par site |
| Dossiers intelligents et recherches enregistrées | `manager.listSmart/createSmart/updateSmart/deleteSmart`, routes `/vues` | critères = réglages de l'adresse (q, type, ext, taille, largeur, période, mois, tag, collection, favoris, doublons, volumineux, dossier), jamais du SQL, validés clé par clé ; dossier intelligent : droit `media.write` ; recherche : personnelle ; modifiables (« mettre à jour avec les filtres actuels », renommer) ; supprimer une vue ne touche aucun fichier |
| Ordre manuel des dossiers | `manager.moveFolderOrder`, route `/dossiers/:id/ordre` | monter/descendre entre frères (menu clic droit), renumérotation de la fratrie |
| Copie d'un dossier | `manager.duplicateFolder`, route `/dossiers/:id/copier` | copie réelle des fichiers (nouvelles adresses) et des sous-dossiers, nom « (copie) » unique, limite 300 fichiers, original intact, échecs listés |
| Colonnes réordonnables | préférences `columns` (ordre conservé), variables CSS `--o-*` | s'applique à la vue Liste |
| Historique | `manager.history`, `/historique.json`, rubrique « Historique » (droit `media.write`) | lit le journal d'audit : personne, date, libellé, cible ; filtre par type d'opération ; pagination ; limité au site (site enregistré, sinon site de la ressource) ; **aucune annulation proposée** |
| Alertes de stockage | `manager.get/setStorageAlerts`, `/stockage/alertes`, `mk_settings` (`mediastorage.<site>.warn_mb/crit_mb`) | seuils fixés par la personne (Kolakisa ne connaît pas la capacité de l'hébergement) ; bandeau et pastille dans la barre quand un seuil est dépassé ; sans seuil, aucune alerte |

### Tests
`tests/mediatheque-organisation.test.js` (7, serveur réel : droits, isolation entre sites, validation des critères, copie, ordre, historique, seuils) et `tests/mediatheque-organisation-navigateur.test.js` (8, vrai Chrome : flèches et glisser-déposer des sections, mémorisation, vues enregistrées de bout en bout, ordre et copie des dossiers, colonnes, historique, seuils, mobile, aucune erreur de script).

### Limites réelles
- Le glisser-déposer d'un dossier pour l'ordonner (au lieu du menu) n'est pas fait : le glisser sur un dossier signifie déjà « déplacer dedans ».
- L'ordre des colonnes ne change pas la vue « Détails » (mise en page à deux lignes fixe).
- Les événements d'historique anciens, rattachés à un site seulement par leur ressource, disparaissent de l'historique du site si la ressource a été supprimée définitivement.
- Un dossier intelligent n'affiche pas de compteur (le calcul serait un second moteur de recherche).
- Import avec reprise après coupure et défilement virtualisé : **non faits** (voir section 7).

## 7. Reste à faire
Import fractionné avec reprise après coupure (nouvelle API de sessions d'envoi, fichiers temporaires, nettoyage) ; virtualisation complète de la liste ; manuels fonctionnel et utilisateur dédiés ; glisser-déposer pour ordonner les dossiers ; compteurs sur les dossiers intelligents. Hors de portée d'une page web : accès direct au système de fichiers, glisser vers le bureau, corbeille du système, annulation Cmd+Z à l'échelle du système.
