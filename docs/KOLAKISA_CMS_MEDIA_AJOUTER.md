# KOLAKISA CMS — Médias → Ajouter un fichier média (palier MEDIA-02)

Branche `media-02-ajouter`, issue de `origin/main` (`8c0182d`). Référence : l'écran WordPress « Téléverser un média ». Ce document décrit l'état **réel**.

## 1. Audit : ce qui existait (réutilisé, rien de parallèle)

- **Service** `src/marketing/media/index.js` : `saveUpload` (signature réelle du fichier, liste blanche, limites par type, nom de stockage fabriqué, dossier du site, fiche `mk_media`), utilisé par TOUS les envois (médiathèque, éditeur de pages, e-mails…).
- **API** `POST /marketing/site-web/mediatheque/televerser` (un fichier par requête, progression par fichier), droits `media.upload`, site vérifié par `routeScopes`.
- **Noyau navigateur** `public/js/kwmedia.js` (envoi XHR avec progression, site envoyé à chaque appel depuis MEDIA-01).
- **Zone d'envoi** de la Médiathèque (`media-library.js`) : file, progression, annulation, nouvel essai — c'était déjà une file d'importation, mais écrite dans la page elle-même.

## 2. Changements de ce palier

| Sujet | Détail |
|---|---|
| Page dédiée | `GET /site-web/mediatheque/ajouter` : « **Téléverser un média** », grande zone en pointillés « Déposez vos fichiers pour les téléverser / ou / Sélectionnez des fichiers », indications (multi-fichiers, formats, limites, médiathèque du site), menu *Médias › Ajouter un fichier média* actif |
| **Une seule file d'importation** | `public/js/media-upload.js` remplace le code d'envoi de `media-library.js` : la Médiathèque et la page d'ajout utilisent le **même** composant (`KWUpload`). Logique pure (testée sous Node) + affichage. Chaque fichier enregistré est annoncé à la Médiathèque (événement `kw-media-saved`), qui l'ajoute à la grille sans doublon |
| États par fichier | En attente · En validation · En cours de transfert (progression) · En cours de traitement (octets partis, **le serveur valide et enregistre encore**) · Réussi · Échec · Annulé. « Réussi » **uniquement** après la réponse d'enregistrement du serveur |
| Validation avant envoi | Extension connue, fichier non vide, taille ≤ limite **du type** — refus immédiat, message clair, les autres fichiers partent. Le serveur revalide tout (contenu réel, taille, droits, site) |
| Limites effectives | `media.effectiveLimit(type)` : plafond du serveur abaissé par *Paramètres → Médias*. **Source unique** : le serveur la fait respecter, la page l'affiche, le navigateur la teste. Plus aucune limite recopiée en dur (la Médiathèque affichait les plafonds sans tenir compte des réglages) |
| Concurrence, doublons | 2 envois simultanés au plus ; le même fichier (nom + taille + date) choisi ou déposé deux fois n'est ajouté qu'une fois, sauf après un échec |
| Glisser-déposer | État « relâchez » avec compteur d'entrées (aucun état bloqué : sortie, dépôt, Échap, fin de glisser), un fichier lâché **hors** de la zone n'ouvre pas le navigateur (message), le reste de la page n'est pas bloqué |
| Quitter la page | Avertissement du navigateur tant qu'un envoi est en attente ou en cours |
| « Méthode du navigateur » | `?methode=navigateur` + `POST /site-web/mediatheque/ajouter` : formulaire classique **sans JavaScript**, plusieurs fichiers (20 au plus) en une requête, **même `saveUpload`**, résumé réel (« n enregistrés, m refusés » avec la raison de chaque refus) |
| Stockage indisponible | Une erreur d'écriture (disque plein, droits…) devient « Le stockage est indisponible : le fichier n'a pas été enregistré » (HTTP 503), **sans fiche ni fichier partiel** ; un nom déjà pris (`EEXIST`) ne supprime jamais le fichier existant |

Aucune migration, aucune table, aucune permission nouvelle.

