# KOLAKISA — Design system v3 « Marine, à plat » (palier REFONTE-V3, Lot A/B/C partiel)

Branche `refonte-design`. Ce document décrit l'état **réel**. Le registre de suivi (une ligne par vue) est `docs/KOLAKISA_REFONTE_REGISTRE.md`.

## 1. Constat de départ (audit)

Trois familles d'écrans coexistent, avec des niveaux d'avancement très différents :

| Famille | Feuilles | Constat |
|---|---|---|
| **Administration** (coque CMS / Marketing, 118 vues) | `kola-ui.css` v2 « Marine & lumière » (déjà refaite : jetons clair/sombre, menu groupé, composants), `adminbar.css` | Cohérente et soignée ; reçoit la barre d'administration et le fil d'Ariane globaux. |
| **Formateur / gestion / SEO** (~45 vues, gabarit « dash ») | `dashboard.css`, `app-rail.css` | Habillage v2 déjà appliqué (captures : accueil, centre de gestion, SEO). |
| **Site public et espace élève** (~40 vues, gabarit header/footer) | `style.css` (172 Ko) | Identité moderne mais **incohérente avec l'administration** : pastille de marque en dégradé avec reflet (carré « K » plat dans le CMS), pied de page en panneau arrondi à halo radial, bandeaux à quadrillage et dégradés, grandes ombres ; pages d'état et de compte **mal composées** (voir ci-dessous). |

Défauts réels relevés sur les captures initiales (1440 et 390 px), qui justifient les transformations :

- **Panier vide** : contenu rendu dans la première colonne d'une grille à deux colonnes, donc **décalé hors du centre**.
- **Mon compte** : titre aligné à gauche, cartes étroites centrées (désalignement), page longue sans repères.
- **Pages d'erreur** : « Oups » géant en dégradé ; **même titre « Une erreur est survenue » pour un 404 et un 403**, message d'origine répété sous le titre, aucune sortie utile.
- **Aide et support** : le champ « Sujet » n'avait pas `type="text"` — les styles de champ ne s'appliquaient pas (ligne de 20 px).
- **Pastilles d'état** (`dash-status`) : classe définie uniquement dans la feuille de l'espace formateur ; « Nouveau » / « En attente de réponse » s'affichaient en texte brut côté élève.
- **Styles en ligne** nombreux (`style="…"`) dans les certificats, notifications, support, recherche, confirmation de commande, états d'attente.
- **Connexion / inscription** : carte isolée sur fond dégradé, sans repère de marque ni de valeur.
- **Fiche d'une formation** : le résumé répète le titre de la page en `h2`.

## 2. Direction artistique

**Marine, à plat.** Une seule logique pour tout Kolakisa : le bleu marine reste la couleur maîtresse (bandeaux, pied de page, volets de valeur) ; la surface de travail est claire ; la hiérarchie vient de la **couleur, de la typographie, de l'espace et du filet fin**, jamais de dégradés décoratifs, de reflets, de halos ni de grandes ombres. Même pastille de marque (carré plein à l'initiale) dans le site public et dans le CMS.

- **Typographie** : inchangée (Bricolage Grotesque pour les titres, Figtree pour le texte, auto-hébergées) ; titre de page `clamp(1.8rem, 3.4vw, 2.3rem)`, section `1.2–1.3rem`.
- **Couleurs** : aucune couleur nouvelle. La feuille n'utilise que les jetons existants (`--primary` marine, `--accent` action, `--accent-light`, `--surface`, `--border`, `--muted`, `--danger*`, `--success*`) : **elle suit donc Apparence → Personnaliser** (les couleurs du site public y sont modifiables).

## 3. Jetons v3 (`public/css/kola-v3.css`, §1)

