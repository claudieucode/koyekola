# Palier 13 — Outils : import, export, santé du site, maintenance

CMS → Outils regroupe les outils techniques. **Aucun système parallèle** : chaque outil appelle les services déjà construits (pages, articles, taxonomies,
navigation, redirections, médias, SEO, URLs, révisions, permissions) et la file de travaux existante.

## Cartographie de l'existant (audit initial)

| Besoin | Avant le palier | Décision |
|---|---|---|
| Sauvegardes | `services/backups.js` : copie quotidienne de la base + téléchargement | **Conservé** (écran Sauvegardes) |
| Journal | `audit_log` + écran « Logs » (lecture seule) | **Conservé** et utilisé pour tracer chaque opération des outils |
| File de travaux | `mk_jobs` + `queue/worker.js` (worker actif seulement si `MARKETING_WORKER=on`) | **Réutilisée** : un travail `tools.run` ; un exécuteur local du même code est lancé à la demande si le worker est inactif |
| Import / export de page | `pages.exportPage / importPage` (une page, format `kolakisa-page@1`) | Conservé ; le nouvel export couvre le site |
| Import de contacts | assistant CSV du marketing (hors périmètre CMS) | Conservé, non touché |
| Redirections CSV | `seo/redirects.js` (import / export CSV) | Conservé |
| Audit des médias | `config/mediaAudit.js` (lecture seule) | **Réutilisé** par la santé et le diagnostic |
| Audit SEO, tâches SEO | `seo/audit.js`, `seo/tasks.js` | **Réutilisés** (dernier audit, titres / descriptions) |
| Liens cassés | `services/brokenLinks.js` (palier 12) | **Réutilisé** par la santé |
| Caches | 7 caches en mémoire (réglages SEO, redirections, domaines, rôles, commentaires, images, assets) | Inspectables et invalidables |
| Santé, diagnostic, cache, recherche / remplacement, maintenance | écrans « Bientôt » sans backend | **Remplacés** par de vrais outils |
| Maintenance | formulaire désactivé dans Paramètres | **Remplacée** par le mode maintenance par site |

## Architecture (`src/services/tools/`)

* `runs.js` — table `cms_tool_runs` : une opération (import, export, santé, intégrité, contenu), son état, sa progression réelle, son rapport.
* `runner.js` — exécute une opération par petits lots au-dessus de `mk_jobs` ; progression écrite à chaque lot ; annulation entre deux lots ;
  opérations interrompues (redémarrage) détectées et marquées « interrompue » avec leur rapport partiel.
* `exporter.js` / `importer.js` / `exchange.js` — format `kolakisa-site@1`, analyse, application, annulation.
* `health.js` — 32 contrôles réels ; `integrity.js` — références brisées et orphelins ; `system.js` — informations système ;
  `content.js` — rechercher / remplacer, régénérations, nettoyages ; `caches.js` ; `maintenance.js` ; `audit.js`.
* Routes : `marketing/web/tools.js` ; écrans `views/marketing/tools-*.ejs` ; suivi de progression `public/js/cms-tools.js`.

## Export

