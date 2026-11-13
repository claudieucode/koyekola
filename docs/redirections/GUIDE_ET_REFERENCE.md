# Redirections KOLAKISA — guide, fonctionnement et référence technique

Complète `PHASE1_ETUDE_ET_AUDIT.md` (étude des plugins WordPress, audit, plan). Ce document décrit ce qui est **réellement livré**.

---

## 1. Où le trouver

Menu de gauche → **Redirections** (9 entrées). Même rubrique dans l'espace d'un site (`Mes sites` → le site → Redirections) : chaque site ne voit et ne modifie que ses règles.

| Entrée | Adresse (site principal) | Rôle |
|---|---|---|
| Tableau de bord | `/marketing/site-web/redirections/tableau-de-bord` | indicateurs réels, graphique par jour, alertes, raccourcis |
| Toutes les redirections | `/marketing/site-web/redirections` | liste, recherche, filtres (type, correspondance, état, site, groupe), tri, actions groupées, création et modification |
| Groupes | `…/redirections/groupes` | organiser, activer / désactiver ensemble |
| Liens cassés (404) | `…/redirections/erreurs-404` | pages introuvables réellement visitées, suggestions, redirection en 1 clic |
| Journaux et statistiques | `…/redirections/journaux` | déclenchements par jour, règles et destinations les plus utilisées, règles jamais utilisées, historique des modifications (exportable) |
| Permaliens et adresses | `…/redirections/adresses` | mode automatique / à valider / désactivé, changements d'adresse constatés, remplacement de préfixe, couverture d'une migration |
| Importer / Exporter | `…/redirections/import-export` | import avec aperçu, export (CSV, JSON, Apache, Nginx, 404), sauvegarde et restauration |
| Outils avancés | `…/redirections/outils` | simulateur, test en lot, testeur d'expression régulière, diagnostic |
| Paramètres | `…/redirections/parametres` | mode automatique, conservation des journaux, domaines extérieurs autorisés, permissions |

Dans l'espace d'un site : `/marketing/site-web/sites/<id>/redirections/<écran>`.
« Ajouter une redirection » est un bouton (fenêtre), pas une page : il n'y a pas de sous-menu artificiel.

---

## 2. Créer une redirection

Bouton **Ajouter une redirection**.

- **Ancienne adresse** : un chemin du site (`/ancienne-page`). Les espaces techniques (`/formateur`, `/marketing`, `/connexion`, `/api`, fichiers…) et l'accueil ne peuvent jamais être redirigés.
- **Nouvelle adresse** : un chemin du site, ou `https://…` pour les personnes autorisées (permission *rediriger vers un site extérieur*) et si le domaine figure dans la liste blanche (Paramètres) quand elle est remplie. Les adresses `http://` ne servent jamais de destination extérieure (seul le chemin est gardé) ; aucun protocole dangereux n'est accepté.
- **Type** : voir § 3.
- **Correspondance** : voir § 4.
- **Options avancées** : groupe, priorité (1 à 999), période de validité (heure de Paris), paramètres de l'adresse.
- **Note** interne.

