# KOLAKISA — Palier 18 : corrections réalisées

Chaque correction : défaut reproduit → cause → correction minimale → test. Aucune refonte, aucune fonctionnalité supprimée, aucune migration existante modifiée.

## Corrections de code et de données
| # | Prio | Défaut reproduit | Cause racine | Correction | Fichier(s) | Test |
|---|---|---|---|---|---|---|
| 1 | P2 | 2 vulnérabilités hautes (`body-parser`, `multer`) + 4 modérées/basses | Versions installées dans la plage vulnérable | `npm audit fix` : versions correctives dans les plages existantes (body-parser 1.20.9, multer 2.5.0, nodemailer 10.3.1, qs 6.16.2, sanitize-html 2.18.1, launder 1.7.2 ; `deepmerge` retiré) | `package-lock.json` (`package.json` inchangé) | `npm audit --omit=dev` = 0 ; 143 tests (e-mails, formulaires, sauvegarde, médias) puis 2 207 tests (157 fichiers) |
| 2 | P2 | Migration R9 « site maître » : `comptes de lignes inattendus : …seo_404 0→1` → application annulée à tort | Les comptes de lignes « avant » étaient pris avant le verrou `BEGIN IMMEDIATE` ; une écriture de l'application (journal 404) s'intercalait | Comptage fait **sous le verrou**, à l'application et au retour arrière | `scripts/r9/site-maitre.js` | `r9-site-maitre-effets-application.test.js` (échouait, passe) ; famille `r9-*` : 37/41, les 4 restants sont les tests SSH préexistants |
| 3 | P2 | Clés étrangères `mk_media.folder_id` et `mk_media_folders.site_id` sans index | Migration 112 (explorateur de médias) | **Nouvelle migration 115**, additive et idempotente (`CREATE INDEX IF NOT EXISTS`) | `src/marketing/migrations/115_index_cles_etrangeres_medias.sql` | `audit-corrections.test.js` (D3) ; mise à niveau depuis 113 : `palier12-migration-composants-revision.test.js` |
| 4 | P3 | Écran « Informations » : « Site (identifiant N) » au lieu du nom pour un site tout juste créé ; test instable | Le nom était lu dans le cache des adresses (durée de vie) | Nom lu dans `mk_sites` (source de vérité) | `src/services/tools/siteInfo.js` | `sante-du-site.test.js` : 3 passages sur 3 (échouait de façon intermittente) |
| 5 | P3 | `<select>` du tableau de bord sans flèche | `background:` (raccourci) effaçait l'image de la flèche | `background-color:` | `public/css/dashboard.css` (`.bl-tools select`) | `listes-deroulantes.test.js` |
| 6 | P3 | `z-index: 10000` hors de l'échelle de superposition | Visionneuse d'images | `var(--z-modal)` | `public/css/style.css` (`.kb-lightbox`) | `menus-flottants.test.js` |
| 7 | P3 | 4 écrans SEO du lot 2 sans infobulle | Textes d'aide non ajoutés | 4 infobulles | `public/js/kola-tips-data.js` | `infobulles.test.js` |
| 8 | P3 | 8 écrans de menu absents du registre de suivi | Écrans ajoutés sans ligne au registre | 8 lignes « À auditer » (honnêtes : non audités) | `docs/KOLAKISA_REFONTE_CONTENU.md` | `registre-pages.test.js` |

## Tests mis à jour (justifiés, comportement attendu vérifié ailleurs)
| Test | Raison |
|---|---|
| `cms-urls.test.js` « refus … type inconnu » | 307 est un type valide depuis le SEO lot 2 (`src/seo/redirects.js` : 301, 302, 307, 308, 410) ; le test utilise désormais 999 |
| `portee-des-routes.test.js` | L'oracle historique ne connaît pas 16 règles ajoutées depuis (liste des pages, modèles de pages, corbeille, équipe, thèmes, polices, barre, personnaliser, widgets, styles, éditeur, templates, patterns). Elles sont exclues de la comparaison **et** testées explicitement (existence + résolution de `?site=`) |
| `site-menu-c1-unitaire`, `site-menu-c1`, `site-menu-p1a-unitaire`, `entrees-fermees-preuves` | Comptes figés (+4 écrans SEO ouverts : 75→79, 80→84, 79→83 entrées, etc.) |
| `site-espace.test.js`, `palier12-migration-composants-revision.test.js` | Le dossier s'arrête à 115 ; le test de mise à niveau simule « migré jusqu'à 113 » et attend `["114","115"]` (le lanceur refuse à raison d'appliquer 114 après 115) |
| `tests/fixtures/inventaire-tables-sites.json` | 3 tables classées « isolée » (`mk_media_folders`, `mk_site_domains`, `seo_rank_entries`, toutes avec `site_id`) |

## Tests ajoutés
- `tests/palier18-isolation.test.js` — 7 cas d'isolation par accès direct (voir audit §5).
- (Livrés juste avant, même charnière) `tests/form-public-centre.test.js` — formulaire public centré, consentement jamais pré-coché, interrupteur sans style de case.

## Migrations
- `115_index_cles_etrangeres_medias.sql` : 2 index. Aucune donnée lue ni modifiée. Retour arrière : `DROP INDEX idx_mk_media_folder_id; DROP INDEX idx_mk_media_folders_site;` (sans effet sur les données).

## Commandes
```
node --check <789 fichiers>
npm audit --omit=dev            # avant : 6 ; après : 0
node --test --test-concurrency=1 <4 tranches de 163 fichiers>   # 6 660 tests avant corrections
node --test <fichiers touchés>                                  # voir matrice
NODE_PATH=…/playwright-core node scripts/audit-widgets.js
NODE_PATH=…/playwright-core node scripts/audit-responsive.js --widths 390,768,1280
```
