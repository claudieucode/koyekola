# 11 - Accessibilité d'un header (recherche Elementor, pour Kolakisa)

Légende : [NATIF] [PRO] [EXPÉRIMENTAL] [EXTENSION] (module tiers) ; « NON VÉRIFIÉ » = pas confirmé par une source lue.
Les passages « Recommandation Kolakisa » sont des propositions de conception, pas des faits Elementor.

## 1. Ce qu'Elementor affirme officiellement
- La déclaration d'accessibilité d'Elementor (mise à jour août 2025) vise le site/les produits d'Elementor Ltd. Elle cite la norme israélienne 5568, équivalente à WCAG 2.0 niveau AA. Elle ne promet PAS WCAG 2.1/2.2 AA pour les sites construits avec Elementor. Source : https://elementor.com/features/accessibility/ (lue) et https://elementor.com/terms/accessibility/ (résultat de recherche, non lu en entier).
- Elle reconnaît que « certaines pages ou documents peuvent ne pas être entièrement accessibles ». Source : https://elementor.com/features/accessibility/
- Conséquence : l'accessibilité d'un header Elementor dépend en grande partie du thème, des réglages et des tests de l'intégrateur. Kolakisa doit donc viser WCAG 2.2 AA par construction et le prouver par des tests.

## 2. Ce qui est documenté ou rapporté sur Elementor lui-même
| Sujet | Constat | Statut / source |
|---|---|---|
| Widget Onglets | Une expérience (apparue en 3.1.0) retire les ancres vides, ajoute l'état « sélectionné » et améliore le clavier ; active par défaut sur les nouvelles installations seulement | [EXPÉRIMENTAL puis activé par défaut sur nouveaux sites]. Source : https://elementor.com/help/?p=7560 (résultat de recherche, snippet) |
| Widget Menu (nav) | Aucune note de version officielle trouvée sur ARIA/clavier du widget Menu. Des correctifs communautaires existent (retirer des tabindex des sous-items) | NON VÉRIFIÉ côté officiel. Source : https://www.wpadacompliance.com/web-accessibility-did-you-know/improve-elementor-nav-menu-widget/ (snippet de recherche) |
| Off-Canvas | Demande ouverte d'un mode « navigation accessible » (équivalent de celui des Popups) ; rapports de focus coincé sur le bouton de bascule | NON VÉRIFIÉ si corrigé aujourd'hui. Source : https://github.com/orgs/elementor/discussions/27887 (snippet) |
| Skip link | Sur des sites Elementor, la cible `#content` manque souvent (problèmes surtout liés au thème Hello Elementor) -> échec WCAG 2.4.1 | Source : https://equalizedigital.com/how-to-fix-broken-skip-links-in-elementor/ (snippet) |
| Outil officiel | Elementor propose un générateur gratuit de skip link | Source : https://elementor.com/tools/?p=8311265 (snippet) |
| Emplacement du header | Le gabarit Elementor remplace `header.php` du thème (location « header ») ; le thème décide donc de la balise englobante et du `<main>` | [PRO] Theme Builder. Source : https://developers.elementor.com/docs/themes/ (lue) |

Plugins tiers montrant le patron attendu (revendications du fournisseur, non testées) : bouton burger avec `aria-expanded`, `aria-controls`, `aria-label`, `<nav aria-label>`, fermeture par Échap, blocage du défilement du `body`. [EXTENSION] « Valbar Accessible Menu Widget ». Source : https://wordpress.org/plugins/?p=333011 (snippet).

## 3. Exigences à reproduire dans Kolakisa (checklist)
Source de bonnes pratiques générales : WCAG ; bonnes pratiques citées par https://blog.pope.tech/?p=12009 et https://www.levelaccess.com/blog/skip-links-how-to-add-style-and-test-them-for-wcag-2-4-1/ (snippets de recherche). Le reste est Recommandation Kolakisa.

