# KOLAKISA — Audit du module SEO (mission SEO-01)

Branche `seo-refonte-01`, issue de `origin/main`. Ce document consigne l'**état réel** constaté avant toute modification, puis ce qui a été changé.
Il complète `SEO_CORE.md` (moteur central), `docs/cms-seo.md` (SEO des pages du CMS) et `docs/KOLAKISA_SEO_PAR_SITE.md` (les neuf rubriques d'un site).

## 1. Constat : le module n'est pas à reconstruire
| Domaine | État réel (vérifié) |
|---|---|
| Moteur | `src/seo/` (≈ 4 100 lignes, 27 fichiers) : un seul calcul du `<head>` (`resolver.js`) pour toutes les pages publiques ; réglages centraux, par contenu et **par site** (`seo_site_settings`). |
| Métadonnées publiques | Sonde sur un serveur de test (`SITE_URL` https) : titre, description, canonical absolu, `og:*`, `twitter:*`, JSON-LD valide (`Organization+WebSite+WebPage[+BreadcrumbList][+Course]`). Un seul canonical, un seul H1, jamais de JSON invalide. |
| Canonical et URL | `?utm_source=…` : canonical sans paramètre ; barre finale et majuscules : 301 vers l'adresse canonique ; `?q=` : `noindex, follow` ; pages privées (`/connexion`) et 404 : `noindex, nofollow`. |
| `robots.txt` | Servi en `text/plain`, espaces privés interdits, règles propres au site, `Sitemap:` en adresse publique ; **environnement non public (adresse locale, visibilité masquée) : `Disallow: /` et aucun plan annoncé** (`siteHost.indexingAllowed`). |
| Plan du site | XML valide, `lastmod`, exclusions motivées (noindex, canonical ailleurs, redirigées), index de sous-plans au-delà de 5 000 adresses, plafond 45 000 par fichier. |
| Redirections | 301/302 ; boucle refusée (400) ; `javascript:` et `//hôte` refusés (400) ; source privée (`/connexion`) refusée (400) ; cible externe acceptée **uniquement en https** (réservé aux comptes autorisés). |
| Audit | 41 règles documentées (`rules.js`), exploration réelle (400 pages au plus), orphelines, liens cassés, doublons, historique, comparaison avec l'analyse précédente, corrections automatiques journalisées. Le repère est étiqueté « interne » et « ni note officielle, ni prévision de classement ». |
| Intégrations | PageSpeed, Search Console, GA4 : « Non connecté » sans configuration, clé chiffrée (AES-256-GCM), vérifiées contre un faux serveur Google ; aucune donnée inventée. |
| Isolation par site | Site lu uniquement depuis l'adresse vérifiée (`req.seoSpace`), requêtes bornées par `site_id`, tests d'accès croisé existants. |

## 2. Mesures de cette mission
- Tests SEO existants (19 fichiers) : **189 réussis, 2 échecs**. Un échec est un délai de démarrage du serveur de test (charge de la machine), l'autre un **test périmé** : `seo-import-par-site-navigateur` cherchait le nom du site sur la vue générale alors que la réorganisation en neuf rubriques l'a déplacé dans « Meta ». Test corrigé.
- Audits Chrome des 10 écrans SEO d'un site (clair + sombre, 9 largeurs de 320 à 1920 px) : contrastes insuffisants 0, commandes sans nom 0, focus invisible 0, débordement horizontal 0, cibles tactiles trop petites 0. Seul signalement : le menu latéral qui défile sous son pied (faux positif connu de la mesure).

## 3. Défaut constaté et corrigé
**Les problèmes n'étaient pas hiérarchisés.** L'analyse listait chaque constat page par page (« Aucun titre H1 » ×3, « Page orpheline » ×2…), sans dire par où commencer ni quelle correction touche le plus de pages ; la vue générale n'indiquait aucune action.
- Nouveau bloc **« À traiter en priorité »** (analyse) : problèmes regroupés par type, avec nombre réel de pages, correction proposée et lien « Voir les pages » (filtre par type `?regle=`). Ordre documenté : gravité (critique, avertissement, recommandation), puis nombre de pages concernées, puis titre. Aucun score arbitraire.
- Nouveau bloc **« À traiter en premier »** (vue générale) : les trois premiers types d'après la dernière analyse terminée ; absent tant qu'aucune analyse n'existe.
- Le moyen de vérifier la correction est écrit à l'écran : relancer l'analyse, la ligne disparaît et le décompte « résolus » (comparaison existante) augmente.
- Fichiers : `src/seo/siteTools.js` (`priorityGroups`, option `rule`), `src/marketing/web/siteSeo.js` (paramètre `regle`, assaini), `views/marketing/site-seo/analyse.ejs`, `overview.ejs`, `public/css/cms.css`. Aucune migration.
- Tests : `tests/seo-priorites.test.js` (ordre, filtre, règle piégée sans effet, vue générale, isolation entre sites, compte sans droit) ; `seo-import-par-site-navigateur` mis à jour.

## 4. Limites et décisions à prendre
- **Search Console / PageSpeed ne sont pas appelés depuis l'espace d'un site** : ces intégrations sont centrales (une clé de service par installation). Les brancher par site demande un modèle d'autorisations par site (qui peut lier quelle propriété Google) : à décider avant tout développement. Rien n'est simulé en attendant.
- Redirections vers un domaine externe : acceptées en https pour les comptes autorisés ; si l'on veut interdire toute sortie du site, c'est un choix produit.
- Le crawl interne se limite aux pages du site et à 400 pages ; les liens externes sont vérifiés par échantillon (150) depuis le serveur.
- L'état « Valide » du sitemap vient d'un contrôle de structure local ; **rien ne prouve que Google l'a reçu** (la soumission se fait dans Search Console).
- Performance : l'analyse s'exécute en arrière-plan (une seule à la fois, progression réelle) ; aucun chronométrage nouveau n'a été pris dans cette mission.
