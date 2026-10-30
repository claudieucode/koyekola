# KOLAKISA — Sauvegarde et restauration

*Date : 2026-10-29. Distingue ce qui est **opérationnel et vérifié** de ce qui n'est que **recommandé**. Une sauvegarde n'est considérée fiable que si sa restauration a été vérifiée (§5).*

## 1. Périmètre : ce qui est sauvegardé, et ce qui ne l'est pas

| Donnée critique | Sauvegardée ? | Par quel mécanisme | Limite |
|---|---|---|---|
| Base SQLite (contenus, comptes, commandes, marketing, sessions, 188 tables) | **Oui** | `VACUUM INTO` (copie cohérente même pendant l'écriture) | Sur le **même disque** que le site pour les copies automatiques |
| Fichiers envoyés (`UPLOADS_DIR` : `thumbnails`, `videos`, `resources`, `blog`, `marketing`) | **Seulement sur demande** | `npm run sauvegarde` ou `fichiers.tar` (page Sauvegardes) | **La sauvegarde automatique quotidienne ne contient que la base** |
| `ENCRYPTION_KEY`, `SESSION_SECRET`, clés Stripe/SMTP/IA (environnement de l'hébergeur) | **Non** | — | **Perdre `ENCRYPTION_KEY` rend illisibles les secrets chiffrés en base** (fournisseurs, Google). À conserver **ailleurs**, dans un coffre de mots de passe |
| Code et `node_modules` | Non | Git | Le code vit sur GitHub |
| Vidéos hébergées chez des tiers (Bunny, YouTube, Vimeo) | Non | — | À sauvegarder chez le tiers |
| Configuration de l'hébergeur (variables, domaines, DNS) | Non | — | À consigner par le propriétaire |

## 2. Mécanismes existants

### 2.1 Sauvegarde automatique quotidienne (`src/services/backups.js`) — **opérationnelle**

- Démarre 60 s après le lancement (`SAUVEGARDE_DELAI_MS` en test), puis **vérifie toutes les heures** ; crée une copie s'il n'y en a pas depuis plus de ~23 h.
- Fichier : `<DATA_DIR>/backups/KOLAKISA-auto-<horodatage>.db`. **Rétention : 14 copies automatiques.**
- Désactivable par `SAUVEGARDE_AUTO=0` : **ne pas le définir en production**.
- **Limites** : base seule (jamais les fichiers) ; **même disque** que le site ; **aucun contrôle d'intégrité** de la copie (`integrity_check` n'est exécuté que par `npm run sauvegarde`) ; aucun envoi hors site.

### 2.2 Sauvegarde manuelle depuis l'interface

Mon espace → Centre de gestion → Sauvegardes (`/formateur/gestion/sauvegardes`) : *Sauvegarder maintenant* (`KOLAKISA-<horodatage>.db`, **jamais purgée automatiquement**), téléchargement de la base, `fichiers.tar` (archive de tous les uploads, en flux ; **non relue ni vérifiée**), *Audit des sites* (lecture seule, nombres uniquement), *Essai de reconstruction* (sur copie temporaire, jamais sur la base en service). **Il n'existe aucune restauration dans l'interface.**

### 2.3 Sauvegarde complète en ligne de commande — `npm run sauvegarde`

Crée dans `<DATA_DIR>/backups/` : `KOLAKISA-<AAAA-MM-JJ-HH-MM>.db` (**relue et vérifiée par `PRAGMA integrity_check`** ; supprimée si corrompue) et `KOLAKISA-uploads-<date>.tar.gz` (**relue par `tar -tzf`**). 14 conservées de chaque sorte. Option `--sans-fichiers`. **VÉRIFIÉ** (§5).

### 2.4 Copie automatique avant migration

Avant toute migration marketing en attente (si la base contient des utilisateurs) : `AVANT-MIGRATION-<horodatage>-v<n>.db`, 10 conservées ; si la copie échoue, la migration n'est pas appliquée. **VÉRIFIÉ** (§5). Elle n'est jamais purgée par `npm run sauvegarde`.

### 2.5 Copie de contrôle — `scripts/copie-base-audit.js <source.db> <copie.db>`

Ouvre la source en **lecture seule**, copie par `VACUUM INTO`, **refuse d'écraser** un fichier existant, vérifie `integrity_check` et compare le nombre de lignes de chaque table. Ne copie pas les uploads. Mode d'emploi pas à pas : `docs/KOLAKISA_AUDIT_PRODUCTION.md`.

### 2.6 Outils de recette sur la production (SSH)

`scripts/r9/lancer-recette-prod.sh` (mode `sauvegarde`) : copie de la base et archive des uploads avec empreintes ; `scripts/r9/essai-restauration.js` : restaure une sauvegarde dans un **dossier neuf**, démarre l'application sans SMTP, worker ni tâches SEO, contrôle `/sante` — « machine de recette, **jamais** la production ». **NON TESTÉS** pendant ce palier (nécessitent l'accès SSH de production).

## 3. Fréquence, rétention, protection (recommandations)

