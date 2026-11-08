# Pied de page : rendu unifié (chantier A, 7 novembre 2026)

But : un pied de page du Theme Builder s'affiche de la même façon sur les trois chemins publics (pages du Page Builder, pages du site comme le blog, boutique), avec la garantie « un seul pied par page ».

## 1. Avant / après

| Sujet | Avant | Après |
|---|---|---|
| Boutique `/boutique/*` | pied fixe `<footer class="sh-foot">` toujours ; le pied du Theme Builder n'y était jamais affiché (`views/boutique/_bottom.ejs`) | `_bottom.ejs` affiche `themeFooter` (calculé par `themeLayout` comme pour le blog) quand un modèle s'applique ; sinon le pied fixe d'origine, identique à l'octet près. Page de commande : toujours le pied d'origine (`commande.ejs` passe `keepShopFooter`) |
| Blog / pages du site | pied TB sans zones de widgets de pied (`footer-1/2`) ni ligne légale | les deux sont ajoutés DANS le pied, comme sur les pages du Page Builder : `themeRender.renderVm` passe `legalSite`, `_sections.ejs` calcule la ligne légale si `landing.ejs` ne la fournit pas |
| Balise | `<div class="lp-block … lp-site-footer">` (aucun repère « contentinfo ») | `<footer role="contentinfo" data-kw-footer="1">` posé UNE fois dans `views/marketing-public/_sections.ejs` (début de la boucle des sections) |
| Modèle qui contient déjà un `<footer>` | sans objet | si un conteneur du modèle a `tag = footer` (ou un bloc HTML contient `<footer`), l'enveloppe reste un `<div data-kw-footer="wrap">` : jamais de `<footer>` imbriqué |
| Pied « de démonstration » d'un thème en paquet | s'ajoutait à la page (130 paquets sur 135 ont une section HTML qui commence par `<footer>`) en plus du pied du site | retiré à l'affichage quand le site a un pied (`isPackFooterSection`, `src/marketing/pages/index.js`, dans `withSiteParts`) |
| Pied de bas de page d'origine (`<footer class="lp-foot">`) sur une page qui porte déjà un `<footer>` (paquet sans pied TB) | deux `<footer>` | `landing.ejs` : la ligne de bas de page reste, mais en `<div class="lp-foot">` (`packFoot`) |

Une seule logique de résolution : `src/themeBuilder/render.js` (`resolveParts`, mise en cache par `store.stampOf`). Une seule logique de rendu : la section `sitePart = footer` rendue par `_sections.ejs` (chemin A : `withSiteParts` ; chemin B/C : `themeRender.renderParts` → `renderVm`). Aucune requête supplémentaire : la boutique utilisait déjà `themeLayout` (le calcul se faisait et le résultat était ignoré).

## 2. Fichiers touchés (chantier A)
* `views/marketing-public/_sections.ejs` : balise `<footer>`, repère `data-kw-footer`, ligne légale automatique.
* `views/marketing-public/landing.ejs` : `packFoot` (pas de second `<footer>`).
* `views/boutique/_bottom.ejs`, `views/boutique/commande.ejs` : pied TB dans la boutique, pied d'origine sur la commande.
* `src/marketing/web/themeRender.js` : `legalSite` passé au rendu (une option, une ligne).
* `src/marketing/pages/index.js` : `isPackFooterSection` et filtrage dans `withSiteParts`.
* `tests/footer-rendu-unifie.test.js` (nouveau).

## 3. Comportement des cas limites
* **Aucun modèle de pied sur le site** : comportement historique exact (page éditeur : `<footer class="lp-foot">` ; blog : pied d'origine `site-footer` ; boutique : `sh-foot`).
* **Un modèle existe mais la page est exclue** : pas de pied Theme Builder, et jamais l'ancien pied (`mk_sites.footer_component_id` n'est pas repris, drapeau `managed`). Le pied « d'origine » du chemin concerné s'affiche une fois (`lp-foot`, `site-footer`, `sh-foot`). Ce n'est pas un pied fantôme : c'est le repli documenté ; pour n'avoir AUCUN pied sur une page, il faut un modèle de pied qui la couvre et qui soit vide.
* **Boutique, page de commande/paiement** : pied fixe d'origine, jamais le pied du Theme Builder (les autres pages boutique, y compris panier et compte, affichent le pied TB s'il s'applique).
* **Boutique, conditions** : la résolution lit le contexte de la route (catalogue = archive produits, fiche = produit) ; panier, compte, etc. sont vus comme « page » tant que le chantier B n'a pas ajouté de vues dédiées (non traité ici).
* **Modèle contenant lui-même un `<footer>`** : un seul `<footer>`, mais la ligne légale et les zones de widgets (ajoutées par le moteur) sont dans l'enveloppe `<div data-kw-footer="wrap">`, hors de ce `<footer>`.
* **Page du Page Builder** : le pied est dans `<main class="lp-main">` (le compteur de liens `/clic/N` oblige à le rendre avec les sections). Le rôle `contentinfo` est donc explicite. Limite connue.
* **Éditeur visuel (canevas)** : inchangé (`<div>`, sans repère), pour ne pas gêner la sélection.
* **Thème en paquet** : sa section de pied de démonstration est masquée à l'affichage quand le site a un pied (elle reste dans la page, visible dans l'éditeur, rien n'est supprimé). Sans pied de site, elle reste le pied et la ligne de bas de page passe en `<div>`.
* **Isolation** : la résolution filtre toujours `site_id` et organisation (`render.published`) ; la boutique reçoit le site de l'hôte (`req.kwSite`), jamais un identifiant fourni par le navigateur. Testé (deux sites, blog, boutique, page).
* **Performance** : aucune requête ajoutée par page ; seul coût nouveau : 2 appels de rendu de la ligne légale pour le blog (déjà fait par le chemin A).

## 4. Tests
`tests/footer-rendu-unifie.test.js` (serveur réel) : repli sans modèle ; même pied et un seul `<footer data-kw-footer>` sur page éditeur, blog, article, catalogue et panier ; zones de widgets + ligne légale dans le pied sur blog et boutique ; 10 puis 25 éléments ; commande ; exclusion ; isolation ; `<footer>` natif ; thème en paquet ; site principal.

Résultats (exécutés, état de la branche avec les autres chantiers en cours) : `footer-rendu-unifie` 10/10. Suites existantes, avant (HEAD) / après : noyau 14/14 → 14/14 ; regles 12/12 → 12/12 ; pied-unique 4/4 → 4/4 ; pied-de-page-coherence 7/7 → 7/7 ; pieds-identites 4/4 → 4/4 ; stabilisation 14/14 → 14/14 ; site-principal 6/6 → 6/6 ; site-web-entete 4/4 → 4/4 ; programme20-5-boutique-serveur 29/29 → 29/29 ; menus-site-public 8/8 → 8/8 ; cms-tunnel-web 15/15 → 15/15 ; apparence-widgets 30/30 → 30/30 ; widgets-theme-builder-unicite 6/6 → 6/6 après adaptation de son assistant `footerPart` (il cherchait un `<div>` ; le pied est maintenant un `<footer>`). Échecs identiques avant et après (préexistants) : pieds-bibliotheque 16/17 (« les 100 aperçus… ») ; site-web-reglages-theme 19/21.

Limite : la page « introuvable » d'un site à domaine propre n'est habillée que si le site a une page d'accueil en ligne (comportement existant de `siteHost.neutralErrors`) ; elle n'est pas couverte par le test de ce chantier côté site (couverte côté site principal).
