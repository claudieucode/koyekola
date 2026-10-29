# 01 — Configuration initiale, modules, importation, permissions, réglages

Consulté le 2026-10-29. Qualification : officiel / observation / hypothèse (voir `00-overview.md`).

## 1. Assistant de configuration (Setup Wizard)

Source : https://rankmath.com/kb/how-to-setup/ (officiel).

### 1.1 Modes
| Mode | Contenu | Niveau |
|---|---|---|
| Facile | Moins d'étapes, réglages simplifiés | Gratuit (non contredit) |
| Avancé | Étapes supplémentaires, ouvre les « options avancées » après l'assistant | Gratuit (non contredit) |
| Personnalisé | Import d'un fichier de réglages (.txt/.json) ; seuls les réglages Rank Math passent, pas les méta des articles | PRO |

On peut changer de mode à tout moment. L'assistant se relance depuis Rank Math SEO → Tableau de bord → onglet Setup Wizard.

### 1.2 Étapes (mode avancé)
1. **Connexion du compte** (service externe : compte Rank Math ; bouton « Passer » disponible ; suivi d'usage optionnel).
2. **Contrôle de compatibilité** : tests préalables, détection d'extensions SEO conflictuelles (désactivables car leurs données sont importées à l'étape suivante).
3. **Importation** : Yoast SEO, All in One SEO, SEOPress, Redirection, Schema Pro, All In One Schema. Option « Recalculer les scores SEO » pour les articles affichant N/A. Rattrapable plus tard via Status & Tools → Import & Export → Other Plugins.
4. **Votre site** : type (blog personnel, blog communautaire/actualités, portfolio, petite entreprise, boutique, autre site personnel, autre site d'entreprise) qui détermine personne vs organisation ; type d'entreprise ; nom du site (utilisé pour les données structurées « nom de site » de Google) ; nom alternatif ; nom de la personne/organisation (Knowledge Panel) ; logo (minimum 112×112 px, carré recommandé) ; image de partage par défaut (1200×630 recommandé).
5. **Analytics** (compte Google requis) : permissions Google (création de propriété Analytics, gestion des entités Analytics, lecture des données Analytics, données AdSense, Search Console, gestion de sites/domaines pour la vérification automatique). Sous-réglages : site Search Console + pays (**PRO**), onglet Index Status, propriété/flux GA4 avec option d'installation du code de suivi et création de propriété, anonymisation d'IP (**PRO**), fichier JS Analytics auto-hébergé (**PRO**), exclusion des utilisateurs connectés, AdSense (**PRO**). Rapport e-mail mensuel : fréquence (PRO, Business, Agency), marque blanche et multi-destinataires (Business/Agency).
6. **Sitemap** : activé par défaut, images incluses par défaut, types de contenu publics (Articles et Pages par défaut), taxonomies publiques, News Sitemap (**PRO**, nom de publication, types), Video Sitemap (**PRO**, types).
7. **Optimisation** : noindex des archives catégories/étiquettes vides (recommandé), nofollow des liens externes (recommandé ; listes noire/blanche), ouverture des liens externes dans un nouvel onglet.
8. **Prêt** : mise à jour automatique du plugin recommandée ; bouton « Setup Advanced Options ».
9. **Réglages avancés** : Role Manager (optionnel), moniteur 404 + redirections (désactivables si d'autres plugins font déjà le travail), Schéma (activé par défaut, types par défaut par type de contenu, surchargeables par contenu).

### 1.3 Dépendance WordPress / pertinence Kolakisa
- Identité site, image sociale par défaut, noindex des archives vides, nofollow externe configurable : transposables (réglages globaux de site).
- Compte Rank Math, Google OAuth, plugins concurrents importables : spécifiques à l'écosystème ; **hypothèse** : l'équivalent Kolakisa serait un import CSV/JSON de redirections et de méta.
- Limite documentée : pas de règle chiffrée sur ce qui est « recommandé » au-delà des cases cochées.

## 2. Mode facile vs mode avancé (officiel : https://rankmath.com/kb/advanced-mode/)

Le mode avancé affiche : modules 404 Monitor, ACF, bbPress, BuddyPress, Image SEO, Redirections, Role Manager ; options de liens et fil d'Ariane complet, vérifications webmaster Yandex/Norton/balises custom, édition robots.txt, onglet Autres, options WooCommerce, édition `.htaccess` ; test de connexions Analytics ; robots avancés et partage Slack dans Titres & Meta ; Include Empty Terms et pièces jointes dans les sitemaps ; Instant Indexing (soumission manuelle, historique, clé IndexNow) ; SEO Analyzer à 32 tests au lieu de 24 ; Status & Tools (versions, outils de base de données, import/export) ; onglet Avancé de la méta-boîte (robots, canonical, titre de fil d'Ariane, redirection). L'article avertit que ces options peuvent dégrader les performances SEO et qu'une erreur `.htaccess` peut casser le site.

## 3. Modules

Les modules s'activent depuis Tableau de bord → Modules (officiel : `kb/role-manager/`). Dépendances relevées : Video Sitemap exige Schema + Sitemap ; Podcast exige Schema ; Image SEO fournit l'onglet Images des réglages ; llms.txt exige le module LLMS Txt et le mode avancé ; Local Sitemap exige Local SEO & Knowledge Graph ; Rank Tracker fait partie d'Analytics (support officiel Rank Math, résultat de recherche, non lu en page complète). Liste complète : voir Lacunes.

## 4. Réglages généraux (officiel : https://rankmath.com/kb/general-settings/)

- **Liens** : supprimer la base de catégorie ; rediriger pièces jointes vers l'article parent ; rediriger pièces jointes orphelines vers une URL (idéalement l'accueil) ; nofollow de tous les liens externes ; nofollow des liens externes vers fichiers image ; liste noire de domaines (toujours nofollow) ; liste blanche (jamais nofollow) ; nouvel onglet ; préfixe de liens d'affiliation (**PRO**) pour marquer sponsored.
- **Fil d'Ariane** : activation (nécessite code/shortcode dans le thème), séparateur, lien et libellé d'accueil, préfixe, formats d'archive/recherche/404, masquer le titre de l'article, afficher les catégories, masquer le nom de taxonomie, page des articles.
- **Images** (module Image SEO) : alt, titre manquants avec format à variables ; légende et description manquantes (**PRO**) ; casse (**PRO**) ; alt des avatars (**PRO**) ; remplacements (**PRO**).
- **Webmaster Tools** : codes de vérification Google, Bing, Baidu, Yandex, Pinterest, Norton Safe Web, balises personnalisées.
- **robots.txt** : éditeur du fichier virtuel ; version gratuite basique avec lien vers un testeur externe ; éditeur avancé avec testeur intégré (**PRO**) ; un fichier physique existant l'emporte (officiel, voir aussi https://rankmath.com/kb/how-to-edit-robots-txt-with-rank-math/ : règles par défaut `User-agent: *`, `Disallow: /wp-admin/`, `Allow: /wp-admin/admin-ajax.php`, ligne `Sitemap:`).
- **llms.txt** (mode avancé) : types de contenu, taxonomies, limite d'entrées (100 par défaut), contenu additionnel manuel.
- **Blocs** (module Schema) : titre, style de liste et titres exclus du bloc Table des matières.
- **Autres** : support « headless » (point d'accès REST renvoyant les balises méta pour une URL), affichage du score SEO aux visiteurs (types, forme circulaire/carrée, position), lien de soutien nofollow, suivi d'usage, texte avant/après contenu des flux RSS, suppression des médias dans les flux RSS (**PRO**).
- **WooCommerce** : suppression de bases d'URL (shop, product-category, slugs parents), balise generator, schéma des archives boutique, marque, identifiant global GTIN/ISBN (**PRO**), noindex des produits masqués (**PRO**).
- **.htaccess** : éditeur avec sauvegarde préalable.
- **404 Monitor** : mode Simple/Avancé, limite de journal (100 par défaut), chemins exclus (URL, mots, regex), ignorer les paramètres de requête.
- **Redirections** : mode debug (admins), comportement de repli (404, accueil, URL), type par défaut, redirection automatique lors d'un changement de slug (301).
- **Analytics** : Search Console, GA4, base de données (90 jours par défaut), barre de stats en front-office, rapports e-mail (fréquence selon plan), surveillance multi-sites et marqueurs « Core Updates » (**Business**), mots-clés suivis uniquement (**PRO**).
- **Content AI** : pays, ton, public, langue par défaut ; types de contenu activés ; usage et date de renouvellement.
- **Podcast** : métadonnées de flux.
- **Non couvert dans la lecture** : onglets Instant Indexing et Role Manager de cette page (voir §6 et §5).

## 5. Permissions (Role Manager) — officiel : https://rankmath.com/kb/role-manager/

- Module à activer (Mode avancé). Rôles : Administrateur, Éditeur, Auteur, Contributeur, Abonné, Client, Gestionnaire de boutique, rôles de forum, plus rôles personnalisés.
- Capacités restreignables par rôle : Titres & Meta ; Réglages généraux ; Sitemap ; Journal 404 ; Link Builder ; Redirections ; Role Manager ; Analytics ; Analyse du site ; Analyse on-page (général, avancé, schéma, social) ; Content AI ; barre d'administration.
- Effet : l'élément disparaît du menu ; l'URL directe répond « Sorry, you're not allowed to access this page. » La capacité Role Manager de l'Administrateur est désactivée par défaut. Bouton « Tout basculer » par rôle, « Update Capabilities » pour enregistrer.
- Niveau gratuit/PRO : non précisé.
- Pertinence Kolakisa : le principe (permissions fines par fonction SEO) est transposable ; le mécanisme WP (capabilities) ne l'est pas. **Hypothèse** : à mapper sur les rôles existants du CMS (admin/formateur).

## 6. Importation et exportation

Source : https://rankmath.com/kb/import-export-settings/ (officiel) ; recherches sur l'import Yoast (observation, résultats de recherche non lus en page complète).
- Chemin : Status & Tools → Import & Export (mode avancé).
- **Export** de cinq groupes : Général, Titres & Meta, Sitemap, Role Manager, Redirections. Fichier horodaté ne mémorisant pas les groupes choisis.
- **Import** : remplace les réglages courants ; sauvegarde automatique préalable. **Sauvegarde/restauration** en un clic ; la restauration ne sauvegarde pas l'état courant.
- **Importateurs** d'extensions : Yoast, AIOSEO, SEOPress, Redirection, Schema Pro, All In One Schema. Le détail des champs convertis n'est pas listé dans la page lue (voir Lacunes). Un résultat de recherche indique que l'option « Calculate SEO Scores » peut gêner un import Yoast (contournement : la décocher) — **observation** (ticket de support).
- **CSV** (méta d'articles, termes, utilisateurs) : exporter, modifier dans un tableur, réimporter ; **PRO**. Clés de méta citées par le support : `_rank_math_title`, `_rank_math_description` (observation).
- Pertinence Kolakisa : export/import des réglages SEO en JSON et CSV de méta par contenu = **fort intérêt** (hypothèse), car tout est en base SQLite.

## 7. Instant Indexing
Mentionné par la page Advanced Mode : soumission manuelle d'URL, historique, clé IndexNow (officiel). Le détail n'a pas été lu : voir doc 18 (réservé).

## 8. Sources
| URL | Consultée | Nature |
|---|---|---|
| https://rankmath.com/kb/how-to-setup/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/general-settings/ | 2026-10-29 | officiel (100 000/105 082 car.) |
| https://rankmath.com/kb/advanced-mode/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/role-manager/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/import-export-settings/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/how-to-edit-robots-txt-with-rank-math/ | 2026-10-29 | officiel |
| Recherche web restreinte à rankmath.com (import Yoast, modules) | 2026-10-29 | observation (extraits de moteur, pages non lues) |

## 9. Lacunes
- `kb/modules/` : 404 ; liste des modules non confirmée.
- Détail des données importées depuis Yoast/AIOSEO/SEOPress : non documenté dans les pages lues.
- Page Role Manager : défauts par rôle non fournis ; niveau gratuit/PRO non précisé.
- Onglet Instant Indexing de General Settings non lu (fin de page non récupérée : 5 082 caractères).
- Format exact du fichier du « mode Personnalisé » : non documenté.
