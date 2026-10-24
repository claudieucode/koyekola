# KOLAKISA — Paramètres → Permaliens

Référence : « Réglages des permaliens » de WordPress (capture fournie ; documentation *Settings Permalinks Screen* et *Customize Permalinks*). Ce document décrit l'état **réel** de Kolakisa.

## 1. Référence WordPress

| Élément | Comportement WordPress | Kolakisa |
|---|---|---|
| Structures courantes | Simple `/?p=123`, Date et titre, Mois et titre, Numérique `/archives/123`, Titre `/%postname%/`, Personnalisée | Les six, plus **Blog** `/blog/%postname%` (adresse historique de Kolakisa, valeur par défaut : aucune adresse publiée ne change tant que rien n'est réglé) |
| Balises | `%year% %monthnum% %day% %hour% %minute% %second% %post_id% %postname% %category% %author%` | Les dix, réellement interprétées par le moteur (génération **et** résolution) |
| Validité | La structure doit contenir `%post_id%` ou `%postname%` | Idem, validée côté serveur (message précis, saisie conservée) |
| `%category%` | Catégorie principale (hiérarchie `parent/enfant`) ; « uncategorized » sans catégorie | Catégorie **principale**, sinon la première par position puis par nom ; imbriquée = `parent/enfant` ; sans catégorie = `sans-categorie` |
| Préfixes | Base des catégories et des étiquettes (`category`, `tag` par défaut) | Mêmes champs ; vide = base par défaut de Kolakisa (`/blog/categorie`, `/blog/etiquette`) |
| Changement de structure | Les anciennes URL de `?p=` redirigent ; les autres changements cassent les liens | L'ancienne adresse, l'ancienne structure et `?p=<id>` redirigent (301) vers l'adresse canonique, sans chaîne |
| Pages | Structure propre aux pages | Inchangées (`/p/<adresse>`, racine d'un domaine de site) |
| Types personnalisés | `rewrite` par type | Kolakisa n'en a pas : seuls articles, pages, formations, catégories, étiquettes existent |

## 2. Architecture (un seul moteur)

- `src/services/permalinks.js` : configuration par site, validation, génération (`postPath`), résolution (`lookup`, `rowForPath`), intergiciel (`middleware`), impact (`impact`), enregistrement (`save`).
- `src/services/urls.js` : `publicPath("post", row)` délègue au moteur ; `resolve()` et `movedTarget()` connaissent les structures et les préfixes.
- `src/services/taxonomy.js` : `baseOf(taxonomie, terme)` (préfixe du site qui sert le terme) et `defaultBase` (routes internes).
- Intergiciel monté dans `server.js` après l'isolation des domaines : il **réécrit** (en interne) un permalien vers la route `/blog/<adresse>` existante, ou redirige (301) vers l'adresse canonique. Aucune route n'est dupliquée.
- La normalisation des adresses (`siteHost.normalizePaths`) ne réécrit pas un permalien actif (sa barre finale est canonique).
- Stockage : `mk_settings`, clés `permalinks.<main|site_N>.{structure,category_base,tag_base,previous}`. Aucune migration, aucune table.
- Liens générés par le moteur : liste du blog, fiches, lien canonique, JSON-LD, plan du site, flux RSS, recherche, widgets, passerelles, éditeur de pages, SEO, commentaires, vues (`postUrl`, `termUrl`).

## 3. Règles de résolution

1. `/?p=<id>` : sert l'article (structure Simple) ou redirige vers son adresse canonique.
2. Préfixe d'archives : `/<préfixe>/<adresse>` est servi par la route des archives ; l'adresse par défaut redirige vers le préfixe.
3. `/blog/<adresse>` (historique) : redirige vers l'adresse canonique si la structure est autre.
4. Structure du site, puis anciennes structures (5 au plus) : l'article est trouvé par `%post_id%` ou `%postname%` (anciennes adresses d'article comprises), jamais par la date ou la catégorie. Si le chemin demandé diffère de l'adresse canonique (date, catégorie, barre finale), **301** vers la canonique.
5. Un brouillon, un article programmé ou à la corbeille n'est jamais révélé par une redirection (404 public, aperçu formateur inchangé).
6. Une **page du site** à la même adresse l'emporte (domaine d'un site) ; une route système ou une adresse réservée n'est jamais interceptée : un article dont le titre entrerait en collision garde `/blog/<adresse>`.

## 4. Protection des adresses existantes

- Le changement est **refusé** s'il crée une boucle avec une redirection manuelle existante (SEO → Redirections).
- Si des adresses publiées changent, l'écran affiche le nombre, des exemples avant/après, et exige une **confirmation explicite**.
- Pas de table de redirections massive : les anciennes adresses sont traitées par calcul à chaque visite (donc sans chaîne, sans boucle, sans volumétrie).
- Code HTTP : 301.

## 5. Multi-sites

- La configuration appartient au site administré ; le site vient de la barrière d'accès serveur (jamais d'un identifiant du navigateur) ; un accès limité au site A ne lit ni n'écrit B.
- Une structure s'applique aux articles servis par le **domaine** d'un site. Un site **sans domaine propre** est servi sous le domaine principal : il suit les permaliens du principal (écran en lecture seule, écriture refusée).
- Le domaine d'un site ne sert jamais un article d'un autre site ; l'article d'un site n'est pas servi par le domaine principal.
- Enregistrer une structure exige `settings.write` **et** `settings.sensitive` (changement d'adresses publiques, donc de référencement).

## 6. Interface

Écran dédié (`views/marketing/permalinks-settings.ejs`, `public/js/cms-permalinks.js`, styles `.pl-*` de `cms.css`) : barre d'adresse vivante (domaine réel, article réel ou données de démonstration identifiées), cartes de structures accessibles (radios natifs), champ personnalisé avec insertion des balises à la position du curseur, aperçu instantané, validation serveur à la volée (aucune écriture), préfixes avec aperçu, panneau d'impact, barre d'enregistrement collante, détection des modifications non enregistrées, protection contre la perte de saisie et la double soumission, mode sombre, mobile, mouvement réduit respecté.

## 7. Limites

- Pas de types de contenus personnalisés ni d'archives par date : le CMS n'en a pas.
- `%hour%`, `%minute%`, `%second%` utilisent l'heure enregistrée (UTC), pas le fuseau du site.
- Les éditeurs de texte et le code qui écrivent encore un lien `/blog/<adresse>` à la main continuent de fonctionner : le lien est redirigé (301) vers l'adresse canonique.
- La structure d'un article qui change de catégorie principale ou d'auteur change : l'ancienne adresse redirige (la canonique est recalculée), mais l'ancienne n'est mémorisée que par `%postname%` / `%post_id%`.