| Sujet | Réalité aujourd'hui | Recommandation |
|---|---|---|
| Fréquence | Base : quotidienne, automatique. Fichiers : jamais automatique | Archive des fichiers **au moins hebdomadaire**, et avant chaque livraison touchant aux médias |
| Rétention | 14 jours (auto), 14 (CLI), 10 (avant migration) | Garder en plus **une copie mensuelle** hors site |
| Hors site | **Aucune** : seul le téléchargement manuel sort du disque (`DEPLOIEMENT-HOSTINGER.md`) | **Télécharger régulièrement** base + `fichiers.tar` vers un stockage séparé. Une copie sur le même disque ne protège pas d'une panne du disque |
| Protection | `data/backups/` est dans `.gitignore` ; fichiers `.db` = comptes, e-mails, hachages | **Ne jamais** partager un `.db`, ni le mettre dans un service en ligne ; chiffrer les copies hors site |
| Clés | Non sauvegardées | Conserver `ENCRYPTION_KEY` et la liste des variables dans un coffre séparé |

*Une sauvegarde externe planifiée n'existe pas (G-09 du palier 24) : elle exige un stockage externe et des identifiants que seul le propriétaire peut fournir.*

## 4. Restauration — `npm run restaurer`

```
npm run restaurer                                   # liste les sauvegardes (bases, archives, copies AVANT-*)
npm run restaurer -- <base.db> [--fichiers <archive.tar.gz>]              # à blanc : vérifie, ne modifie rien
npm run restaurer -- <base.db> [--fichiers <archive.tar.gz>] --confirmer  # restaure
```

**Garde-fous (lus dans `scripts/restaurer.js`)** : sans `--confirmer`, aucune modification ; la base source est ouverte en lecture seule, vérifiée par `integrity_check`, et doit contenir `users`, `courses`, `orders` ; l'archive est listée et **refusée si elle contient des chemins absolus ou `..`** ; l'état courant est copié dans `backups/AVANT-RESTAURATION-<date>.db` avant d'écraser ; les fichiers `-wal`/`-shm` sont supprimés.

**Avertissements** :
1. **Le serveur doit être arrêté** ; le script ne le vérifie pas.
2. La restauration des fichiers **n'efface rien** : les fichiers plus récents absents de l'archive sont conservés (donc pas de retour à l'identique des médias).
3. Si `tar` échoue **après** la base, la base est déjà remplacée.
4. Au démarrage suivant, la base restaurée est **migrée** : les migrations marketing manquantes s'appliquent (avec une copie `AVANT-MIGRATION-*`).
5. **Ne jamais restaurer sur la production sans autorisation explicite** et sans sauvegarde du dernier état.

## 5. Preuve : restauration testée sur données jetables (2026-10-29)

Environnement : dossiers temporaires isolés (aucune donnée réelle, aucune production). Base `A` : schéma du LMS + 1 utilisateur, 1 formation, 1 fichier d'upload.

| Étape | Résultat |
|---|---|
| `npm run sauvegarde` sur `A` | Base sauvegardée **et vérifiée** ; archive des fichiers **vérifiée** |
| `restaurer` **sans** `--confirmer` vers un dossier neuf `B` | Base et archive « vérifiée(s) » ; **« AUCUNE MODIFICATION FAITE »** ; `B` inchangé |
| `restaurer … --confirmer` vers `B` | « Base restaurée », « Fichiers restaurés » |
| Relecture de `B` | `integrity_check` = **ok** ; 1 utilisateur ; formation « Formation d'essai » retrouvée ; le fichier d'upload retrouvé avec son contenu |
| Restauration d'une sauvegarde **inexistante** | « ÉCHEC : sauvegarde introuvable », aucune modification |
| **Démarrage d'un vrai serveur sur la base restaurée** | Copie `AVANT-MIGRATION-*.db` créée automatiquement ; **99 migrations marketing appliquées**, dernière version 114 ; **188 tables** ; `/sante` → `{"statut":"ok","formations":1,"versions_images":"ok"}` ; **démarrage : 192 s** |

**Ce que ce test ne prouve PAS** (statut **NOT_TESTED**) :
- une restauration d'une **base de production réelle** (volume, contenus, plusieurs sites) ;
- la **cohérence entre la base et les médias** d'une vraie production (références de médias sans fichier) — l'outil `npm run audit:medias` existe mais n'a pas été exécuté ici ;
- la **séparation des sites** après restauration (une seule organisation dans la base de test) — voir `docs/KOLAKISA_AUDIT_PRODUCTION.md` (`audit-sites.js`) pour la procédure ;
- les `AVANT-RESTAURATION-*` (aucune base préexistante dans `B`) ;
- le contenu des **sessions** restaurées ;
- les procédures SSH de `scripts/r9/` ;
- la restauration par l'interface (**elle n'existe pas**).

## 6. Procédure de restauration à blanc recommandée (avant toute décision)

1. Télécharger la dernière base et `fichiers.tar` (Sauvegardes).
2. Sur un poste de recette, dans un dossier neuf : `DATA_DIR=<dossier> UPLOADS_DIR=<dossier>/uploads npm run restaurer -- <base.db> --fichiers <archive> ` (à blanc), puis `--confirmer`.
3. `node scripts/audit-sites.js <copie.db>` (lecture seule) : aucune association entre sites différents.
4. Démarrer l'application avec `SMTP_HOST`, `MARKETING_WORKER` et `STRIPE_*` **absents**, `SEO_JOBS=off`, `ALLOW_INDEXING=0` ; contrôler `/sante`, ouvrir quelques pages et médias.
5. Consigner la date, la taille, la durée et les écarts. **C'est cette trace qui rend une sauvegarde « fiable ».**
