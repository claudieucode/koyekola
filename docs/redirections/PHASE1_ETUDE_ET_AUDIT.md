# Redirections KOLAKISA — Phase 1 : étude, audit et plan

Statut : **rapport seul, aucun code modifié.** Les phases 2 à 8 attendent la validation de l'utilisateur.
Sources : documentations publiques de Redirection, Yoast SEO Premium, Rank Math, AIOSEO, SEOPress, 404 Solution (pages wordpress.org et sites des éditeurs) + audit du dépôt. Les points marqués *(à confirmer)* n'ont pas pu être vérifiés dans une documentation officielle.

---

## 1. Constat principal sur Kolakisa

**Il existe déjà un seul moteur de redirections** (`src/seo/redirects.js`, table `seo_redirects`), et non deux. Ce qu'on appelait « deux modules » sont **trois interfaces** qui l'utilisent :

| Interface | Adresse | Particularités |
|---|---|---|
| A. CMS (palier 12) | `/marketing/site-web/redirections` | liste paginée, filtres, tri, test réel, permissions fines ; **pas d'import/export**, le choix « correspondance » n'est pas transmis à la création |
| B. Suite SEO historique | `/formateur/seo/redirections` | import/export CSV, chaînes ; non paginée, pas de filtre par site, pas de permissions fines |
| C. Espace d'un site | `/marketing/site-web/sites/:id/redirections` | paginée, import/export CSV, permissions fines, création depuis une 404 |

Donc la refonte consiste à **unifier et compléter**, pas à repartir de zéro. Le moteur gère déjà : 301/302/307/308/410, correspondance exacte/préfixe/regex (regex ancrées et filtrées), boucles et chaînes, compteur de visites, historique des changements (`seo_changes`), isolation par site, cache mémoire (recherche exacte en O(1)), garde-fous sur les adresses protégées.

### Pourquoi des entrées affichent « Bientôt »
Dans le menu du site principal les trois entrées (Redirections, Liens cassés, Permaliens et adresses) sont actives. Dans l'**espace d'un site secondaire**, le menu est calculé depuis `src/marketing/web/cmsNav.js` : seule `redirections` figure dans `ABILITY`. `redirections/liens-casses` et `redirections/permaliens` n'y sont pas déclarées, donc la règle « entrée non listée = jamais ouverte » les marque `disabled` + « Bientôt » (phase « C4 »). **Ce n'est pas un état stocké : c'est un oubli de déclaration**, corrigeable en phase 2.
Les autres entrées proposées (Tableau de bord, Groupes, Journaux, Importer/Exporter, Outils, Paramètres) n'existent pas encore.

---

## 2. Étude des solutions WordPress

### 2.1 Redirection (John Godley)
- **Fonctions** : 301/302/303/307/308, 404 par code configurable (dont 410, 451) ; correspondance URL seule, URL + paramètres, regex ; **groupes** (modules WordPress / Apache / Nginx) ; conditions (connecté, rôle, référent, agent, cookie, en-tête, langue, serveur, IP, page existante) ; journal des redirections et des 404 (IP, agent, référent) avec rétention réglable ; import/export CSV, JSON, Apache, Nginx ; import depuis Simple 301, SEO Redirection, Safe Redirect Manager, Rank Math ; redirection automatique à la modification d'un slug (option) ; API REST ; WP-CLI ; surveillance des permaliens.
- **Interface** : ancienne mais très complète (onglets Redirections / Groupes / Journaux / 404 / Outils / Options / Support).
- **Limites** : journal volumineux, pas de tableau de bord graphique, regex sans garde-fou de coût, pas d'aide à choisir une destination.
- **À reprendre** : groupes, conditions, rétention du journal, export Apache/Nginx.

### 2.2 Rank Math SEO
- **Fonctions** : 301, 302, 307, 410, 451 ; correspondance exacte, contient, commence/finit par, regex ; **moniteur 404** (optionnel) avec « 1-clic → redirection » ; redirection automatique à la suppression/déplacement (« redirection vers la page parente ») ; import/export CSV ; import depuis Redirection ; état actif/inactif ; dates d'expiration *(à confirmer)* ; filtres et actions groupées ; intégration à l'analyse SEO du contenu.
- **Interface** : moderne, rapide, mais regroupée dans un seul grand écran.
- **Limites** : peu de statistiques, pas de groupes *(à confirmer)*.
- **À reprendre** : 410/451, « contient/commence/finit par », actions groupées, création depuis la 404.

