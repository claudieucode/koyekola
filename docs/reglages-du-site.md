# Réglages du site (éditeur de pages KOLAKISA)

Centre de configuration global d'un site, ouvert depuis le **menu principal de l'éditeur de pages → « Réglages du site »**.
Un panneau à gauche du canevas : la page reste visible et se met à jour à chaque enregistrement.

## Une seule source de vérité

| Donnée | Où | Validée par | Traduite en CSS par |
|---|---|---|---|
| Couleurs (système + personnalisées), polices, typographie, liens, listes, boutons, images, champs, rayons, ombres, espaces | `mk_sites.tokens` (JSON) | `src/marketing/pages/tokens.js` | `tokens.js` (variables `--kw-…`) et `themeCss.js` (règles du thème) |
| Nom du site | `mk_sites.name` | `pages/index.js › saveSiteDesign` | — |
| Identité, arrière-plan, mise en page, visionneuse, transitions, CSS du site, réglages supplémentaires | `mk_sites.settings` (JSON) | `src/marketing/pages/siteSettings.js` | `siteSettings.js` (`siteAssets`) |
| Concurrence | `mk_sites.settings_revision` | `saveSiteDesign` (409 si dépassée) | — |

Le canevas de l'éditeur (`POST /marketing/pages/:id/rendu`), l'aperçu et la page publiée (`/p/<adresse>`) utilisent le **même
gabarit** (`views/marketing-public/landing.ejs`) et lisent `site.assets` calculé par `parseSite` : aperçu = publié.

API : `GET` / `PUT /marketing/site-web/sites/:id/reglages.json` (`{ tokens, settings, name, revision }`).
Droits : lecture `forms.read`, écriture `forms.write`, **CSS du site : `pages.code`** (comme le widget HTML).

## Hiérarchie des styles (le plus précis gagne)

1. Réglages globaux du site : variables `--kw-…` lues par `landing.css`.
2. Styles du thème : `themeCss.js`, sélecteurs en `:where(…)` (spécificité minimale), écrits **avant** les styles des éléments.
3. Style d'un élément posé dans l'inspecteur (`.kw-n-<id>`, par écran et par état) : écrit **après**, il l'emporte toujours.
4. CSS personnalisé du site (chaque sélecteur préfixé `.lp-site`) : il l'emporte par la spécificité de ses sélecteurs.
5. CSS de la page (préfixé `.lp-main`).

Seules les valeurs réglées produisent du CSS : un site non réglé garde exactement son aspect d'origine.

## Ce que chaque écran fait réellement

- **Couleurs globales** : 10 couleurs du système + jusqu'à 30 couleurs personnalisées (clé `c-…`, référencée par `token:c-…`
  dans les widgets, proposées dans le sélecteur de couleur de chaque élément). Usage compté par page ; suppression refusée
  tant qu'une couleur est utilisée.
- **Polices globales** : titres, texte, boutons, liens (5 familles servies localement ou système, aucun service tiers).
- **Typographie** : H1–H6, texte, légende, bouton (taille, graisse, hauteur de ligne, espacement, casse, style, couleur),
  liens (couleur, survol, soulignement), listes (écart, couleur des puces).
- **Boutons** : marges, bordure, rayon, hauteur, ombre ; couleurs et états normal / survol / clic ; contour au focus.
  Les couleurs et états visent les boutons principaux ; « outline » et « ghost » gardent leur apparence.
- **Images** : rayon, bordure, ombre ; ajustement et position pour les images à format imposé (galeries, carrousels, cartes).
- **Champs de formulaire** : fond, texte, bordure, rayon, marges, focus, aide à la saisie, libellés, cases et radios.
  Le bouton d'envoi suit les boutons.
- **Identité** : nom, description (repli des pages sans description), logo (pied de page, image de partage par défaut),
  logo mobile, favicon, `og:site_name`.
- **Arrière-plan** : couleur, dégradé, image, position, taille, répétition, fixe (ordinateur seulement).
- **Mise en page** : largeur du contenu, pleine largeur, largeur des conteneurs, marges latérales, espace entre sections,
  **points de rupture** tablette / mobile (appliqués aux styles « Tablette » / « Mobile » des éléments et à « Masquer sur cet
  écran » ; les adaptations internes de chaque composant gardent leurs propres seuils).
- **Visionneuse** : activation, fond et opacité, flèches, fermeture au clic extérieur, légendes, animation (galeries d'images).
- **Transitions de page** : aucune / fondu / glissement via l'API *View Transitions* du navigateur ; sans effet sur les
  navigateurs qui ne la connaissent pas ; jamais dans l'éditeur ; désactivée si « moins d'animations » est demandé.
- **CSS personnalisé** : 20 000 caractères, mêmes interdits que le CSS de page (aucun `@`, `\`, `<`, `>`, commentaire,
  ressource externe ; pas de sélecteur `html` / `body` / `:root`).
- **Réglages supplémentaires** : langue des pages, défilement doux, ne pas indexer le site.

## Limites connues (volontairement non simulées)

- Les réglages s'appliquent **immédiatement** aux pages en ligne (pas de brouillon de réglages distinct du publié).
- Annuler / Rétablir est propre au panneau (Ctrl/⌘ + Z quand le focus y est) : il n'est pas fondu dans l'historique du contenu de la page.
- Pas de scripts ni de code `<head>` personnalisés (risque de sécurité et de conformité au consentement).
- Les polices proposées sont celles déjà servies par le site ; en ajouter demande de les héberger.
- Les widgets « logo du site » et « titre du site » (lot 6 Site, autre session) liront ces mêmes réglages d'identité.