### Choisir le bon code
| Code | Quand | Effet |
|---|---|---|
| **301** | la page a définitivement changé d'adresse | les moteurs transfèrent le référencement (choix par défaut) |
| **308** | idem, mais une demande POST doit rester POST | permanent + méthode conservée |
| **302** | changement temporaire (page de campagne, maintenance) | le référencement reste sur l'ancienne adresse |
| **307** | temporaire + méthode conservée | |
| **303** | temporaire ; après un envoi de formulaire, aller consulter une page | le navigateur repart en GET |
| **410** | page supprimée volontairement, sans remplaçante | « disparue pour toujours » (plus net qu'un 404) ; pas de destination |
| **451** | contenu indisponible pour une raison légale | pas de destination |

---

## 3. Correspondances et ordre d'exécution

1. **Adresse exacte** (la plus rapide : table en mémoire) — toujours testée en premier.
2. Règles **préfixe**, **contient**, **se termine par**, **expression régulière** : testées ensuite, de la priorité 1 à 999 (à égalité : la plus ancienne). Celles **du site** passent avant les règles communes.

| Mode | Exemple | Résultat |
|---|---|---|
| Exacte | `/ancien` | seulement `/ancien` |
| Préfixe | `/ancien-blog` → `/blog` | `/ancien-blog/x` → `/blog/x` |
| Contient | `/archive-2019/` → `/blog` | toute adresse contenant ce texte (casse ignorée) |
| Se termine par | `.html` → `/accueil` | toute adresse finissant par `.html` |
| Expression | `^/ancien/(.*)$` → `/nouveau/$1` | captures `$1`…`$9` |

Expressions régulières : doivent commencer par `^`, 200 caractères maximum, sans espace, sans référence arrière ni assertion, sans répétitions imbriquées ; l'hôte d'une destination extérieure ne peut pas venir d'une capture. 200 règles « complexes » au plus par site (chaque requête les parcourt).

Une règle ne s'applique pas si : elle est désactivée, son **groupe** est désactivé, ou elle est **hors de sa période de validité**. Un site ne déclenche jamais la règle d'un autre site (la règle d'un site ne s'applique que sur son domaine).

**Paramètres de l'adresse** : *conserver* (`/ancien?x=1` → `/nouveau?x=1`, par défaut) ou *ignorer*.

---

## 4. Liens cassés (404)

Liste des adresses **réellement** demandées et introuvables (journal sans IP ni identité : adresse, nombre de visites personnes / robots, dernières dates, dernier référent). Bruit des robots filtré, journal borné.

- Recherche, état (à traiter / traitées / ignorées / toutes), visiteurs (personnes / robots), tri, regroupement par dossier.
- **Suggestions** : proposées d'après la ressemblance des adresses et des titres des pages publiées, avec la raison indiquée ; **jamais appliquées seules** ; aucune suggestion sans ressemblance.
- **Rediriger** : crée une vraie règle et retire l'adresse du journal. Ne redirigez pas vers une page sans rapport : les moteurs la traitent comme une fausse erreur.
- Actions groupées : ignorer, marquer traitée (sites), rouvrir, supprimer du journal (permission de suppression).

---

## 5. Permaliens et adresses

- **Mode des changements d'adresse** (pages et catégories / étiquettes d'un site) : *automatique* (défaut : l'ancienne adresse redirige seule), *à valider* ou *désactivé* (l'ancienne adresse ne redirige plus ; en « à valider », chaque changement constaté peut être converti en vraie règle d'un clic). Les articles et formations du site principal gardent leur redirection automatique. Aucune redirection n'est créée pour une page jamais publiée.
- **Remplacer un préfixe** : crée une règle de préfixe (dossier entier).
- **Couverture d'une migration** : collez les anciennes adresses ; chacune est suivie à travers les règles actives (couverte / non couverte / chaîne / boucle), sans rien rediriger.
- La structure des adresses (articles, pages, catégories) garde son écran avec **analyse d'impact avant toute modification** (« Permaliens du site principal »).

---

## 6. Importer, exporter, sauvegarder

**Import** — formats reconnus : CSV (colonnes reconnues par leur nom : source / destination / type / correspondance / note / groupe / actif…, y compris les en-têtes des exports de Redirection, Yoast, Rank Math…), JSON (sauvegarde KOLAKISA, export de Redirection), `.htaccess` (`Redirect`, `RedirectMatch`, `RewriteRule … [R=301]`), Nginx (`location = … { return … }`, `rewrite … permanent`).
Parcours : *Analyser* → **aperçu ligne par ligne** (prête / déjà présente / doublon / refusée + raison) → sélection → case de **confirmation** → import. Une **copie de sécurité** est gardée avant. Rien n'est enregistré avant la confirmation. Les destinations extérieures exigent la permission et respectent la liste blanche.

> Limite honnête : les formats propriétaires de Rank Math, AIOSEO et SEOPress ont été étudiés d'après leur documentation publique, pas validés sur de vrais fichiers. Si un fichier n'est pas reconnu, exportez-le en CSV depuis l'extension d'origine (colonnes source / destination / type).

**Export** : toutes les règles ou un groupe, actives / désactivées, formats CSV, JSON, Apache, Nginx ; erreurs 404 en CSV. Les cellules CSV sont protégées contre l'injection de formules.
**Sauvegarde** : fichier JSON complet (règles + groupes). **Restauration** : *ajouter les absentes* ou *remplacer toutes les règles* (permission de suppression). Le site principal ne remplace que ses règles **communes**, jamais celles des sites. **Revenir à la copie de sécurité** annule la dernière restauration, un import ou une suppression groupée.

---

## 7. Outils avancés

- **Simulateur** : suit une adresse à travers les vraies règles actives (étapes, code, priorité, groupe, résultat) **sans rediriger ni compter de visite**.
- **Test en lot** : jusqu'à 100 adresses.
- **Testeur d'expression régulière** : mêmes garde-fous que le moteur.
- **Diagnostic** : boucles, chaînes (avec bouton « Raccourcir »), doublons, redirection vers soi-même, destinations à vérifier (pages / articles / formations inconnus), règles inutilisées depuis N jours (bouton pour les désactiver, jamais supprimer), règles hors période, groupes désactivés.

---

## 8. Permissions

| Action | Permission |
|---|---|
| consulter, simuler, exporter | `redirects.view` |
| créer, importer, valider un changement d'adresse | `redirects.create` |
| modifier, groupes, réglages, actions groupées, restaurer (ajout) | `redirects.edit` |
| supprimer, remplacer toutes les règles, annuler une restauration | `redirects.delete` |
| destination extérieure | `redirects.external` |

Un site archivé est en lecture seule. Les permissions fines d'import / export / journaux sont couvertes par ces cinq droits existants (pas de nouvelle permission : éviter une seconde écriture du même droit).

---

## 9. Référence technique

**Fichiers** : moteur `src/seo/redirects.js` (une seule écriture des règles) ; outils `src/seo/redirectTools.js` ; routes `src/marketing/web/redirectsHub.js` (principal + site), `src/marketing/web/urls.js` (liste historique) et `siteSeo.js` (liste d'un site) ; vues `views/marketing/redirections-hub.ejs`, `redirects.ejs`, `partials/redirections-tabs.ejs` ; menu `src/marketing/web/cmsNav.js` (`SECTIONS` + `ABILITY`) ; style `public/css/cms.css` (`.rd-*`) ; script `public/js/cms-redirections.js`.

**Tables** (colonnes ajoutées à la première utilisation du moteur, comme `match_type`, car la migration 090 reconstruit `seo_redirects` au démarrage) :
- `seo_redirects` + `group_id`, `priority` (défaut 100), `starts_at`, `ends_at`, `query_mode` (`keep|drop`), `origin` (`manual|auto-slug|import|migration|404|suggestion`) ; `match_type` ∈ `exact|prefix|contains|endswith|regex` ; `status` ∈ 301, 302, 303, 307, 308, 410, 451.
- `seo_redirect_groups(id, site_id, name, description, enabled, created_by, created_at)` — un groupe appartient à un site (ou est commun) ; une règle ne peut être rangée que dans un groupe de son périmètre.
- `seo_redirect_daily(redirect_id, day, hits)` — un compteur par règle et par jour (aucune donnée personnelle), alimenté avec le compteur total par écriture différée.
- `seo_404_daily(site_id, path, day, hits)` — série par jour des 404.
- Réglages et copie de sécurité : `seo_settings` (clés `redirects_settings_<main|site_N>`, `redirects_snapshot_<…>`). Historique : `seo_changes` (`redirect`, `redirect-group`, `redirect-settings`).

**Exécution** (`redirects.middleware`, avant isolation des sites) : GET/HEAD ; chemin normalisé ; chemin protégé → on laisse passer (même si une ligne de base existait) ; recherche exacte (Map `siteId:chemin`, site puis commun) ; règles complexes triées par priorité ; fenêtre de validité à l'heure de Paris ; groupe désactivé exclu (jointure au chargement du cache) ; cache invalidé à chaque écriture (instance unique). 410 / 451 : texte brut, `noindex`, cache 1 h.

**Isolation** : le site vient du domaine servi (`req.kwSite`) ou de l'adresse vérifiée (`/sites/<id>/…`), jamais d'un champ de formulaire ; chaque outil prend un *périmètre* `{siteId}` (un site) ou `{siteId: null, visible: […]}` (principal : communes + sites visibles) et refuse toute règle, groupe ou copie d'un autre périmètre.

**Sécurité** : destinations `https://` ou chemins ; liste blanche de domaines ; protocoles dangereux refusés ; imports plafonnés (2 000 lignes, 2 Mo) et validés ligne par ligne ; regex gardées ; pas de `/redirect?url=` ; CSV anti-formules ; aucune IP conservée.

**Perf** : exact en O(1) ; règles complexes plafonnées (200 / périmètre) ; statistiques en agrégats quotidiens ; journaux bornés.

**Tests** : `tests/redirections-outils.test.js` (moteur et outils, sans serveur, 15 cas), `tests/redirections-hub.test.js` (vrai serveur : écrans, formulaires, redirections servies, imports, exports, 404, paramètres, entrées hostiles), plus `seo-redirections-*`, `cms-urls*`, `seo-par-site-unitaire`, `permaliens`.

## 10. Limites connues
- Le cache des règles est en mémoire d'un seul processus (instance unique sur Hostinger).
- Les graphiques par jour se remplissent à partir de la mise en service (avant : seul le total existait) ; aucune donnée n'est reconstituée ni inventée.
- Le mode « automatique / à valider / désactivé » concerne les pages et catégories des sites ; les articles et formations du site principal restent automatiques.
- Pas de conditions de correspondance (rôle, langue, cookie…) ni d'import validé sur de vrais fichiers Rank Math / AIOSEO / SEOPress (voir § 6).
- Pas d'historique d'adresses pour les produits de la boutique (à traiter avec le chantier Boutique).