### 2.3 Yoast SEO Premium
- **Fonctions** : 301, 302, 307, 410, 451 ; mode « simple » et « regex » ; **demande à l'utilisateur quoi faire de l'ancienne adresse quand il supprime ou déplace un contenu** (301 ou 410) ; import CSV (documenté, avec type par ligne) ; avertissement explicite sur le danger des regex ; export .htaccess/nginx selon la méthode serveur.
- **Limites** : pas de moniteur 404 *(point contradictoire dans les sources, à confirmer)* ; pas de statistiques.
- **À reprendre** : **la question posée à la suppression d'un contenu** (c'est la meilleure idée UX du lot), les avertissements regex.

### 2.4 All in One SEO (AIOSEO)
- **Fonctions** *(documentation officielle non récupérée, à confirmer)* : gestionnaire de redirections, **redirection du site entier** (domaine/HTTPS), journal des 404 avec conversion en redirection, redirections automatiques de permaliens, import/export CSV, journaux de hits.
- **À reprendre** : redirection « tout le site » comme assistant guidé.

### 2.5 SEOPress
- **Fonctions** : 301/302/307/410/451 ; regex (version PRO) ; 404 comptées et classées par fréquence, conversion en 1 clic (PRO) ; import depuis Redirection, Yoast, AIOSEO, SmartCrawl, Rank Math (PRO) ; export CSV et .htaccess (PRO).
- **Limites** : plusieurs fonctions payantes.
- **À reprendre** : classement des 404 par fréquence, import multi-sources.