Format JSON structuré, réimportable : réglages du site, pages, menus, redirections, catégories / étiquettes, articles, métadonnées de médias, SEO,
commentaires (texte et nom d'affichage seulement). Les relations sont des **références** (`p12`, `a5`, `t3`) que l'import remappe sur de nouveaux identifiants.
Somme de contrôle (SHA-256) du contenu. **Les fichiers médias ne sont pas exportés** (chemins et métadonnées seulement — c'est écrit dans le fichier).
Jamais de mot de passe, d'e-mail de compte, de jeton ni de clé : aucun type « utilisateurs », et une analyse de motifs secrets bloque l'export si une valeur suspecte apparaissait.
Périmètre : le site choisi ; le contenu de l'organisation (articles, taxonomies, médias, SEO, commentaires) n'est exportable que par l'équipe de l'organisation,
jamais par un accès limité à un site. Fichier conservé 24 h.

## Import

`fichier → ANALYSE (aucune écriture) → rapport (créés, conflits, ignorés, erreurs, avertissements) → confirmation → import par lots → rapport → annulation possible`.

* Chaque ressource est créée par le service de son domaine (`pages.createPage / saveDraft`, `articles.createDraft / applyImported`, `taxonomy.create`, `navigation.create / add`,
  `redirects.create`, `media.updateMedia`, `seo meta.save`) : validations, révisions et historiques habituels.
* **Pages et articles toujours en brouillon.** Contenu d'article assaini (scripts, cadres, événements, `javascript:` retirés) ; droits des widgets (HTML…) vérifiés comme dans l'éditeur ;
  adresses de redirection validées (pas de `//autre-site`, pas d'espace technique, destination extérieure réservée aux administrateurs).
* **Conflits** (même adresse / nom / source) : `ignorer` (défaut), `mettre à jour` (permission `tools.overwrite`), `créer des copies`, `tout arrêter`.
  « Mettre à jour » ne touche jamais un article en ligne ni un menu ; une page n'est mise à jour que dans son **brouillon** ; l'ancien état reste dans l'Historique.
  Rien n'est supprimé par un import.
* **Aucun compte, rôle ni droit** n'est importé. Le site de destination est celui choisi à l'écran, jamais celui du fichier ; l'adresse publique (domaine) n'est jamais importée.
* **Lots** de 20, progression = compteurs réels écrits à chaque lot. **Annulation** entre deux lots : ce qui est fait reste, le rapport est exact.
  **Annuler un import** : met à la corbeille les pages et articles créés, supprime les menus, redirections et termes créés (les éléments préexistants ne sont jamais touchés).
* Interruption (arrêt du serveur) : l'opération passe en « interrompue », son rapport partiel est conservé et l'import reste annulable. Pas de reprise automatique :
  relancer repart d'une analyse fraîche (les éléments déjà créés apparaissent comme conflits : rien n'est dupliqué avec « ignorer »).

## Santé du site

Contrôles réels, chacun avec statut (Bon / À surveiller / Critique / Information), constat, impact, recommandation et action : configuration (SITE_URL, HTTPS, secrets, stockage),
sécurité (administration protégée, fichiers sensibles non exposés, en-têtes), base (contrôle interne, clés étrangères, sauvegardes), adresses (accueil, 404, sitemap, robots.txt,
redirections et leurs destinations, pages et articles publiés accessibles, canonical, liens cassés), SEO (dernier audit, titres / descriptions, accueil indexable), contenu,
médias (fichiers manquants, poids, textes alternatifs), performance (temps de réponse mesuré **depuis le serveur lui-même**, poids des fichiers), intégrations (file de travaux, e-mail).
Ce qui n'est pas mesurable est dit « Non mesuré ». Chaque analyse est une nouvelle opération (job) avec progression réelle ; aucune correction automatique.

## Diagnostic et orphelins

Lecture seule : menus vers des ressources supprimées, relations vers des articles supprimés, révisions et historiques d'adresses orphelins, commentaires orphelins, SEO d'un contenu supprimé,
doublons d'adresses, termes inutilisés, menus sans emplacement, médias potentiellement inutilisés, fichiers sans fiche. Seules **trois corrections ciblées** existent
(relations, révisions, historiques d'adresses morts), avec simulation, confirmation, permission `tools.content` et journal.

## Outils de contenu, régénérations, nettoyages

Rechercher / remplacer (textes seulement ; brouillon des pages ; articles hors ligne par défaut ; simulation → confirmation ; historique conservé), actualisation du plan du site,
rattachement des articles aux catégories, nettoyage du journal 404 (> 90 jours), des anciennes opérations d'outils, des travaux terminés. Chaque action annonce son effet ; simulation par défaut.

## Caches et maintenance

Sept caches réels, inspectables et invalidables un par un (« tout invalider » demande confirmation) ; aucune donnée n'est supprimée.
Maintenance **par site** (`cms_maintenance`, scope `main` ou `site:<id>`) : page publique HTTP 503 (`Retry-After`, `noindex`), message échappé ; **l'équipe connectée n'est jamais bloquée**
(ni la connexion, l'administration, les webhooks, les fichiers). Le site principal et chaque site sont indépendants.

## Permissions (palier 9)

`tools.view`, `tools.health` (éditeur) ; `tools.export`, `tools.import`, `tools.overwrite`, `tools.content`, `tools.cache`, `tools.maintenance` (administrateur).
Vérifiées à chaque route **et** à chaque opération, dans le contexte du site choisi (`?site=`) ; une opération n'est lisible que dans le périmètre de son site (anti-IDOR).

## Volontairement non fait

* Import / export d'utilisateurs, de rôles et de droits (sécurité) ; import de commentaires (confidentialité) ; export / import des fichiers médias eux-mêmes ; CSV de contenu (le JSON suffit).
* Reprise automatique d'un import interrompu ; export planifié ; plateforme de journalisation centralisée (requêtes lentes et erreurs serveur : « non mesuré »).
* Mode maintenance planifié dans le temps ; « vider tout » sans confirmation.
