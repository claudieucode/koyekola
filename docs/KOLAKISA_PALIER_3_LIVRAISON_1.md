# KOLAKISA — Palier 3 : Livraison 1 (outils d'audit et d'essai) — compte rendu avant autorisation de déploiement

Branche locale `cms-independant`. **Aucune migration, aucun changement de structure, aucune donnée modifiée. Non poussé, non déployé.**

## 1. Ce que contient la livraison
| Élément | Fichier |
|---|---|
| Audit étendu (lecture seule, nombres uniquement) | `src/services/auditSites.js` (`palier3`), `views/gestion/audit-sites.ejs`, `scripts/audit-sites.js` |
| Reconstruction des 4 tables **(non branchée au démarrage)** et comparateur | `src/services/reconstructionTables.js` |
| Cœur de l'essai (processus séparé, copie temporaire) | `src/services/essaiReconstructionCore.js`, `scripts/essai-reconstruction.js` |
| Orchestration (verrou, dossier privé, délai, nettoyage) | `src/services/essaiReconstruction.js` |
| Écran + bouton « Essai de reconstruction » par sauvegarde | `src/routes/gestion.js`, `views/gestion/essai-reconstruction.ejs`, `views/gestion/sauvegardes.ejs` |
| Tests | `tests/essai-reconstruction.test.js` (25), `tests/audit-palier3.test.js` (5) |
Aucun fichier de migration n'est ajouté ni modifié. `reconstructionTables.rebuild` n'est appelé que par le cœur de l'essai (sur une copie) : le démarrage de l'application ne reconstruit rien (vérifié par recherche dans le code et par test : la base en service n'a pas de colonne `site_id` après l'essai).

## 2. Ce que fait l'essai
Sur une sauvegarde **existante** choisie dans la liste : copie cohérente temporaire (`VACUUM INTO`, source ouverte en lecture seule) → relevé initial → reconstruction des 4 tables sur la copie → comparaison exhaustive (lignes, empreinte SHA-256 de chaque table, colonnes, relations, index, déclencheurs, vues, séquences `AUTOINCREMENT`, intégrité, contrôle des relations) → comportement (19 contrôles sur lignes fictives annulées) → retour arrière (2 échecs provoqués + restauration depuis la copie d'avant) → vérification que la sauvegarde d'origine est strictement inchangée → suppression de tout. Chaque différence est **attendue** (documentée) ou **inexpliquée** (bloque).

## 3. Tests réellement exécutés
Exécution ciblée (neuf fichiers : essai, audit palier 3, audit des sites, centre de gestion, sauvegardes, sauvegarde-restauration, isolation des sites, domaines inconnus, gestionnaire de sites) : **118 tests, 118 réussis, 0 échec, 0 annulé, 0 ignoré.**
Dont les 25 de l'essai : interface (essai complet, absence de données personnelles, accès refusé aux visiteurs et élèves, noms piégés → 404, GET sans effet, deux essais simultanés), service (délai dépassé, restes d'un essai interrompu, verrou récent, dossier 0700 + environnement vide, sortie illisible, sauvegarde en lecture seule, faux fichier), comparateur (7 sabotages détectés : ligne supprimée, valeur modifiée, index perdu, déclencheur perdu, séquence réinitialisée, table supplémentaire, identifiant changé ; perte en cascade d'une reconstruction à clés étrangères actives détectée ; échec en cours de route annulé ; définition inattendue refusée avant modification ; ré-exécution sans effet ; comportement).
**Suite complète : NON exécutée sur ce code.** La machine est saturée par d'autres sessions (charge ≈ 115–130 pendant ces essais) : une suite de ~1 h 45 y donnerait des échecs de charge sans valeur. À lancer sur une machine disponible avant toute demande de déploiement. Aucun test « non exécutable » ni ignoré dans les fichiers ci-dessus. Pas d'essai dans un navigateur réel de l'écran (rendu serveur testé en HTTP).

## 4. Preuves que les données de production ne sont pas modifiées
1. L'essai n'ouvre **jamais** la base en service : il ne reçoit qu'un chemin de sauvegarde validé (`backups.pathOf`, nom restreint `[A-Za-z0-9._-]+.db`) et l'ouvre en `readOnly`.
2. Test : empreinte SHA-256, taille, date de la sauvegarde identiques avant/après ; aucun fichier `-wal` / `-shm` créé ; même résultat avec un fichier en lecture seule (`chmod 444`).
3. Test : nombres de lignes de la base en service identiques avant/après et aucune colonne `site_id` ajoutée.
4. Aucune migration ajoutée ; `rebuild` non appelé au démarrage.
5. Les écritures de l'essai se font uniquement dans le dossier temporaire privé (le cœur refuse un dossier non vide ou égal à celui de la sauvegarde).

## 5. Contrôles de sécurité et de nettoyage
- Accès : `requireInstructor` (visiteur et élève refusés, testé) ; nom de sauvegarde validé contre la liste réelle (chemins piégés → 404) ; POST seulement (le GET redirige sans rien faire) ; réponse `no-store`.
- Aucun contenu dans le rapport : uniquement nombres et libellés fixes (testé avec titres, noms, e-mails, noms de catégories et de formulaires semés) ; les messages d'erreur sont nettoyés et tronqués.
- Isolation : dossier `DATA_DIR/essais-temporaires/` en `0700` (hors dossiers publics et hors `uploads`), sous-dossier d'essai `0700`, **processus séparé** (le serveur n'est pas bloqué) avec **environnement vide** (seul `PATH` : aucune clé, aucun mot de passe — testé), délai maximal 180 s puis arrêt forcé, sortie limitée à 400 Ko.
- Concurrence : un seul essai à la fois (verrou atomique) ; le second est renvoyé vers les sauvegardes avec un message ; un verrou plus vieux que le délai + 1 min est tenu pour abandonné.
- Nettoyage : suppression garantie dans un `finally` (succès, erreur, délai) ; restes d'un essai interrompu (arrêt brutal du serveur) supprimés au prochain essai ; compte rendu du nettoyage affiché (dossier supprimé, verrou libéré, restes).
- Espace disque : refus si l'espace libre est inférieur à 4× la taille de la sauvegarde + 8 Mo.

