# KOLAKISA — Design system de l'administration (CMS et Marketing) · v2 « Marine & lumière »

Branche `refonte-visuelle-cms`. Ce document décrit l'état **réel** de la refonte visuelle : ce qui a changé, où se trouve la source de chaque règle, comment ajouter un écran sans casser la cohérence, et ce qui n'est pas traité.

## 1. Audit de départ (écrans réels, 1440 px, base de démonstration)

Écrans relevés avant travaux : tableau de bord, articles, pages, médiathèque, commentaires, utilisateurs, réglages, styles, redirections, sites, outils, SEO, taxonomies, navigation (79 écrans du menu du CMS parcourus et capturés).

Défauts constatés, mesurés sur l'ancien code (même base, mêmes données) :

| Défaut | Constat mesuré |
|---|---|
| Fil d'Ariane | 6 à 7 niveaux (« Mon espace / Marketing / Site Web / Mes sites / … »), **tous tronqués** en « Mon es… / Marke… » |
| Barre du haut | 6 commandes dont **2 boutons désactivés** (notifications, aide « bientôt ») : bruit sans fonction |
| Menu latéral | liste plate de 16 rubriques sans repères de groupe ; état actif par liseré épais ; sélecteur de site dans la barre du haut |
| Titres | `h1` à 30 px, graisse et interlignage hérités du site public ; descriptions pleine largeur |
| Listes « à la WordPress » | états en liens séparés par « \| » (soulignés), champ de recherche sans icône, actions de ligne séparées par « \| » |
| Tableaux | en-têtes en petit gras, lignes à bordures doubles, cellule de titre à fond différent, lignes de 170 px à cause des actions de ligne |
| Champs | hauteurs 44 à 46 px, retrait et rayons hétérogènes d'une famille d'écrans à l'autre |
| Alertes | fonds codés en dur, illisibles hors thème clair |
| Mode sombre | **inexistant** (seule la couleur du menu de gauche était réglable) |
| Icônes | trait de 2 px, tailles de 14 à 20 px sans règle |

## 2. Direction artistique

