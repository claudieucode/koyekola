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

## 2026-10-27 → 28 — Lots P0-5 à P5 (reste de la mission)

| Lot | Changement | Preuve |
|---|---|---|
| P0-5 (D5) | Une seule création d'article à la fois : brouillon automatique, aperçu, corbeille de blocs et « Enregistrer » partagent une promesse ; le site accompagne aussi le brouillon automatique | `editeur-blocs-navigateur` : **échoue sur l'ancien bundle, réussit sur le nouveau** |
| P0-6 (D3) | Conflit par empreinte (`base_rev`) pour l'enregistrement, l'autosave et la restauration | P0 (3 tests) |
| P0-7 (D10) | HTML d'une ancienne version re-assaini à la restauration | P0 : échoue si on retire le correctif |
| P0-8 (D6/D7) | `site_id` des blocs réutilisables, historique restaurable, suppression avec révision et empreintes exactes | RS (12 tests) |
| P0-9 (D8/D9) | Réévalués : accès du seul compte créateur (DT-15) ; aucune modification de code | — |
| P0-10 (D11) | Les éléments retirés à l'enregistrement sont signalés dans l'éditeur | P0 |
| P0-11 (D12) | Promotion des articles programmés : une seule fois, avec révision « Publication » | P0 (3 requêtes simultanées) |
| D13 | Limite de débit des brouillons, dimensions d'image lues dans le fichier, sitemap sans article supprimé, CRLF normalisés | LIM, NB |
| P1 | Grouper/dégrouper, transformer, copier/coller les styles, ancre et classes, 6 nouveaux blocs, sélection multiple, raccourcis, palette, sans distraction, plein écran, renommer | P1 (Chrome) |
| P2 | 13 modèles, glisser depuis l'outil d'insertion et dans la vue en liste, variantes de style, visibilité par appareil, verrou à tous les niveaux | P1, NB |
| P3 | Aperçu par appareil sur la zone d'écriture, notes de travail par article | P1, NOTES |
| P4 | Registre central, diagnostic des blocs | REG |
| P5 | Audit d'accessibilité automatisé (19 écrans, 0 défaut), clavier, performance (800 blocs : ouverture ≈ 0,2 s, frappe médiane ≈ 11 ms) | A11Y |
| Hors plan | Lecteurs Spotify/SoundCloud/Dailymotion/Loom/TED, sous-titres vidéo, lettrine, teinte, liste décroissante, « détails » ouvert, lien par image de galerie ; nettoyage du code mort | NB, P1 |

### Défauts de mon propre travail trouvés par la suite complète
- `post_notes.parent_id` sans index : l'audit de base `tests/audit-corrections.test.js` (D3) l'a détecté ; index ajouté, test vert.
- Les tests « navigateur » des autres modules (CMS, menus, e-mail, analytics…) échouent **à l'identique sur `origin/main`** (vérifié sur un worktree propre pour `cms-outils`, `cms-taxonomy`, `cms-contacts`, `cms-comments`, `apparence-styles`) : échecs préexistants de cette machine, sans lien avec l'éditeur.

### Résultats
- Fichiers `tests/editeur-blocs-*` : **86/86**.
- Suite « éditeur » élargie (blog, articles, révisions, réutilisables, blocs) : **443/443** avant les derniers ajouts, puis les fichiers modifiés rejoués : verts.
- La suite complète d'un seul tenant n'a pas pu aller au bout ici (plusieurs heures à cause des tests Chrome d'autres modules qui expirent) : voir le détail dans le rapport final.
