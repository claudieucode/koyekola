# KOLAKISA — Éditeur de pages : état de référence (phase 0, 8 octobre 2026)

Audit fait AVANT toute modification, sur `main` (commit 9482c0d). Les faits ci-dessous viennent du code (extraits par
`nodes.editorSpec()` et lecture des fichiers), pas de la mémoire. Un audit antérieur très détaillé existe déjà :
`docs/editeur-pages-audit.md` (missions V2, V3 et « Étape 1 bibliothèque façon Elementor », 7 octobre 2026). Ce document
ne le remplace pas : il le résume et sert de base à l'inventaire `ELEMENTOR_FEATURE_INVENTORY.md`.

## 1. Constat principal
L'éditeur n'est pas à construire : **66 types d'éléments, 86 propriétés de style, responsive 3 écrans, états, mouvement,
interactions, composants, modèles, en-tête/pied, conditions d'audience, versions, historique, règles/guides/magnétisme**
existent déjà et sont testés (221 fichiers de tests). La mission consiste donc à **combler des écarts précis**, pas à refaire.

## 2. Architecture (à conserver)
| Domaine | Où | Notes |
|---|---|---|
| Document | table `mk_landing_pages` (brouillon, publiée, versions) ; contenu `{ sections, title, description, seo, theme }` | `src/marketing/pages/index.js` |
| Grammaire des éléments | `src/marketing/pages/nodes.js` : `NODE_TYPES`, `WIDGETS`, `WIDGET_GROUPS`, `registerWidget`, `STYLE_PROPS`, `capsOf` | validée côté serveur, aucune valeur libre |
| Registre de widgets | `src/marketing/pages/widgets/index.js` (+ `profilecard.js`) : ID, libellé, catégorie, groupe, icône, mots-clés, capacités, version, permissions | `registerWidget()` existe déjà |
| Styles | `STYLE_PROPS` (86), écrans `BREAKPOINTS` (ordinateur / tablette / mobile, héritage), états `STATES` (survol, focus, clic) ; CSS généré sous `.kw-n-<id>` | `pageCss`, `cssDeclarations` |
| Rendu unique | `views/marketing-public/_sections.ejs`, `_node.ejs`, `views/marketing-public/widgets/` | même rendu pour canevas, aperçu, page publiée |
| Éditeur (client) | `public/js/page-builder.js` (~5300 lignes, sans dépendance), `-menu.js`, `-effects.js`, `-snap.js`, `-rules.js`, `site-settings.js` ; `views/marketing/page-builder.ejs` ; CSS `page-builder.css`, `landing.css` | |
| Design system de site | `tokens.js` (couleurs, polices, tailles h1–h6, espacements, rayons, ombres), variables `--kw-*`, `siteSettings.js`, `themeCss.js` | édité dans Site Web › Réglages du site |
| Composants / modèles | composants synchronisés ou copies, modèles de pages, blocs (`patterns.js`, 22), export / import JSON (`EXPORT_FORMAT`), migration 042 | |
| En-tête / pied | `siteParts`, `setPageHeader`, variantes d'en-tête par page (migration 044) | |
| Mouvement | `motion.js`, `MOTION`, `SCROLL_FX`, `MOUSE_MODES`, interactions (`ixTriggers`, `ixActions`), animations d'entrée / survol | |
| Conditions | `AUDIENCES` (contacts, clients, abonnés, élèves, étiquettes, score) + programmation par dates ; `visibleTree` | |
| Sauvegarde | auto 1 s, manuelle, copie locale, conflit 409, fermeture protégée, 150 étapes d'annulation, révisions persistées | |
| Aperçu / publication | `/apercu`, `/p/<adresse>`, publication validée serveur | |
| SEO | moteur SEO du site réutilisé (`normalizeSeo`) ; fil d'Ariane avec données structurées | pas de second moteur |
| Formulaires | module Formulaires d'inscription (`src/marketing/forms`) relié au widget `signupform` | pas de doublon |
| Pop-ups | module Marketing › Pop-ups ; élément `modal` (fenêtre / panneau latéral) dans la page | |
| E-commerce | moteur de formations (panier en session, SQLite) ; éléments `course`, `addtocart`, `courselist`, `courserating`, `account` | |
| Médias | médiathèque existante (`openMedia`), audit des médias | |
| Utilisateurs / auth | SQLite `users`, rôles formateur / élève, session | |

## 3. Éléments existants par catégorie (66)
- **structure (8)** : container, columns, column, grid, stack, group, spacer, divider
- **text (11)** : heading, text, list, quote, code, badge, timeline, alert, iconlist, table, animatedheading
- **media (10)** : image, gallery, video, audio, carousel, hotspot, map, imagebox, iconbox, icon
- **interaction (15)** : button, link, accordion, tabs, menu, toggle, breadcrumb, social, sharebuttons, modal, tooltip, flipbox, toc, readingprogress, menuanchor
- **marketing (9)** : progress, counter, testimonial, pricing, countdown, pricelist, signupform, rating, profilecard
- **advanced (2)** : html (nettoyé), embed (YouTube, Vimeo, Maps, Calendly, Spotify, SoundCloud, Typeform, Loom, Canva…)
- **dynamic (8)** : posts, courselist, search, account, dyntext, sitelogo, sitetitle, copyright
- **commerce (3)** : course, addtocart, courserating

## 4. Refus volontaires et documentés (sécurité) — maintenus
Les pages marketing sont servies sur le même domaine que les comptes des élèves. Donc : **pas de JavaScript libre**, pas
d'attributs d'événement, pas de CSS avec ressources externes, pas d'envoi de SVG (un SVG peut contenir du script ; le SVG
collé dans l'élément HTML est nettoyé et accepté), pas de position absolue libre dans un flux responsive (positions
`absolute` / `fixed` avec décalages existent pourtant, voir V2), pas de bibliothèque Lottie locale, pas de champs de
formulaire comme éléments séparés (doublon du module Formulaires).

## 5. Dette et risques connus
- `page-builder.js` est un seul fichier de ~5300 lignes ; d'autres sessions le modifient en parallèle (conflits fréquents).
- Les pages du blog, les archives, la recherche et la 404 sont rendues par le blog / le site principal, **pas** par le moteur de pages.
- Le moteur e-commerce est celui des **formations** (pas de produits physiques, pas de stock réel).
- Les tests navigateur demandent Playwright + Chrome (voir `docs/regles-et-magnetisme.md`).

## 6. Règles de travail pour la suite
Ne rien supprimer ; étendre `NODE_TYPES` / `STYLE_PROPS` / `registerWidget` ; réutiliser blog, SEO, formulaires,
médiathèque, panier ; chaque contrôle visible doit être validé serveur, enregistré, rendu (canevas, aperçu, publication)
et testé ; aucune dépendance à Elementor.