**Marine & lumière.** Le bleu marine reste la couleur maîtresse (menu latéral, bandeaux d'action, logo) ; la surface de travail est claire, froide et très peu contrastée en arrière-plan (gris bleuté `#f4f6fa`, cartes blanches à filet fin), de sorte que le contenu porte la hiérarchie et non les décorations.

- **Précision d'outil** (référence : Linear) : rayons réguliers, ombres quasi absentes, états nets (survol / sélection / focus), densité maîtrisée.
- **Identité Kolakisa** : logo en carré dégradé bleu, sélecteur de site façon « espace de travail », groupes de navigation en petites capitales, accent bleu ciel sur fond marine.
- **Typographie** : Bricolage Grotesque (titres) et Figtree (texte), déjà auto-hébergées (aucune requête externe, aucune police ajoutée). Échelle : titre de page 26 px / 700, section 18 px / 650, corps 15 px, en-têtes de tableau 11,8 px en capitales, métadonnées 13 px.

## 3. Où est la source (aucun second système)

| Fichier | Rôle |
|---|---|
| `public/css/kola-ui.css` | **Source unique de la charte** de l'administration : jetons clair et sombre, coque, composants, familles d'écrans, corrections du mode sombre. Chargé en dernier par `views/marketing/partials/top.ejs`, **uniquement** dans l'administration (le site public, l'espace élève et l'espace formateur ne le chargent pas). |
| `public/css/style.css`, `marketing.css`, `cms.css` | Conservés tels quels (composants et structure) ; leurs variables sont **redéfinies** par `kola-ui.css`. Les règles devenues inutiles pourront être élaguées écran par écran, à mesure qu'on prouve qu'aucun écran ne les utilise. |
| `public/css/marketing-themes.css` | Couleur du menu (préférence personnelle existante : Clair, Bleu foncé, Gris, Noir) — conservée, palette « Bleu foncé » approfondie. |
| `views/marketing/partials/top.ejs` | Coque : thème résolu avant le premier affichage, menu, barre du haut, menu du compte. |
| `views/marketing/partials/cms-nav.ejs`, `cms-site-switch.ejs`, `cms-topbar.ejs` | Navigation du CMS en groupes, sélecteur de site, barre du haut. |
| `public/js/mk/shell.js` | Comportements (menu, menus déroulants, thème). |

## 4. Jetons

Définis dans `:root` (clair) et `html[data-kola-theme="dark"]` (sombre) de `kola-ui.css`.

- **Couleurs** : marine `--k-navy-950/900/800`, action `--accent` (#0277b6 clair / #1c78bd sombre, texte blanc ≥ 4,5:1), lien `--accent-dark` (#0369a1 / #8fcbf7 ≥ 9:1), surfaces `--mk-bg`, `--mk-surface`, `--mk-surface-2`, filets `--mk-border`, `--mk-border-strong`, `--field-border` (≥ 3:1), texte `--mk-text`, `--mk-text-soft`, `--muted` (≥ 4,5:1 sur toutes les surfaces).
- **Fonctionnelles** : succès, danger, avertissement et information, chacune en fond / bordure / texte (`--k-ok-*`, `--k-err-*`, `--k-warn-*`, `--k-info-*`) avec une valeur par thème.
- **Rayons** : `6` (liens, vignettes) · `8` (champs, boutons, entrées de menu) · `12` (cartes, tableaux, alertes, menus) · `16` (fenêtres) · pastille `999`. Exceptions documentées : carré du logo et bouton large `10`.
- **Ombres** : `--k-shadow-xs/sm/btn`, `--mk-pop` (menus et fenêtres seulement).
- **Hauteurs** : champs 38 px (40 px dans les fenêtres), bouton 36 / petit 32 / grand 44, barre du haut 56 px, entrée de menu 36 px.
- **Mouvement** : `--k-dur-fast` 120 ms, `--k-dur` 180 ms, `--k-ease`. `prefers-reduced-motion` coupe toutes les transitions.
- **Icônes** : jeu existant (Lucide, `src/utils/icons.js`), trait unifié à **1,75 px**, 16 px dans les boutons et menus, 18 px dans la navigation.
- **Superpositions** : échelle `--z-*` d'origine (`style.css`), inchangée.

## 5. Composants refaits

Menu latéral (groupes « Contenu », « Design », « Équipe et audience », « Système » ; état actif = fond + liseré d'accent + icône colorée ; repli en icônes ; tiroir mobile) · sélecteur de site en tête du menu · barre du haut (fil d'Ariane limité aux 3 derniers niveaux, recherche, aperçu du site, « Ajouter », thème, compte) · en-têtes de page · bandeau du site · boutons (primaire, contour, discret, danger, chargement `aria-busy`) · champs, listes, cases, sélecteurs de couleur, fichiers · cartes et panneaux · cartes de chiffres cliquables · tableaux (en-têtes, lignes, sélection, actions de ligne sur une ligne, pagination) · onglets · segments d'état · pastilles · alertes et notes · menus · fenêtres · états vides · zones de dépôt · médiathèque · cartes de thèmes · taxonomies · utilisateurs · réglages.

## 6. Mode clair / sombre

- Attribut `data-kola-theme="light|dark"` sur `<html>`, posé **avant le premier affichage** par un script en `<head>` (aucun clignotement) ; préférence `data-kola-pref="light|dark|auto"` mémorisée dans `localStorage` (`kolaTheme`, même mécanisme que le repli du menu `mkSidebar`).
- Par défaut : **Automatique** (suit le système, y compris en direct). Le bouton de la barre du haut alterne clair ↔ sombre ; le menu du compte propose Clair / Sombre / Auto.
- La bascule coupe les transitions le temps d'une image (`data-kola-switching`) : aucun fondu, aucun décalage.
- `color-scheme` suit le thème (champs natifs, barres de défilement) ; `meta theme-color` est mis à jour.
- La couleur du menu (Clair / Bleu foncé / Gris / Noir) reste indépendante et fonctionne dans les deux thèmes (vérifié : 6 combinaisons).

## 7. Vérifications réalisées (résultats réels)

Environnement : application lancée sur une **base jetable** avec des données de démonstration (8 articles, 8 pages, 8 médias, commentaires, redirections, 2 sites), Chrome 1440 × 900, 390 × 844 pour le mobile.

| Contrôle | Avant | Après |
|---|---|---|
| axe-core (WCAG 2.1 A/AA), 76 écrans du CMS, **clair** | 1 violation (contraste, 1 écran) | **0** |
| axe-core, 76 écrans du CMS, **sombre** | — (mode inexistant) | **0** |
| axe-core, 14 écrans Marketing, clair et sombre | — | **0** |
| Éléments du fil d'Ariane visibles / tronqués | 6-7 / 6-7 | 3 / **0** |
| Commandes de la barre du haut (dont désactivées) | 6 (2) | 4 (**0**) |
| Hauteur des champs | 44-46 px | 38 px (uniforme) |
| Titre de page | 30,4 px | 26 px |
| Débordement horizontal à 1440 px | aucun | aucun |
| Focus clavier visible sur 40 arrêts de tabulation | non mesuré | oui (anneau de 2 px sur les 40) |
| Bascule de thème : mémorisation, rechargement, « Auto » en direct, premier affichage | — | vérifiés par script (7 scénarios) |
| Poids CSS de l'administration (gzip) | ≈ 86 Ko | ≈ 97 Ko (+11 Ko pour `kola-ui.css`) |

Chargement local (médiane de 8 chargements de « Articles », cache navigateur actif) : premier affichage 196 → 228 ms, DOMContentLoaded 95 → 71 ms, fin de chargement 101 → 141 ms. Mesures locales, dans le bruit de l'environnement : pas de dégradation significative constatée, mais aucune amélioration non plus.

Tests : voir le rapport de livraison (section « Tests »).

## 8. Limites connues (à ne pas confondre avec « fait »)

- **Éditeurs plein écran à coque propre, non refaits** : Page Builder, éditeur d'articles (`/formateur/blog/…`), canevas d'automatisation (le canevas hérite du thème, pas ses composants internes). Ils gardent leur identité et restent clairs ; leur refonte est un périmètre distinct (chacun a sa propre feuille de 1 800 à 2 200 lignes). L'aperçu d'un e-mail reste blanc par nature.
- **Anciennes règles non élaguées** : `marketing.css` et `cms.css` contiennent encore des règles redéfinies par `kola-ui.css`. Les supprimer exige de prouver écran par écran qu'elles ne servent plus ; non fait ici pour ne pas risquer de régression.
- **Couleurs en dur restantes** dans certains écrans spécialisés du Marketing (Page Builder, canevas, éditeur d'e-mails) : non corrigées en mode sombre au-delà de la coque.
- **Rail « Mon espace »** (barre d'icônes à gauche) : conservé, seulement affiné (rayons, trait).
- **Écrans que je n'ai pas pu exercer avec des données** : certaines vues ne se remplissent qu'avec des intégrations externes (envoi réel, réseaux sociaux, paiements) ; leur coque est vérifiée, pas leur contenu réel.
- **Préférence de thème** : mémorisée par navigateur (pas par compte), comme le repli du menu.

---

# v3 « Marine & lumière — Atelier » : recomposition des écrans

La v2 posait les jetons et les composants ; la v3 **recompose les écrans** (en-têtes, tableau de bord, états vides, réglages, mouvement) et introduit une **bibliothèque d'illustrations**. La charte (marine, bleu d'action, Bricolage Grotesque / Figtree) est inchangée.

## Fichiers

| Fichier | Rôle |
|---|---|
| `public/css/kola-compose.css` | Feuille de composition, chargée après `kola-pages.css` (voir `partials/top.ejs`). Sommaire : illustrations · jetons `--kx-*` · menu et coque · en-têtes · états vides · tableau de bord · cartes · listes et tableaux · réglages et interrupteurs · mouvement · écrans étroits. |
| `src/utils/illustrations.js` | 24 scènes SVG en ligne, helper `illu(nom, { label?, className? })` exposé aux vues (`middlewares/locals.js`). Couleurs via variables `--a-*` : clair et sombre automatiques. Les noms d'icônes (`icon()`) servent d'alias de scène. |
| `views/marketing/partials/kx-hero-open.ejs` / `kx-hero-close.ejs` | En-tête de module illustré (paire ouvrante / fermante). |
| `views/marketing/partials/kx-empty.ejs` | État vide : scène, titre, texte, action principale et secondaire. |
| `views/marketing/partials/kx-dashboard.ejs` | Tableau de bord d'un site (modèle fourni par `siteSpace.js`). |

## Règles d'usage des illustrations

- Une scène par **accueil de module** (en-tête illustré) et par **état vide** ; jamais dans un tableau dense, un formulaire technique ni un éditeur.
- Un en-tête illustré et l'état vide du même écran n'utilisent jamais la même scène (l'état vide perd alors sa scène).
- Décoratives par défaut (`aria-hidden`) ; ajouter `label` seulement si la scène porte une information.
- Pour ajouter une scène : une fonction dans `SCENES`, un alias éventuel dans `ALIASES`, une vérification sur la planche (clair + sombre).

## Écrans recomposés

Tableau de bord du site, SEO (vue générale), Extensions, Éditeur du site (Apparence), Redirections, Thèmes, Médiathèque, Utilisateurs, Navigation, Outils (Santé du site, Diagnostic, Sauvegardes, Importer, Exporter, Informations système, Maintenance, Caches, Outils de contenu), Paramètres (Général), Commentaires (barre d'états et de filtres). États vides illustrés : 52 emplacements dans 45 vues.

## Mouvement

Entrées de 0,3 à 0,5 s (opacité + déplacement de 8 px, propriétés composées), survol des cartes (élévation de 2 px), menus et fenêtres (0,16 à 0,2 s), flottement lent des scènes de l'en-tête. `prefers-reduced-motion: reduce` coupe tout.

## Corrections de défauts existants

- `adminbar.css` : l'info-bulle de la barre d'administration s'appliquait à **tous** les `[data-tip]` de la page et créait un défilement horizontal de 34 px (Redirections, Médiathèque). Elle est désormais limitée à `.kab`.
- Barre d'outils des Commentaires : sélecteurs pleine largeur empilés → barre d'états en pastilles + filtres sur une ligne.
- Barres d'onglets Outils et Paramètres : plus de retour à la ligne sur deux rangées.

## Limites (v3)

- **Éditeurs plein écran** (Page Builder, Blog Studio, Personnaliser, canevas d'automatisation) : non recomposés ; ils héritent seulement des correctifs communs.
- Les anciennes règles de `marketing.css` / `cms.css` redéfinies par les couches suivantes ne sont pas élaguées.
- Les listes d'articles et de pages gardent leur bande d'en-tête (kola-pages.css) : pas d'illustration, seulement leur état vide.