## 6. Limites connues
- Suite complète non rejouée (voir §3). Écran non vu dans un navigateur réel.
- L'essai valide la **procédure** et la **fidélité de la copie** ; il ne remplace pas la décision de migrer. Il ne teste pas le code applicatif de B2–B6 (pas encore écrit).
- Le temps d'essai croît avec la base ; sur une très grosse base (centaines de Mo) le délai de 180 s pourrait être atteint (l'essai s'arrête alors proprement avec « Délai dépassé »).
- L'audit étendu cherche les médias par leur chemin `/uploads/…` dans le texte (même règle que la bibliothèque de médias) : une référence sous une autre forme ne serait pas vue.
- Si la définition réelle d'une des 4 tables en production diffère de celle attendue (unicité introuvable, colonnes différentes), l'essai échoue **avant** toute modification et le dit : c'est le cas d'usage voulu.
- Dépend de la version de Node de l'hébergeur (22) : `VACUUM INTO` en lecture seule, `statfsSync` (si absent, le contrôle d'espace est signalé « non vérifiable »).

## 7. Retour arrière
Livraison purement additive (fichiers et un bouton) : retour arrière par `git revert` du commit de fusion, sans toucher à la base ; les dossiers d'essai éventuels (`DATA_DIR/essais-temporaires`) sont temporaires et supprimables. Aucune donnée n'est à restaurer.

## 8. Procédure après déploiement (si vous l'autorisez)
1. Centre de gestion → Sauvegardes → « Sauvegarder maintenant ».
2. « Audit des sites » sur cette sauvegarde : recopiez-moi le texte (section « Préparation du palier 3 »).
3. « Essai de reconstruction » sur cette même sauvegarde : recopiez-moi le résultat (verdict, tables, différences, retour arrière, nettoyage).
4. Je ne propose les migrations (livraison 2) qu'après examen de ces résultats ; vous décidez séparément.