1. Structure sémantique
   - `<header>` (landmark banner) hors de `<main>`, un seul par page ; `<nav aria-label="Navigation principale">` ; listes `<ul><li><a>`. Éviter `role="menu"/"menuitem"` pour une navigation de site : ils n'ajoutent pas le clavier attendu et trompent les lecteurs d'écran (source Pope Tech ci-dessus).
   - Si plusieurs `<nav>` (principal, secondaire, mobile), leur donner des libellés distincts.
   - Logo : lien avec `alt` utile (nom du site) ; image décorative `alt=""`.
2. Skip link
   - Premier élément focusable de la page, visible au focus (position hors écran par CSS, jamais `display:none`), pointe vers une cible existante et focusable (`<main id="contenu" tabindex="-1">`). Test automatisé : la cible existe sur chaque gabarit (cf. fichier 14).
3. Bouton burger / menu mobile
   - Vrai `<button type="button">` avec nom accessible, `aria-expanded` mis à jour en JS, `aria-controls` vers le panneau.
   - Échap ferme le panneau et rend le focus au bouton ; si le panneau est modal (plein écran), piéger le focus et verrouiller le défilement ; sinon ne pas piéger.
4. Sous-menus
   - Ouvrables au clavier (Entrée/Espace sur un bouton dédié à côté du lien parent, `aria-expanded`), pas seulement au survol ; fermeture Échap ; pas de contenu qui disparaît lors du déplacement du pointeur (WCAG 1.4.13).
   - Ordre de tabulation = ordre visuel ; pas de `tabindex` positif.
5. Focus
   - Indicateur de focus visible, contraste >= 3:1, jamais `outline:none` sans remplacement ; le header sticky ne doit pas masquer l'élément focalisé (WCAG 2.4.11 « focus not obscured » : prévoir `scroll-padding-top` égal à la hauteur du header).
6. Contrastes
   - Texte >= 4,5:1 (3:1 grand texte), composants d'interface >= 3:1, y compris sur l'état « scrolled » (header transparent puis plein) et sur l'état survol/focus. Valider les DEUX états d'un header à transparence variable. (Elementor documente un header à transparence sur scroll : https://elementor.com/help/ liste « Change the transparency of a sticky header on scroll », titre seul lu.)
7. Mouvement
   - Respecter `prefers-reduced-motion` : désactiver animations d'entrée, effet de rétrécissement/parallaxe du header, transitions longues. Aucune animation > 5 s sans pause. Elementor : NON VÉRIFIÉ qu'il applique `prefers-reduced-motion` aux effets d'entrée/sticky.
8. Cibles tactiles et zoom
   - Cibles >= 24x24 px (WCAG 2.2), idéalement 44 px ; header utilisable à 200 % de zoom et à 320 px de large (reflow), texte non tronqué.
9. Lecteurs d'écran
   - Icônes (panier, recherche) : texte masqué ou `aria-label` ; badge de quantité annoncé ; la recherche a un `<label>`.
   - Éléments répétés (version desktop + mobile du menu) : un seul doit être exposé (`display:none`/`hidden`, pas seulement opacité), sinon doublon dans l'arbre d'accessibilité.
10. Langue et direction : `lang` sur `<html>` ; sélecteur de langue avec `hreflang`/`lang` sur les liens ; support RTL.

## 4. Pièges observés dans l'écosystème Elementor à éviter
- Cible du skip link absente selon le thème (équalizedigital, ci-dessus).
- Menu qui ne s'ouvre qu'au survol, focus coincé sur le toggle (threads wordpress.org cités par https://wordpress.org/support/topic/any-plugin-developers-who-want-to-help-fix-elementors-accessibility-issues/ ; snippet).
- Doublons desktop/mobile du menu (inférence Kolakisa, NON VÉRIFIÉ côté Elementor).

## 5. Points NON VÉRIFIÉS
- Comportement exact actuel du widget Menu / Off-Canvas d'Elementor (ARIA, Échap, piège de focus) : aucune doc officielle lue.
- Application de `prefers-reduced-motion` par les effets de mouvement d'Elementor.
- Niveau WCAG réellement atteint par les widgets Elementor : seule la déclaration WCAG 2.0 AA du site Elementor est établie.
