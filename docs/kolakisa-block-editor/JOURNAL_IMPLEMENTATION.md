# Journal d'implémentation

## 2026-10-27 — Lot P0-1 à P0-4 (fiabilité)

**Base de référence avant modification** : 16 fichiers de tests liés à l'éditeur d'articles → 209 exécutés, 206 réussis, 3 échoués (tests périmés), 0 ignoré.

| Lot | Changement | Fichiers | Preuve |
|---|---|---|---|
| P0-1 | Tests alignés sur la corbeille d'articles (corbeille puis suppression définitive). Aucune assertion affaiblie. | `tests/blog-medias-protection.test.js`, `tests/revisions-articles.test.js` | 18/18 sur ces deux fichiers |
| P0-2 (D2) | Autosave > 2 000 000 caractères refusée (HTTP 413 + message) au lieu d'être tronquée en JSON invalide. L'ancienne sauvegarde reste lisible. | `src/services/blog.js`, `src/routes/blog.js` | test reproduit d'abord l'échec (JSON invalide à 400 000), puis vert |
| P0-3 (D4) | `/api/brouillon` valide le site côté serveur et rattache le brouillon dans la même transaction ; le client ajoute `?site=` à la création d'un nouvel article. Constat plus grave que l'audit : le client n'envoyait le site que pour `/api/…`, donc tout nouvel article créé depuis l'éditeur d'un site tombait dans le site principal. | `src/routes/blog.js`, `src/editor/blog-editor.js`, `public/js/blog-editor.js` | 4 tests serveur ; côté client : test sur la source et le bundle seulement |
| P0-4 (D1) | Un compteur de modifications empêche de déclarer « Enregistré » (et d'effacer la copie locale) quand l'utilisateur a tapé pendant l'envoi ; l'autosave est replanifiée. | `src/editor/blog-editor.js`, `public/js/blog-editor.js` | **test sur la source seulement : comportement non vérifié en navigateur** |

**Après modification** : suite éditeur + nouveau fichier `tests/editeur-blocs-p0-integrite.test.js` → **215 exécutés, 215 réussis, 0 échoué, 0 ignoré** (119 s).

**Non exécuté / à faire** : test navigateur de D1 et du chemin client de D4 ; suite complète du dépôt (473 fichiers) ; `npm ci` + `npm run build:editor` complet (le bundle `blog-editor.js` a été reconstruit seul, voir DT-7) ; audits d'interface du CLAUDE.md (`scripts/audit-interface.js`, `audit-qualite.js`, `audit-editeurs.js`).

**Aucune migration de données** dans ce lot. Aucun push, aucun déploiement.
