# Plan de correction progressif (chaque étape = validation de l'utilisateur avant la suivante)

| # | Objectif | Périmètre | Fichiers probables | Critères de validation |
|---|---|---|---|---|
| 0 | Reproduire le défaut avec les captures (à fournir) et mesurer la largeur réelle | Lecture/navigateur uniquement | aucun | Largeur mesurée de `.kw-theme-header`, `.lp-main`, scrollWidth à 375/768/1280/1920/2560 |
| 1 | Poser les jetons de largeur (valeurs de repli = valeurs actuelles) | CSS seul, aucun comportement changé | `landing.css`, `siteSettings.js` (émission) | Rendu pixel identique sur 5 pages témoins ; tests existants verts |
| 2 | En-tête Theme Builder : extérieur 100 %, intérieur calé | `kw-theme-header` uniquement | `themeRender.js` (CSS de bande), `landing.css` | Fond bord à bord à 5 largeurs ; pas de scroll horizontal ; pièces existantes inchangées (comparaison avant/après) |
| 3 | Vérification header multi-résolutions + mobile + clavier | Tests | `tests/header-*.test.js` | Résultats réels fournis |
| 4 | Pied de page Theme Builder (même principe) | `kw-theme-footer` | idem | idem |
| 5 | Vérification footer | Tests | | |
| 6 | Colonne principale `.lp-main` (sites sans pack) : relever le défaut par jeton | Sites SANS réglage explicite uniquement | `landing.css`, `siteSettings.js` | Sites ayant un réglage : inchangés |
| 7 | Vues EJS : `.container-wide` → jeton ; grilles | `style.css`, `boutique.css` | | Colonnes 1440/1920/2560 mesurées ; pas de déformation d'image |
| 8 | Articles et pages simples | `single-post.css`, `views/blog/show.ejs` | | lecture ≤ 75 ch |
| 9 | Archives, recherche | | | |
| 10 | E-commerce | `boutique.css` | | panier/commande intacts |
| 11 | Packs : lecture du jeton quand `--pk-max` absent | `base.css` | | 133 packs : rendu inchangé pour ceux qui définissent leurs valeurs |
| 12 | Theme Builder : conditions d'affichage, pas de doublon header/footer | Tests | `tests/theme-builder*` | |
| 13 | Éditeur : vérifier l'application des réglages existants sur le site publié ; documenter les évolutions | Lecture | | Rapport |
| 14 | Non-régression + audit final | `scripts/audit-interface.js`, `audit-qualite.js`, `audit-responsive.js`, tests `*navigateur*` | | Résultats réels |

Chaque étape : annonce → périmètre exact → autorisation → modification → tests ciblés → résultats réels → attente de validation.
