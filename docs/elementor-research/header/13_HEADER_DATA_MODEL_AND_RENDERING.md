# 13 - Modèle de données et rendu d'un header (recherche Elementor, pour Kolakisa)

Légende : [NATIF] [PRO] [EXPÉRIMENTAL] [EXTENSION] ; « NON VÉRIFIÉ » = non confirmé par une source lue. On décrit des PRINCIPES ; aucun code Elementor n'est repris.

## 1. Document = JSON stocké en base
- Elementor représente une page/un gabarit comme un JSON (disposition + réglages), produit par l'éditeur (glisser-déposer) et lu par le front pour construire la page. Source : https://developers.elementor.com/docs/data-structure/ (lue).
- Stockage : post meta WordPress dans `wp_postmeta` (clé privée, invisible dans l'admin ; la clé `_elementor_data` est la clé connue de la communauté, la page lue ne la nomme pas : NON VÉRIFIÉ dans la source lue). Même source.
- Exporter un « Template » produit un fichier `*.json` contenant ces données. Même source.

## 2. Structure d'un document exporté
Source : http://developers.elementor.com/docs/data-structure/general-structure (lue).
- Clés de premier niveau : `title`, `type`, `version` (dernière version de structure : 0.4), `page_settings`, `content`.
- `type` du document : `header`, `footer`, `error-404`, `popup`, `page`, `post`... -> un header est un type de document à part entière [PRO] (Theme Builder). Source : https://developers.elementor.com/docs/themes/
- `content` : tableau d'éléments ; chaque élément a `id` (courte chaîne hexadécimale, ex. 8 caractères), `elType` (ex. `container`), `isInner`, `settings`, `elements` (enfants, récursif).
- Un widget est un élément dont `elType` est « widget » et qui porte un `widgetType` ; cette clé n'était pas détaillée dans la page lue : NON VÉRIFIÉ (connaissance générale).
- `settings` / `page_settings` : vide (tableau) si non défini, objet sinon. Particularité à noter : « liste vide » et « objet vide » se confondent en PHP/JSON ; à éviter dans Kolakisa (toujours objet).

## 3. Réglages responsives
Source : http://developers.elementor.com/docs/data-structure/responsive-data (lue).
- Les valeurs responsives sont des clés sœurs dans le même objet `settings` : sans suffixe = desktop ; `_tablet`, `_mobile` ; points de rupture personnalisés `_widescreen`, `_laptop`, `_tablet_extra`, `_mobile_extra`.
- Seuls les appareils modifiés sont enregistrés ; les autres retombent sur la valeur desktop à l'exécution (héritage descendant). Exemple de la doc : `align`, `align_tablet`, `align_mobile`.
- Jusqu'à six points de rupture supplémentaires [NATIF] stable. Source : https://elementor.com/help/what-are-performance-experiments/
- Principe pour Kolakisa : `settings.<clé>` + variantes par appareil, ou mieux un objet `{desktop, tablet, mobile}` par clé (plus lisible, plus facile à valider). À choisir selon la compatibilité d'import voulue. Recommandation Kolakisa.

## 4. Rendu : serveur puis hydratation
- Le rendu final est fait côté serveur (PHP) à partir du JSON ; le JS front ajoute les comportements. Les widgets enregistrent leurs scripts/styles et Elementor ne les charge que si la page utilise le widget. Source : https://developers.elementor.com/docs/scripts-styles/ (lue). Le détail du pipeline de rendu n'est pas dans les pages lues : NON VÉRIFIÉ.
- Un header Elementor remplace `header.php` du thème via les « theme locations » ; le thème doit supporter la location. Sources : https://developers.elementor.com/docs/themes/ (lue). Conditions d'affichage : https://developers.elementor.com/docs/theme-conditions/ (titre seul).
- CSS : Elementor génère un fichier CSS par document (convention « post-ID.css »). NON VÉRIFIÉ dans les pages lues (connaissance générale) ; l'aide mentionne le bouton « Clear Files & Data » qui régénère ces fichiers : https://elementor.com/help/how-to-fix-a-missing-header-or-footer-in-elementor/ (snippet).
- Depuis 3.24, les dépendances de style sont mises en cache en post meta ; styles de widget toujours en `<link>`. Source : https://developers.elementor.com/elementor-3-24-developers-update/
- Element Caching : HTML rendu d'un élément conservé en base et réutilisé [EXPÉRIMENTAL]. Source : https://elementor.com/help/element-caching-help/ (snippet).

Principes retenus pour Kolakisa (Recommandation) :
1. Source de vérité = JSON versionné (`schemaVersion`) ; HTML et CSS sont des dérivés recalculables.
2. Rendu serveur complet (HTML utilisable sans JS) ; JS uniquement pour burger, sous-menus, sticky.
3. CSS compilé par header (hash du JSON dans le nom de fichier = invalidation automatique, évite le « Clear Files & Data » manuel).
4. IDs d'éléments stables, courts, uniques dans le document ; régénérés à l'import en cas de collision.
5. Migrations de schéma : chaque changement de `schemaVersion` a une fonction de migration testée.
6. Conditions d'affichage (toutes pages, types de page, exclusions) stockées à côté du document, pas dans le JSON de contenu.

## 5. Versions et historique
- Éditeur : panneau Historique avec Actions (annuler/rétablir) et Révisions (restaurer une ancienne version publiée). Source : https://elementor.com/help/revision-history-undo-and-redo et https://elementor.com/help/?p=63 (snippets de recherche ; corps d'article non lu).
- Retour arrière du plugin : Elementor > Outils > Version Control. Source : https://elementor.com/help/?p=145 (snippet).
- Restauration du site complet depuis les sauvegardes (hébergement Elementor Cloud) : https://elementor.com/help/restoring-previous-version-website/ (snippet).
- Nombre de révisions conservées : NON VÉRIFIÉ (article « How many versions of a post does Elementor store? » repéré, non lu).
- Recommandation Kolakisa : brouillon / publié séparés, révisions horodatées avec auteur, restauration = nouvelle révision (jamais d'écrasement), limite configurable.

## 6. Import / export
- Format JSON de template (clés §2). Le détail du format « Kit » (ZIP avec manifest) : NON VÉRIFIÉ.
- Sécurité à l'import : voir fichier de sécurité ci-dessous (section 7). Historique : CVE-2020-7055 (import de ZIP malveillant dans Elementor 2.7.4). Source : https://www.incibe.es/en/incibe-cert/early-warning/vulnerabilities/cve-2020-7055 (snippet).
- Recommandation Kolakisa : valider le JSON par schéma, rejeter les clés inconnues, assainir à l'import (pas seulement au rendu), refuser les ZIP à chemins relatifs, limiter la taille.

## 7. Sécurité (périmètre demandé : HTML/attributs/scripts/capacités)
- Code personnalisé [PRO] : snippets HTML/JS/CSS injectables dans `<head>`, début de `<body>`, fin de `<body>`, avec priorité ; pas de PHP. Source : https://elementor.com/help/custom-code-pro/ (snippet).
- Attributs personnalisés [PRO] : saisie `clé|valeur`, une par ligne ; liste noire de noms (id, class, data-id, data-settings, data-element_type, data-widget_type, data-model-cid) modifiable par filtre (source tierce miroir, à vérifier). Source : https://elementor.com/help/custom-attributes-pro/ (snippet) et miroir https://gemfury.com/jsarnowski/php:jsarnowski%2Felementor-pro/-/content/custom-attributes/module.php (non officiel).
- CVE-2024-1364 : XSS stocké via attributs fournis par l'utilisateur dans Elementor Pro <= 3.20.1 (assainissement et échappement insuffisants). Source : https://ocve.arawa.fr/cve/CVE-2024-1364 (snippet). Leçon : échapper à la sortie TOUJOURS, même si assaini à l'entrée ; refuser les attributs `on*`, `style` libre non filtré, `javascript:` dans href/src.
- Envoi de fichiers « non filtrés » (SVG, JSON de templates) : réservé à `manage_options` (administrateur) ; Elementor nettoie le SVG mais prévient qu'un risque subsiste. Source : https://www.pluginvulnerabilities.com/?p=21322 (analyse tierce 3.18.1, snippet).
- `unfiltered_html` : ne bloque qu'une liste d'étiquettes, et le widget HTML d'Elementor est resté éditable par un rôle sans cette capacité selon un rapport utilisateur. Source : https://role-editor.com/forums/topic/forbid-to-edit-html-in-elementor (snippet) ; à ne pas généraliser.
- Role Manager [NATIF] : par rôle « pas d'accès à l'éditeur » ; [PRO] « accès au contenu seulement » (modifier sans ajouter d'éléments ni changer le style). Sources : https://elementor.com/help/role-manager/ (titre seul lu) et https://elementor.com/blog/wordpress-user-roles-elementor-role-manager/ (snippets).
- Safe Mode [NATIF] : mode de dépannage de l'éditeur (plugins désactivés, thème vide, expériences désactivées), sans effet sur les visiteurs ni les autres utilisateurs, Super Admin sur multisite ; ne règle pas les problèmes de rendu public. Source : https://elementor.com/help/what-is-safe-mode/ (lue partiellement) et https://elementor.com/help/debugging-safe-mode/ (snippet).
- Recommandation Kolakisa : trois niveaux de capacités - contenu (textes, liens, images), design (styles, structure), code (HTML/JS/CSS bruts, admin seulement) ; liste blanche de balises/attributs pour tout HTML libre (type KSES) ; CSP stricte sur les pages publiques ; code personnalisé journalisé (auteur, date) et désactivable globalement ; mode sans échec = rendu sans code personnalisé ni extensions.

## 8. NON VÉRIFIÉ
- Noms exacts des clés meta (`_elementor_data`, etc.) dans la doc lue ; `widgetType`.
- Pipeline de rendu côté serveur et génération « post-ID.css » détaillés.
- Format Kit, nombre de révisions, assainissement exact du Custom Code.