### 2.6 Autres
- **Safe Redirect Manager** : minimaliste et rapide, redirections stockées comme contenu ; wildcard ; vue « sûre » (liste blanche d'hôtes externes) → **à reprendre : liste blanche de domaines externes**.
- **Simple 301 Redirects** : tableau simple, wildcard → modèle du mode « débutant ».
- **404 Solution** : suggestions de destinations par similarité de slug, import direct depuis plusieurs plugins, regex, notifications → **à reprendre : suggestions** (présentées comme suggestions, jamais automatiques).
- **Pretty Links** : liens courts/affiliés avec statistiques de clics et groupes → **hors périmètre** (autre produit : liens suivis), seulement l'idée de statistiques par règle.
- **Serveur (Apache/Nginx/Cloudflare)** : très rapide, mais hors du CMS, sans journal ni isolation par site. **Décision** : Kolakisa garde les redirections dans l'application (multisite et domaines personnalisés), mais l'export Apache/Nginx/Cloudflare est proposé pour qui migre.

### 2.7 Matrice comparative

Légende : ● oui · ◐ partiel/payant · ○ non/inconnu · **K** = déjà dans Kolakisa

| Fonction | Redirection | Rank Math | Yoast Prem. | AIOSEO | SEOPress | Kolakisa aujourd'hui |
|---|---|---|---|---|---|---|
| 301/302/307/308 | ● | ● | ● | ● | ● | ● **K** |
| 303 | ● | ○ | ○ | ○ | ○ | ○ |
| 410 | ● | ● | ● | ● | ● | ● **K** |
| 451 | ● | ● | ● | ○ | ● | ○ |
| Exacte / préfixe | ● | ● | ● | ● | ● | ● **K** |
| Regex | ● | ● | ● | ● | ◐ | ● **K** (sécurisée) |
| Contient / commence / finit par | ◐ | ● | ○ | ◐ | ◐ | ○ |
| Paramètres de requête (conserver/ignorer) | ● | ◐ | ◐ | ◐ | ◐ | ◐ (conserve seulement) |
| Conditions (rôle, connecté, langue, cookie…) | ● | ○ | ○ | ○ | ○ | ○ |
| Groupes | ● | ○ | ○ | ○ | ○ | ○ |
| Priorité d'exécution réglable | ● (ordre) | ◐ | ○ | ○ | ○ | ◐ (exact avant règle, ordre d'id) |
| Dates de validité | ○ | ◐ | ○ | ○ | ○ | ○ |
| Journal de hits (détail) | ● | ◐ | ○ | ● | ○ | ◐ (total seulement) |
| Moniteur 404 | ● | ● | ◐ | ● | ◐ | ● **K** (humain/bot, bornes) |
| 404 → redirection en 1 clic | ◐ | ● | ○ | ● | ◐ | ● **K** (espace site) |
| Suggestions de destination | ○ | ○ | ○ | ○ | ○ | ○ (404 Solution seulement) |
| Auto-redirection au changement de slug | ● | ◐ | ● | ● | ◐ | ● **K** (toujours, non configurable) |
| Question à la suppression d'un contenu | ○ | ◐ | ● | ○ | ○ | ○ |
| Détection chaînes/boucles | ◐ | ○ | ○ | ○ | ○ | ● **K** |
| Simulateur / test | ○ | ○ | ○ | ○ | ○ | ◐ (test réel d'une règle active) |
| Import CSV | ● | ● | ● | ● | ◐ | ● **K** (pas dans l'interface A) |
| Import depuis autres plugins | ● | ◐ | ○ | ◐ | ◐ | ○ |
| Export CSV/JSON | ● | ● | ◐ | ● | ◐ | ● **K** |
| Export Apache / Nginx | ● | ○ | ◐ | ○ | ◐ | ○ |
| Aperçu avant import | ○ | ○ | ○ | ○ | ○ | ◐ (JSON seulement) |
| Historique des modifications | ○ | ○ | ○ | ○ | ○ | ● **K** (`seo_changes`) |
| Tableau de bord / graphiques | ○ | ◐ | ○ | ◐ | ○ | ○ |
| Multisite isolé | ◐ | ◐ | ◐ | ◐ | ◐ | ● **K** |

**Rôle des catégories**
- **Indispensables** (déjà là) : codes 301/302/307/308/410, exact/préfixe/regex, boucles, 404, import/export CSV.
- **Avancées à ajouter** : groupes, dates de validité, « contient/commence/finit par », statistiques temporelles, aperçu d'import, 303 et 451, question à la suppression d'un contenu, mode auto / à valider / désactivé.
- **Professionnelles** : conditions (rôle, connecté, langue, hôte, paramètre), simulateur hors ligne par lot, import depuis Redirection / Rank Math / Yoast / AIOSEO / SEOPress / `.htaccess`, sauvegarde et restauration, redirection « tout le site ».
- **Rares / à fort intérêt** : suggestions de destination (similarité), détection de règles mortes (jamais utilisées, jamais atteignables), simulateur de migration avec rapport de couverture, annulation après suppression.

---

## 3. Audit de l'architecture actuelle (résumé)

- **Ordre du pipeline** (`server.js` ~130-136) : statiques → `notfound` (écoute la fin de réponse) → **redirections** → isolation des sites → permaliens → accueil → routage des sites → historique des slugs. L'ordre est une contrainte forte (le site doit être résolu avant ; ne pas déplacer).
- **Cache** : Map mémoire `site:chemin` (exact, O(1)) + tableau des règles préfixe/regex (parcours linéaire, 200 règles max par périmètre) ; invalidé à chaque écriture, **non partagé entre processus**.
- **Multisite** : `seo_redirects.site_id` (NULL = commune à tous les sites) ; pas de `organization_id` (le cloisonnement passe par le site). Le site vient du domaine (`siteHost.attachSite`), jamais du corps de requête.
- **Sécurité** : cibles `https://` seulement ; droit `redirects.external` pour l'externe (admin) ; pas de `/redirect?url=` ; regex ancrées, sans références arrière ni quantificateurs imbriqués ; une capture ne peut pas fabriquer un hôte. Lacunes : `PROTECTED` non appliqué aux règles exactes à l'exécution ; deux listes de chemins réservés (`PROTECTED` et `urls.RESERVED`) ; aucune liste blanche de domaines externes.
- **404** : table `seo_404` (humain/bot, dernier référent, dernier agent, pas d'IP, bruit filtré, bornes 1500/site et 5000 global, purge manuelle). Pas de série par jour ni de référents multiples.
- **Permaliens** : structure par site (`mk_settings`), 5 structures précédentes redirigées, analyse d'impact et confirmation à l'enregistrement. Anciennes adresses : **trois tables parallèles** (`cms_url_history` pages/termes, `post_slug_history` articles, `course_slug_history` formations), aucune pour les **produits**, aucune interface de gestion, aucun mode « à valider ».
- **Liens cassés** : analyse des liens internes connus (3000 max), un seul rapport JSON, principal seulement.
- **Tests** : bonne couverture moteur (règles, statuts, par site, CMS, navigateur) ; non couverts : import dans l'interface A (inexistant), statistiques, plafond de règles, liens cassés.
- **Performance** : `chains()`/`graph()` recalculés à chaque affichage et à chaque création (requêtes N+1 sur `cms_url_history`) ; `list()` non paginée dans l'interface B.

---

## 4. Fonctionnalités retenues

**Reprises et complétées** : toutes les fonctions « avancées » et « professionnelles » du tableau ci-dessus.
**Écartées** (et pourquoi) : liens affiliés/courts à la Pretty Links (autre produit) ; écriture dans `.htaccess` (le serveur Hostinger Node n'en dépend pas, et ce serait hors de l'isolation par site) ; redirection automatique d'une 404 vers une page « proche » sans validation (risque SEO : jamais).

---

## 5. Nouvelle organisation du menu « Redirections »

Chaque entrée correspond à un écran réel ; rien n'est ajouté pour remplir.

| # | Entrée | Contenu | Existe déjà ? |
|---|---|---|---|
| 1 | Tableau de bord | indicateurs réels, graphiques de hits, alertes (chaînes, boucles, règles mortes), raccourcis | non |
| 2 | Toutes les redirections | liste unique (fusion des 3 interfaces), filtres, actions groupées, **ajout via panneau** (« Ajouter une redirection » reste un bouton, pas une page à part — évite un sous-menu artificiel) | oui (A/B/C à fusionner) |
| 3 | Groupes | création, déplacement, statistiques | non |
| 4 | Liens cassés (404) | journal 404 + création de redirection + suggestions | partiel (404 dans SEO ; « liens cassés » = autre outil) |
| 5 | Journaux et statistiques | hits par jour, top règles, règles inactives, historique des modifications | non (compteur seul) |
| 6 | Permaliens et adresses | structure, historique des anciennes adresses (3 tables unifiées en lecture), mode auto / à valider / désactivé, migration de domaine | partiel (lecture seule) |
| 7 | Importer / Exporter | aperçu, sélection, formats CSV/JSON/Redirection/Rank Math/Yoast/AIOSEO/SEOPress/Apache/Nginx | partiel |
| 8 | Outils | simulateur, chaînes, boucles, doublons, règles mortes, validateur regex, sauvegarde/restauration | partiel (test réel) |
| 9 | Paramètres | modes automatiques, rétention des journaux, domaines externes autorisés, permissions | non |

Décision : « Ajouter une redirection » devient un **bouton** (panneau) plutôt qu'un sous-menu ; « Liens cassés » et « Erreurs 404 » sont **fusionnés** dans une seule entrée à deux onglets (404 réelles / liens cassés internes).

---

## 6. Architecture cible

- **Un seul moteur** : on garde `src/seo/redirects.js` (déjà isolé par site, testé) ; les trois interfaces deviennent une seule, branchée sur ses fonctions `…ForSite`. Les deux autres routes (B et C) redirigent vers elle.
- **Données** (nouvelles migrations numérotées — jamais de `ALTER` dans `ensureSchema` seul, à cause de la migration 090 qui reconstruit la table) :
  - `seo_redirects` + colonnes : `group_id`, `priority`, `starts_at`, `ends_at`, `query_mode` (conserver / ignorer / exiger), `case_sensitive`, `conditions` (JSON validé), `origin` (manuel / auto-slug / import / migration), `last_check_status`.
  - `seo_redirect_groups(id, site_id, name, description, enabled, created_at)`.
  - `seo_redirect_stats(site_id, redirect_id, day, hits)` — agrégat quotidien écrit via `writeBehind` (pas de ligne par visite : pas de données personnelles, pas de gonflement).
  - `seo_404_daily(site_id, path, day, hits)` + liste bornée de référents.
  - `seo_redirect_settings` (via `mk_settings`) : mode auto, rétention, domaines externes autorisés.
- **Matching** : (1) exact par Map ; (2) préfixe via arbre de préfixes (au lieu du parcours linéaire) ; (3) « contient/finit par/regex » dans l'ordre de priorité ; conditions évaluées en dernier. Limite 200 règles complexes par périmètre relevée (voir risques).
- **Sécurité** : `isProtected` appliqué aussi aux règles exactes à l'exécution ; une seule liste de chemins réservés ; liste blanche de domaines externes ; regex testées avec délai borné (exécution isolée avec garde de longueur d'entrée) ; permissions `redirects.view/create/edit/delete/external` + `redirects.import`, `redirects.export`, `redirects.settings`, `redirects.logs` (nouvelles) ; interface B alignée sur ces droits.
- **Historique des slugs** : une couche de lecture unifiée (pas de réécriture des 3 tables) + ajout des **produits**.
- **API** : routes JSON sous `/marketing/site-web/redirections/api/…`, mêmes permissions.
- **SEO** : une redirection n'écrit jamais de canonique ; le sitemap exclut déjà les adresses redirigées *(à vérifier en phase 6)*.

---

## 7. Risques et dépendances

1. **Fichier central `src/seo/redirects.js`** consommé par ≥12 modules : toute signature modifiée casse plusieurs écrans → on ajoute, on ne change pas.
2. **Migration 090** reconstruit `seo_redirects` : toute nouvelle colonne doit passer par une migration numérotée (+ retour arrière dans `scripts/migrations-retour-arriere/`).
3. **Ordre du pipeline `server.js`** : ne pas déplacer.
4. **`cmsNav.js` / `ABILITY`** : une entrée non déclarée devient « Bientôt » dans les sites ; des tests existants le surveillent.
5. **Cache non partagé** entre processus : acceptable tant qu'il n'y a qu'une instance (Hostinger Node) ; à documenter.
6. **Travail en parallèle** (règle `CLAUDE.md`) : `cmsNav.js`, `page-builder.js` et `landing.css` sont sensibles ; une session à la fois, rebaser avant de pousser, relancer `tests/seo-*`, `cms-urls*`, `permaliens*`, `isolation-*`.
7. **Déploiement** : tout push sur `main` met kolakisa.com à jour ; les migrations s'appliquent au démarrage → chaque phase doit avoir sa migration testée sur copie.
8. **Exigence « import depuis les plugins »** : les formats exacts de Rank Math / AIOSEO / SEOPress doivent être validés avec de vrais fichiers d'export fournis par l'utilisateur (je n'ai pas accès à leurs bases) ; en attendant, CSV et JSON.
9. **Statistiques fictives interdites** : le tableau de bord n'affichera que des données collectées *à partir de l'activation* du nouveau compteur (l'historique avant n'existe pas : seul le total existe).

---

## 8. Plan progressif (validation entre chaque phase)

| Phase | Contenu | Livrable testé |
|---|---|---|
| 2 | Déclarer les entrées dans `ABILITY`, nouvelle navigation, pages-coquilles réelles (Tableau de bord, Groupes, Journaux, Import/Export, Outils, Paramètres) **sans « Bientôt » mensonger** : une entrée non prête reste marquée « Bientôt » | menu principal + sites, tests `cmsNav` |
| 3 | Migrations (groupes, priorité, dates, conditions, stats), matching complet, 303/451, liste blanche externe, `isProtected` exact | tests unitaires moteur + isolation sites |
| 4 | Interface unique « Toutes les redirections », panneau d'ajout, groupes, filtres, actions groupées ; B et C redirigées vers elle | tests CMS + navigateur |
| 5 | 404 : jours, référents, suggestions, actions groupées, rétention ; journaux et statistiques | tests + captures |
| 6 | Permaliens : mode auto / à valider / désactivé, historique unifié, produits, assistant de migration de domaine | tests permaliens + e2e |
| 7 | Outils : simulateur par lot, import avec aperçu (CSV/JSON/Redirection/…), export Apache/Nginx, sauvegarde/restauration, validateur regex | tests + fichiers d'exemple |
| 8 | Audit final (sécurité, performance 10 000 règles, multisite, SEO, accessibilité, documentation) | rapport |

Documentation à produire au fil des phases : `docs/redirections/FONCTIONNEL.md`, `TECHNIQUE.md`, `GUIDE_UTILISATEUR.md`.