## 3. Formats et limites effectives (par défaut)

Images JPEG, PNG, GIF, WebP, AVIF (5 Mo) · vidéo MP4, WebM (50 Mo) · audio MP3, WAV, OGG, M4A (25 Mo) · PDF (10 Mo) · Word, Excel, PowerPoint (10 Mo). Les limites par type se **baissent** dans *Paramètres → Médias*, sans dépasser ces plafonds. Plafond d'une requête : **50 Mo** (un fichier plus gros est refusé avant tout enregistrement). SVG, HTML, scripts, exécutables, macros Office (`.docm`…), HEIC/MOV/MKV : refusés d'après le contenu.
La limite de « 3 Go » de la capture WordPress n'existe pas ici et n'est pas affichée.
**Limite non vérifiée** : la passerelle de l'hébergeur (proxy / CDN) peut imposer sa propre taille maximale de requête ; elle n'est pas testable depuis ce dépôt. Les 50 Mo sont le plafond de l'application.

## 4. Fonctionnement de l'importation

- **Multiple** : chaque fichier = une requête, avec sa progression et son résultat ; l'échec de l'un n'arrête pas les autres ; « Réessayer » relance un échec réseau/serveur (un refus de validation se corrige en changeant de fichier).
- **Mémoire** : le serveur lit un fichier en mémoire (multer `memoryStorage`, ≤ 50 Mo) pour en vérifier la signature avant d'écrire ; avec 2 envois simultanés par navigateur, c'est au plus ~100 Mo. Pas de flux ni de transfert segmenté/repris (non pris en charge : un fichier plus lourd est refusé, pas « tenté »).
- **Fichiers temporaires** : aucun — rien n'est écrit avant la validation ; un fichier n'existe sur le disque que s'il a une fiche.
- **Doublons côté serveur** : non dédoublonnés par contenu (deux envois = deux fiches) ; la prévention est dans la file du navigateur.

## 5. Isolation par site (vérifiée)

Le site d'un envoi vient de l'adresse vérifiée côté serveur (accès limité : imposé ; équipe : `?site=` validé), jamais d'un champ du corps (testé : champs `site` / `site_id` ignorés). Un administrateur du site A ne peut ni envoyer vers B (403), ni voir ou modifier le fichier importé par B ; le fichier est rangé dans `…/site-<id>/` ; aucun fichier d'un autre site n'est touché par un envoi ou un échec.

## 6. Tests

- `tests/media-02-ajouter.test.js` (20) : page, limites effectives (dont limite abaissée appliquée et affichée), méthode du navigateur (multiple, échec partiel, aucun fichier, trop de fichiers, droits, site), validation par le contenu (MIME falsifié, extension trompeuse, noms hostiles, 51 Mo), **stockage indisponible** (dossier verrouillé : 503, aucune fiche, aucun orphelin, reprise), isolation, présence dans la Médiathèque / le sélecteur / l'éditeur d'articles.
- `tests/media-02-file-importation.test.js` (12) : la logique du navigateur sous Node avec un transport simulé (validation, états, « réussi » seulement après le serveur, concurrence, échec isolé, doublons, nouvel essai, annulation, retrait, grande sélection) et cohérence de la configuration navigateur / serveur.
- Adaptés : `media-01-mediatheque` (« Ajouter un fichier média » est une page dédiée).

## 7. Limites connues (non faites, pas simulées)

- **Affichage navigateur** (zone, survol, glisser-déposer réel, responsive) : non exécuté ici (les tests navigateur sont ignorés sur cette machine) ; la logique est testée, pas le rendu.
- **Transfert segmenté / reprise**, **traitement asynchrone** (miniatures) et **flux sans passage en mémoire** : non implémentés ; l'état « en cours de traitement » correspond à la validation et à l'enregistrement par le serveur (synchrones).
- **Limite de la passerelle de l'hébergeur** : non vérifiée (voir §3).
- **Lien d'aide / « Aide »** de la capture : pas d'écran d'aide dédié.