| Jeton | Valeur | Usage |
|---|---|---|
| `--kv-r-sm / --kv-r / --kv-r-lg` | 8 / 12 / 16 px | champs et boutons < cartes et lignes < grands panneaux |
| `--kv-line` | `--border` | un seul filet, partout |
| `--kv-gap / --kv-gap-lg` | 24 / 40 px | intervalle entre blocs / entre sections |
| `--kv-dur` / `--kv-ease` | 150 ms / `cubic-bezier(.2,.7,.2,1)` | transitions (couleur de fond, bordure, déplacement de 1 px au clic) |
| `--shadow-sm/md/lg` | redéfinis : 1 px / 16 px à 8 % / 28 px à 10 % | élévation quasi absente |

## 4. Composants (réutilisés partout dans le périmètre)

| Composant | Classe | Remplace |
|---|---|---|
| En-tête de page (titre, sous-titre, actions) | `.kv-pagehead` (`.dashboard-header` aligné dessus) | titres + liens flottants + styles en ligne |
| Onglets / compteur | `.kv-tabs`, `.kv-count` | — (prêt pour les prochains lots) |
| État vide | `.empty-state` + `.kv-empty-ico` | texte nu dans une grille |
| Liste de lignes | `.kv-list`, `.kv-row` (+ `.is-unread`) | cartes à styles en ligne |
| Volet d'accès | `.kv-auth` (+ `partials/auth-aside`) | carte isolée |
| Compte | `.kv-account` + `.kv-account-nav` | colonne unique sans repères |
| Support | `.kv-support`, `.kv-thread`, `.kv-msg` | cartes à styles en ligne |
| Pastilles d'état | `.dash-status` (+ `is-published/draft/archived`) | texte brut côté élève |
| Pages d'état et d'erreur | `.error-page`, `.kv-error-msg`, `.kv-error-search`, `.kv-error-links` | « Oups » géant |

## 5. Périmètre de chargement (isolation du changement)

`kola-v3.css` est chargé par `partials/header.ejs` **uniquement hors du gabarit « dash »** (site public et espace élève). Il n'est chargé ni dans l'espace formateur, ni dans le CMS, ni dans les éditeurs : leurs habillages (`dashboard.css`, `kola-ui.css`, `page-builder.css`…) ne sont pas modifiés par ce lot (test `refonte-design-v3`). Les routes, formulaires, permissions et modèles de données ne changent pas.

## 6. Animations et stabilité

Transitions courtes (150 ms) sur la couleur de fond, la bordure et la couleur du texte ; légère réaction au clic (1 px). Aucune animation décorative permanente ; `prefers-reduced-motion` réduit les transitions à 1 ms ; focus clavier visible (`outline: 2px solid var(--accent)`). Aucun décalage de mise en page n'a été mesuré aux captures (aucun défilement horizontal sur 63 captures).

## 7. Responsive

Volet d'accès : une colonne sous 860 px (le volet se réduit à son titre) ; navigation du compte horizontale et défilante sous 860 px ; lignes de liste qui passent à deux niveaux sous 640 px ; formulaire de recherche d'erreur en colonne sous 480 px. Vérifié sur 390 px pour la connexion et les pages du lot.

## 8. Ce qui reste à faire (hors de ce lot, consigné au registre)

- **Lot D** : inspection individuelle des écrans de l'espace formateur, du centre de gestion, du SEO et des ~118 vues de la coque CMS (seules quelques captures ont été examinées).
- **Lot E** : éditeurs (Page Builder, éditeur du blog, Personnaliser, SEO workspace) — **aucune refonte profonde n'a été entreprise** : elle exige un protocole de non-régression du canvas, de la sélection et des raccourcis.
- Vérification visuelle manquante : réinitialisation du mot de passe, confirmation de commande, paiement en attente, maintenance.
- Accessibilité : aucun audit automatisé (axe-core) n'a été relancé sur le site public dans ce lot ; contrastes des nouvelles pastilles non mesurés.
- Cartes de la grille du catalogue et sections de l'accueil : inspectées, non recomposées.
